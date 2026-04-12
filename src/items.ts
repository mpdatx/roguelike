import * as ROT from "rot-js";
import type { Room } from "rot-js/lib/map/features";
import type { Entity, Enemy } from "./entities";

export type ItemCategory = "potion" | "scroll" | "weapon" | "armor" | "ring";
export type ScrollEffect = "lightning" | "confusion" | "mapping" | "teleportation";
export type BuffType = "strength" | "speed";

export interface ItemTemplate {
  id: string;
  name: string;
  category: ItemCategory;
  color: number;
  description: string;
  weight: number;
  healAmount?: number;
  buffType?: BuffType;
  buffDuration?: number;
  buffAmount?: number;
  scrollEffect?: ScrollEffect;
  attackBonus?: number;
  defenseBonus?: number;
  maxHpBonus?: number;
  fovBonus?: number;
}

export interface GroundItem {
  templateId: string;
  x: number;
  y: number;
}

export interface InventoryItem {
  templateId: string;
}

export interface ActiveBuff {
  type: BuffType;
  amount: number;
  turnsRemaining: number;
}

export interface Equipment {
  weapon: InventoryItem | null;
  armor: InventoryItem | null;
  ring: InventoryItem | null;
}

export type EquipSlot = keyof Equipment;

const TEMPLATES: ItemTemplate[] = [
  // Potions
  { id: "health_potion", name: "Health Potion", category: "potion", color: 0xff4488, description: "Restores 8 HP", weight: 10, healAmount: 8 },
  { id: "greater_health_potion", name: "Greater Health Potion", category: "potion", color: 0xff66aa, description: "Restores 15 HP", weight: 4, healAmount: 15 },
  { id: "strength_potion", name: "Strength Potion", category: "potion", color: 0xff8844, description: "+1 attack for 20 turns", weight: 3, buffType: "strength", buffDuration: 20, buffAmount: 1 },
  { id: "speed_potion", name: "Speed Potion", category: "potion", color: 0x44ffff, description: "Extra actions for 10 turns", weight: 2, buffType: "speed", buffDuration: 10, buffAmount: 1 },

  // Scrolls
  { id: "scroll_lightning", name: "Scroll of Lightning", category: "scroll", color: 0xffff44, description: "8 damage to nearest visible enemy", weight: 4, scrollEffect: "lightning" },
  { id: "scroll_confusion", name: "Scroll of Confusion", category: "scroll", color: 0xff88ff, description: "Confuse all visible enemies", weight: 3, scrollEffect: "confusion" },
  { id: "scroll_mapping", name: "Scroll of Mapping", category: "scroll", color: 0x88ffff, description: "Reveal entire floor", weight: 2, scrollEffect: "mapping" },
  { id: "scroll_teleportation", name: "Scroll of Teleportation", category: "scroll", color: 0xaa88ff, description: "Teleport to random location", weight: 3, scrollEffect: "teleportation" },

  // Weapons
  { id: "dagger", name: "Dagger", category: "weapon", color: 0xaaaaaa, description: "+1 Attack", weight: 8, attackBonus: 1 },
  { id: "sword", name: "Sword", category: "weapon", color: 0xcccccc, description: "+2 Attack", weight: 5, attackBonus: 2 },
  { id: "battle_axe", name: "Battle Axe", category: "weapon", color: 0xdddddd, description: "+3 Attack", weight: 2, attackBonus: 3 },
  { id: "enchanted_blade", name: "Enchanted Blade", category: "weapon", color: 0x88aaff, description: "+4 Attack", weight: 1, attackBonus: 4 },

  // Armor
  { id: "leather_armor", name: "Leather Armor", category: "armor", color: 0x886644, description: "+1 Defense", weight: 8, defenseBonus: 1 },
  { id: "chainmail", name: "Chainmail", category: "armor", color: 0xaaaaaa, description: "+2 Defense", weight: 4, defenseBonus: 2 },
  { id: "plate_armor", name: "Plate Armor", category: "armor", color: 0xcccccc, description: "+3 Defense", weight: 1, defenseBonus: 3 },

  // Rings
  { id: "ring_vitality", name: "Ring of Vitality", category: "ring", color: 0xff4488, description: "+5 Max HP", weight: 3, maxHpBonus: 5 },
  { id: "ring_sight", name: "Ring of Sight", category: "ring", color: 0x44ffff, description: "+3 FOV range", weight: 3, fovBonus: 3 },
  { id: "ring_protection", name: "Ring of Protection", category: "ring", color: 0x88aaff, description: "+1 Defense", weight: 3, defenseBonus: 1 },
];

const templateMap = new Map<string, ItemTemplate>();
for (const t of TEMPLATES) {
  templateMap.set(t.id, t);
}

export function getTemplate(id: string): ItemTemplate {
  return templateMap.get(id)!;
}

export function getSlotForCategory(category: ItemCategory): EquipSlot | null {
  if (category === "weapon") return "weapon";
  if (category === "armor") return "armor";
  if (category === "ring") return "ring";
  return null;
}

export interface EffectiveStats {
  attack: number;
  defense: number;
  maxHp: number;
  fovRange: number;
}

const BASE_FOV_RANGE = 8;

export function getEffectiveStats(
  player: Entity,
  equipment: Equipment,
  buffs: ActiveBuff[],
): EffectiveStats {
  let attack = player.attack;
  let defense = player.defense;
  let maxHp = player.maxHp;
  let fovRange = BASE_FOV_RANGE;

  for (const slot of [equipment.weapon, equipment.armor, equipment.ring]) {
    if (!slot) continue;
    const t = getTemplate(slot.templateId);
    attack += t.attackBonus ?? 0;
    defense += t.defenseBonus ?? 0;
    maxHp += t.maxHpBonus ?? 0;
    fovRange += t.fovBonus ?? 0;
  }

  for (const buff of buffs) {
    if (buff.type === "strength") attack += buff.amount;
  }

  return { attack, defense, maxHp, fovRange };
}

export function spawnItems(
  rooms: Room[],
  map: Map<string, number>,
  enemies: Enemy[],
  rng: typeof ROT.RNG,
): GroundItem[] {
  const items: GroundItem[] = [];
  const totalWeight = TEMPLATES.reduce((sum, t) => sum + t.weight, 0);

  function pickTemplate(): ItemTemplate {
    let roll = rng.getUniform() * totalWeight;
    for (const t of TEMPLATES) {
      roll -= t.weight;
      if (roll <= 0) return t;
    }
    return TEMPLATES[0];
  }

  for (const room of rooms) {
    const count = rng.getUniformInt(0, 2);
    for (let j = 0; j < count; j++) {
      const x = rng.getUniformInt(room.getLeft(), room.getRight());
      const y = rng.getUniformInt(room.getTop(), room.getBottom());

      if (map.get(`${x},${y}`) !== 0) continue;
      if (enemies.some((e) => e.x === x && e.y === y)) continue;
      if (items.some((i) => i.x === x && i.y === y)) continue;

      items.push({ templateId: pickTemplate().id, x, y });
    }
  }

  return items;
}
