import * as ROT from "rot-js";
import type { Room } from "rot-js/lib/map/features";
import { getTheme } from "./themes";

export interface Entity {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  color: number;
  name: string;
}

export type BehaviorType = "chase" | "wander" | "slow";

export interface Enemy extends Entity {
  behavior: BehaviorType;
  turnParity: number;
  confusedTurns: number;
  fleeingTurns: number;
}

export function createPlayer(x: number, y: number): Entity {
  const theme = getTheme();
  const playerColor = parseInt(theme.palette.player.replace("#", ""), 16);
  return { x, y, hp: 20, maxHp: 20, attack: 3, defense: 1, color: playerColor, name: "Player" };
}

function findFloorTile(
  room: Room,
  map: Map<string, number>,
  occupied: Set<string>,
  rng: typeof ROT.RNG,
  maxAttempts = 20,
): { x: number; y: number } | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = rng.getUniformInt(room.getLeft(), room.getRight());
    const y = rng.getUniformInt(room.getTop(), room.getBottom());
    const key = `${x},${y}`;
    if (map.get(key) === 0 && !occupied.has(key)) {
      return { x, y };
    }
  }
  return null;
}

const baseStats: Record<BehaviorType, { hp: number; attack: number; defense: number }> = {
  wander: { hp: 3, attack: 1, defense: 0 },
  chase: { hp: 6, attack: 2, defense: 1 },
  slow: { hp: 4, attack: 3, defense: 0 },
};

export function spawnEnemies(
  rooms: Room[],
  map: Map<string, number>,
  rng: typeof ROT.RNG,
  depth: number = 1,
  skipRooms: Set<number> = new Set([0]),
  overrideCounts?: Map<number, number>,
): Enemy[] {
  const theme = getTheme();
  const enemies: Enemy[] = [];
  const occupied = new Set<string>();
  const maxPerRoom = Math.min(2 + Math.floor(depth / 3), 5);
  const hpBonus = Math.floor((depth - 1) * 1.5);
  const atkBonus = Math.floor((depth - 1) * 0.5);
  const defBonus = Math.floor((depth - 1) * 0.3);

  for (let i = 0; i < rooms.length; i++) {
    if (skipRooms.has(i)) continue;
    const room = rooms[i];
    const count = overrideCounts?.get(i) ?? rng.getUniformInt(1, maxPerRoom);

    for (let j = 0; j < count; j++) {
      const pos = findFloorTile(room, map, occupied, rng);
      if (!pos) continue;

      occupied.add(`${pos.x},${pos.y}`);
      const template = rng.getItem(theme.enemies)!;
      const stats = baseStats[template.behavior];
      const hp = stats.hp + hpBonus;
      enemies.push({
        x: pos.x,
        y: pos.y,
        hp,
        maxHp: hp,
        attack: stats.attack + atkBonus,
        defense: stats.defense + defBonus,
        color: template.color,
        name: template.name,
        behavior: template.behavior,
        turnParity: 0,
        confusedTurns: 0,
        fleeingTurns: 0,
      });
    }
  }

  return enemies;
}

export function spawnBoss(
  room: Room,
  map: Map<string, number>,
  rng: typeof ROT.RNG,
  depth: number,
): Enemy {
  const theme = getTheme();
  const template = theme.enemies[theme.enemies.length - 1]; // strongest enemy type
  const hpBonus = Math.floor((depth - 1) * 1.5);
  const atkBonus = Math.floor((depth - 1) * 0.5);

  const x = Math.floor((room.getLeft() + room.getRight()) / 2);
  const y = Math.floor((room.getTop() + room.getBottom()) / 2);

  const baseHp = baseStats[template.behavior].hp;
  const baseAtk = baseStats[template.behavior].attack;
  const baseDef = baseStats[template.behavior].defense;

  return {
    x, y,
    hp: (baseHp + hpBonus) * 3,
    maxHp: (baseHp + hpBonus) * 3,
    attack: baseAtk + atkBonus + 2,
    defense: baseDef + Math.floor(depth * 0.5),
    color: 0xff2222,
    name: `Elite ${template.name}`,
    behavior: "chase",
    turnParity: 0,
    confusedTurns: 0,
    fleeingTurns: 0,
  };
}

export { findFloorTile };
