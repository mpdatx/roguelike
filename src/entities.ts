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

export function spawnEnemies(
  rooms: Room[],
  map: Map<string, number>,
  rng: typeof ROT.RNG,
  depth: number = 1,
): Enemy[] {
  const theme = getTheme();
  const enemies: Enemy[] = [];
  const maxPerRoom = Math.min(2 + Math.floor(depth / 3), 5);
  const hpBonus = Math.floor((depth - 1) * 1.5);
  const atkBonus = Math.floor((depth - 1) * 0.5);
  const defBonus = Math.floor((depth - 1) * 0.3);

  // Base stats per behavior type (same across themes)
  const baseStats: Record<BehaviorType, { hp: number; attack: number; defense: number }> = {
    wander: { hp: 3, attack: 1, defense: 0 },
    chase: { hp: 6, attack: 2, defense: 1 },
    slow: { hp: 4, attack: 3, defense: 0 },
  };

  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    const count = rng.getUniformInt(1, maxPerRoom);

    for (let j = 0; j < count; j++) {
      const x = rng.getUniformInt(room.getLeft(), room.getRight());
      const y = rng.getUniformInt(room.getTop(), room.getBottom());

      if (map.get(`${x},${y}`) !== 0) continue;
      if (enemies.some((e) => e.x === x && e.y === y)) continue;

      const template = rng.getItem(theme.enemies)!;
      const stats = baseStats[template.behavior];
      const hp = stats.hp + hpBonus;
      enemies.push({
        x,
        y,
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
