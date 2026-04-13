import * as ROT from "rot-js";
import type { Room } from "rot-js/lib/map/features";
import type { Entity, Enemy } from "./entities";
import { getTheme } from "./themes";

export type ItemCategory = "potion" | "scroll" | "weapon" | "armor" | "ring" | "shield";
export type ScrollEffect = "lightning" | "confusion" | "mapping" | "teleportation" | "fireball" | "fear" | "enchant";
export type BuffType = "strength" | "speed" | "regen" | "invisibility";

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
  twoHanded?: boolean;
  lifesteal?: boolean;
  thorns?: number;
  blockChance?: number;
  regenRate?: number;     // heal 1 HP every N turns
  blinkChance?: number;   // chance to teleport when hit
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
  offhand: InventoryItem | null;
  armor: InventoryItem | null;
  ring1: InventoryItem | null;
  ring2: InventoryItem | null;
}

export type EquipSlot = keyof Equipment;

// Base templates define mechanics (effects, weights). Theme overlays name/description/color.
const BASE_TEMPLATES: ItemTemplate[] = [
  { id: "health_potion", name: "", category: "potion", color: 0, description: "", weight: 10, healAmount: 8 },
  { id: "greater_health_potion", name: "", category: "potion", color: 0, description: "", weight: 4, healAmount: 15 },
  { id: "strength_potion", name: "", category: "potion", color: 0, description: "", weight: 3, buffType: "strength", buffDuration: 20, buffAmount: 1 },
  { id: "speed_potion", name: "", category: "potion", color: 0, description: "", weight: 2, buffType: "speed", buffDuration: 10, buffAmount: 1 },
  { id: "scroll_lightning", name: "", category: "scroll", color: 0, description: "", weight: 4, scrollEffect: "lightning" },
  { id: "scroll_confusion", name: "", category: "scroll", color: 0, description: "", weight: 3, scrollEffect: "confusion" },
  { id: "scroll_mapping", name: "", category: "scroll", color: 0, description: "", weight: 2, scrollEffect: "mapping" },
  { id: "scroll_teleportation", name: "", category: "scroll", color: 0, description: "", weight: 3, scrollEffect: "teleportation" },
  { id: "dagger", name: "", category: "weapon", color: 0, description: "", weight: 8, attackBonus: 1 },
  { id: "sword", name: "", category: "weapon", color: 0, description: "", weight: 5, attackBonus: 2 },
  { id: "battle_axe", name: "", category: "weapon", color: 0, description: "", weight: 2, attackBonus: 3, twoHanded: true },
  { id: "enchanted_blade", name: "", category: "weapon", color: 0, description: "", weight: 1, attackBonus: 4, twoHanded: true },
  { id: "leather_armor", name: "", category: "armor", color: 0, description: "", weight: 8, defenseBonus: 1 },
  { id: "chainmail", name: "", category: "armor", color: 0, description: "", weight: 4, defenseBonus: 2 },
  { id: "plate_armor", name: "", category: "armor", color: 0, description: "", weight: 1, defenseBonus: 3 },
  { id: "ring_vitality", name: "", category: "ring", color: 0, description: "", weight: 3, maxHpBonus: 5 },
  { id: "ring_sight", name: "", category: "ring", color: 0, description: "", weight: 3, fovBonus: 3 },
  { id: "ring_protection", name: "", category: "ring", color: 0, description: "", weight: 3, defenseBonus: 1 },
  // New consumables
  { id: "regen_potion", name: "", category: "potion", color: 0, description: "", weight: 3, buffType: "regen", buffDuration: 15, buffAmount: 1 },
  { id: "invisibility_potion", name: "", category: "potion", color: 0, description: "", weight: 2, buffType: "invisibility", buffDuration: 8, buffAmount: 1 },
  { id: "scroll_fireball", name: "", category: "scroll", color: 0, description: "", weight: 3, scrollEffect: "fireball" },
  { id: "scroll_fear", name: "", category: "scroll", color: 0, description: "", weight: 2, scrollEffect: "fear" },
  { id: "scroll_enchant", name: "", category: "scroll", color: 0, description: "", weight: 1, scrollEffect: "enchant" },
  // New weapons
  { id: "spear", name: "", category: "weapon", color: 0, description: "", weight: 5, attackBonus: 2 },
  { id: "war_hammer", name: "", category: "weapon", color: 0, description: "", weight: 2, attackBonus: 3, twoHanded: true },
  { id: "vampiric_blade", name: "", category: "weapon", color: 0, description: "", weight: 1, attackBonus: 2, lifesteal: true },
  // New armor
  { id: "thorned_armor", name: "", category: "armor", color: 0, description: "", weight: 2, defenseBonus: 1, thorns: 1 },
  // Shields (offhand)
  { id: "buckler", name: "", category: "shield", color: 0, description: "", weight: 6, defenseBonus: 1, blockChance: 0.15 },
  { id: "kite_shield", name: "", category: "shield", color: 0, description: "", weight: 3, defenseBonus: 2, blockChance: 0.25 },
  { id: "tower_shield", name: "", category: "shield", color: 0, description: "", weight: 1, defenseBonus: 3, blockChance: 0.35 },
  // New rings
  { id: "ring_regen", name: "", category: "ring", color: 0, description: "", weight: 2, regenRate: 5 },
  { id: "ring_blink", name: "", category: "ring", color: 0, description: "", weight: 2, blinkChance: 0.1 },
];

const baseMap = new Map<string, ItemTemplate>();
for (const t of BASE_TEMPLATES) {
  baseMap.set(t.id, t);
}

export function getTemplate(id: string): ItemTemplate {
  const base = baseMap.get(id)!;
  const theme = getTheme();
  const overlay = theme.items.find((i) => i.id === id);
  if (overlay) {
    return { ...base, name: overlay.name, description: overlay.description, color: overlay.color };
  }
  return base;
}

export function getSlotForCategory(category: ItemCategory): EquipSlot | null {
  if (category === "weapon") return "weapon";
  if (category === "shield") return "offhand";
  if (category === "armor") return "armor";
  if (category === "ring") return "ring1"; // default; equip logic picks actual slot
  return null;
}

export function isEquipSlot(category: ItemCategory): boolean {
  return category === "weapon" || category === "shield" || category === "armor" || category === "ring";
}

export interface EffectiveStats {
  attack: number;
  defense: number;
  maxHp: number;
  fovRange: number;
}

export function getEffectiveStats(
  player: Entity,
  equipment: Equipment,
  buffs: ActiveBuff[],
): EffectiveStats {
  const theme = getTheme();
  let attack = player.attack;
  let defense = player.defense;
  let maxHp = player.maxHp;
  let fovRange = theme.baseFovRange;

  for (const slot of [equipment.weapon, equipment.offhand, equipment.armor, equipment.ring1, equipment.ring2]) {
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
  const totalWeight = BASE_TEMPLATES.reduce((sum, t) => sum + t.weight, 0);

  function pickTemplate(): ItemTemplate {
    let roll = rng.getUniform() * totalWeight;
    for (const t of BASE_TEMPLATES) {
      roll -= t.weight;
      if (roll <= 0) return t;
    }
    return BASE_TEMPLATES[0];
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
