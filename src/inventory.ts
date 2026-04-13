import type { Entity, Enemy } from "./entities";
import {
  type InventoryItem,
  type Equipment,
  type EquipSlot,
  type ActiveBuff,
  type GroundItem,
  getTemplate,
  getSlotForCategory,
} from "./items";

const MAX_SLOTS = 20;

export class Inventory {
  items: InventoryItem[] = [];
  equipment: Equipment = { weapon: null, armor: null, ring: null };
  buffs: ActiveBuff[] = [];
  private regenCounter = 0;

  get isFull(): boolean {
    return this.items.length >= MAX_SLOTS;
  }

  get slotCount(): number {
    return this.items.length;
  }

  get maxSlots(): number {
    return MAX_SLOTS;
  }

  tryPickup(
    groundItems: GroundItem[],
    player: Entity,
    onMessage: (msg: string) => void,
  ): boolean {
    const idx = groundItems.findIndex((i) => i.x === player.x && i.y === player.y);
    if (idx === -1) return false;

    if (this.isFull) {
      onMessage("Inventory full.");
      return false;
    }

    const ground = groundItems[idx];
    const template = getTemplate(ground.templateId);
    this.items.push({ templateId: ground.templateId });
    groundItems.splice(idx, 1);
    onMessage(`Picked up ${template.name}.`);
    return true;
  }

  useItem(
    index: number,
    player: Entity,
    enemies: Enemy[],
    fov: Set<string>,
    explored: Set<string>,
    map: Map<string, number>,
    groundItems: GroundItem[],
    onMessage: (msg: string) => void,
    rng: { getUniform: () => number },
  ): boolean {
    const item = this.items[index];
    if (!item) return false;
    const template = getTemplate(item.templateId);

    if (template.category === "weapon" || template.category === "armor" || template.category === "ring") {
      return this.equipItem(index, onMessage);
    }

    if (template.category === "potion") {
      return this.usePotion(index, player, onMessage);
    }

    if (template.category === "scroll") {
      return this.useScroll(index, player, enemies, fov, explored, map, onMessage, rng);
    }

    return false;
  }

  equipItem(index: number, onMessage: (msg: string) => void): boolean {
    const item = this.items[index];
    if (!item) return false;
    const template = getTemplate(item.templateId);
    const slot = getSlotForCategory(template.category);
    if (!slot) return false;

    const current = this.equipment[slot];
    if (current && this.items.length >= MAX_SLOTS) {
      onMessage("Inventory full — can't unequip current item.");
      return false;
    }

    this.items.splice(index, 1);

    if (current) {
      this.items.push(current);
      const oldName = getTemplate(current.templateId).name;
      onMessage(`Unequipped ${oldName}.`);
    }

    this.equipment[slot] = item;
    onMessage(`Equipped ${template.name}.`);
    return true;
  }

  unequipSlot(slot: EquipSlot, onMessage: (msg: string) => void): boolean {
    const current = this.equipment[slot];
    if (!current) return false;

    if (this.isFull) {
      onMessage("Inventory full.");
      return false;
    }

    this.equipment[slot] = null;
    this.items.push(current);
    onMessage(`Unequipped ${getTemplate(current.templateId).name}.`);
    return true;
  }

  dropItem(
    index: number,
    player: Entity,
    groundItems: GroundItem[],
    onMessage: (msg: string) => void,
  ): boolean {
    const item = this.items[index];
    if (!item) return false;

    this.items.splice(index, 1);
    groundItems.push({ templateId: item.templateId, x: player.x, y: player.y });
    onMessage(`Dropped ${getTemplate(item.templateId).name}.`);
    return true;
  }

  tickBuffs(player: Entity, onMessage: (msg: string) => void) {
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      const buff = this.buffs[i];
      // Regen heals 1 HP per turn
      if (buff.type === "regen" && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
        onMessage("You regenerate 1 HP.");
      }
      buff.turnsRemaining--;
      if (buff.turnsRemaining <= 0) {
        this.buffs.splice(i, 1);
      }
    }
    // Ring of Regeneration passive
    const regenRate = this.getEquipRegenRate();
    if (regenRate > 0) {
      // Track via a simple turn counter embedded in the class
      this.regenCounter++;
      if (this.regenCounter >= regenRate && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
        this.regenCounter = 0;
      }
    }
  }

  hasSpeedBuff(): boolean {
    return this.buffs.some((b) => b.type === "speed");
  }

  hasInvisibility(): boolean {
    return this.buffs.some((b) => b.type === "invisibility");
  }

  reset() {
    this.items = [];
    this.equipment = { weapon: null, armor: null, ring: null };
    this.buffs = [];
    this.regenCounter = 0;
  }

  getEquipRegenRate(): number {
    for (const slot of [this.equipment.weapon, this.equipment.armor, this.equipment.ring]) {
      if (!slot) continue;
      const t = getTemplate(slot.templateId);
      if (t.regenRate) return t.regenRate;
    }
    return 0;
  }

  hasLifesteal(): boolean {
    const w = this.equipment.weapon;
    return w ? (getTemplate(w.templateId).lifesteal ?? false) : false;
  }

  getThorns(): number {
    const a = this.equipment.armor;
    return a ? (getTemplate(a.templateId).thorns ?? 0) : 0;
  }

  getBlockChance(): number {
    const a = this.equipment.armor;
    return a ? (getTemplate(a.templateId).blockChance ?? 0) : 0;
  }

  getBlinkChance(): number {
    const r = this.equipment.ring;
    return r ? (getTemplate(r.templateId).blinkChance ?? 0) : 0;
  }

  private usePotion(
    index: number,
    player: Entity,
    onMessage: (msg: string) => void,
  ): boolean {
    const item = this.items[index];
    const template = getTemplate(item.templateId);

    if (template.healAmount) {
      const healed = Math.min(template.healAmount, player.maxHp - player.hp);
      player.hp += healed;
      this.items.splice(index, 1);
      onMessage(`Used ${template.name}. Healed ${healed} HP.`);
      return true;
    }

    if (template.buffType && template.buffDuration && template.buffAmount) {
      const existing = this.buffs.find((b) => b.type === template.buffType);
      if (existing) {
        existing.turnsRemaining = template.buffDuration;
        existing.amount = template.buffAmount;
      } else {
        this.buffs.push({
          type: template.buffType,
          amount: template.buffAmount,
          turnsRemaining: template.buffDuration,
        });
      }
      this.items.splice(index, 1);
      onMessage(`Used ${template.name}.`);
      return true;
    }

    return false;
  }

  private useScroll(
    index: number,
    player: Entity,
    enemies: Enemy[],
    fov: Set<string>,
    explored: Set<string>,
    map: Map<string, number>,
    onMessage: (msg: string) => void,
    rng: { getUniform: () => number },
  ): boolean {
    const item = this.items[index];
    const template = getTemplate(item.templateId);

    switch (template.scrollEffect) {
      case "lightning": {
        let nearest: Enemy | null = null;
        let nearestDist = Infinity;
        for (const enemy of enemies) {
          if (!fov.has(`${enemy.x},${enemy.y}`)) continue;
          const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = enemy;
          }
        }
        if (!nearest) {
          onMessage("No visible target for lightning.");
          return false;
        }
        nearest.hp -= 8;
        this.items.splice(index, 1);
        onMessage(`Lightning strikes ${nearest.name} for 8 damage!`);
        if (nearest.hp <= 0) {
          const idx = enemies.indexOf(nearest);
          if (idx !== -1) enemies.splice(idx, 1);
          onMessage(`${nearest.name} dies!`);
        }
        return true;
      }

      case "confusion": {
        let count = 0;
        for (const enemy of enemies) {
          if (fov.has(`${enemy.x},${enemy.y}`)) {
            enemy.confusedTurns = 10;
            count++;
          }
        }
        this.items.splice(index, 1);
        if (count > 0) {
          onMessage(`Confused ${count} enemies!`);
        } else {
          onMessage("No visible enemies to confuse.");
        }
        return true;
      }

      case "mapping": {
        for (const [key, value] of map) {
          if (value === 0) explored.add(key);
        }
        this.items.splice(index, 1);
        onMessage("The dungeon layout is revealed!");
        return true;
      }

      case "teleportation": {
        const floors: { x: number; y: number }[] = [];
        for (const [key, value] of map) {
          if (value !== 0) continue;
          const [sx, sy] = key.split(",");
          const x = parseInt(sx);
          const y = parseInt(sy);
          if (enemies.some((e) => e.x === x && e.y === y)) continue;
          floors.push({ x, y });
        }
        if (floors.length === 0) return false;
        const dest = floors[Math.floor(rng.getUniform() * floors.length)];
        player.x = dest.x;
        player.y = dest.y;
        this.items.splice(index, 1);
        onMessage("You teleport to a new location!");
        return true;
      }

      case "fireball": {
        let killed = 0;
        let hit = 0;
        for (let i = enemies.length - 1; i >= 0; i--) {
          const enemy = enemies[i];
          if (!fov.has(`${enemy.x},${enemy.y}`)) continue;
          enemy.hp -= 5;
          hit++;
          if (enemy.hp <= 0) {
            enemies.splice(i, 1);
            killed++;
          }
        }
        this.items.splice(index, 1);
        if (hit > 0) {
          onMessage(`Fireball hits ${hit} enemies for 5 damage each!${killed > 0 ? ` ${killed} killed!` : ""}`);
        } else {
          onMessage("No visible enemies to hit.");
        }
        return true;
      }

      case "fear": {
        let count = 0;
        for (const enemy of enemies) {
          if (fov.has(`${enemy.x},${enemy.y}`)) {
            enemy.fleeingTurns = 8;
            count++;
          }
        }
        this.items.splice(index, 1);
        if (count > 0) {
          onMessage(`${count} enemies flee in terror!`);
        } else {
          onMessage("No visible enemies to frighten.");
        }
        return true;
      }

      case "enchant": {
        const weapon = this.equipment.weapon;
        if (!weapon) {
          onMessage("No weapon equipped to enchant.");
          return false;
        }
        // We can't modify the template, so we swap to the next tier weapon
        const upgrades: Record<string, string> = {
          dagger: "sword",
          spear: "sword",
          sword: "battle_axe",
          war_hammer: "enchanted_blade",
          battle_axe: "enchanted_blade",
          vampiric_blade: "enchanted_blade",
        };
        const nextId = upgrades[weapon.templateId];
        if (!nextId) {
          onMessage("This weapon cannot be further enchanted.");
          return false;
        }
        this.equipment.weapon = { templateId: nextId };
        this.items.splice(index, 1);
        const newName = getTemplate(nextId).name;
        onMessage(`Your weapon glows! It becomes a ${newName}!`);
        return true;
      }

      default:
        return false;
    }
  }
}
