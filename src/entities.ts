import * as ROT from "rot-js";
import type { Room } from "rot-js/lib/map/features";

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
}

interface EnemyTemplate {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  color: number;
  behavior: BehaviorType;
}

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  { name: "Rat", hp: 3, attack: 1, defense: 0, color: 0x886644, behavior: "wander" },
  { name: "Goblin", hp: 6, attack: 2, defense: 1, color: 0xff4444, behavior: "chase" },
  { name: "Snake", hp: 4, attack: 3, defense: 0, color: 0x44ff44, behavior: "slow" },
];

export function createPlayer(x: number, y: number): Entity {
  return { x, y, hp: 20, maxHp: 20, attack: 3, defense: 1, color: 0x00ff88, name: "Player" };
}

export function spawnEnemies(
  rooms: Room[],
  map: Map<string, number>,
  rng: typeof ROT.RNG,
  depth: number = 1,
): Enemy[] {
  const enemies: Enemy[] = [];
  // Scale: more enemies per room at deeper levels
  const maxPerRoom = Math.min(2 + Math.floor(depth / 3), 5);
  // Stat bonus from depth
  const hpBonus = Math.floor((depth - 1) * 1.5);
  const atkBonus = Math.floor((depth - 1) * 0.5);
  const defBonus = Math.floor((depth - 1) * 0.3);

  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    const count = rng.getUniformInt(1, maxPerRoom);

    for (let j = 0; j < count; j++) {
      const x = rng.getUniformInt(room.getLeft(), room.getRight());
      const y = rng.getUniformInt(room.getTop(), room.getBottom());

      if (map.get(`${x},${y}`) !== 0) continue;
      if (enemies.some((e) => e.x === x && e.y === y)) continue;

      const template = rng.getItem(ENEMY_TEMPLATES)!;
      const hp = template.hp + hpBonus;
      enemies.push({
        x,
        y,
        hp,
        maxHp: hp,
        attack: template.attack + atkBonus,
        defense: template.defense + defBonus,
        color: template.color,
        name: template.name,
        behavior: template.behavior,
        turnParity: 0,
        confusedTurns: 0,
      });
    }
  }

  return enemies;
}
