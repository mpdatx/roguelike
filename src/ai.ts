import * as ROT from "rot-js";
import type { Entity, Enemy } from "./entities";

export interface MoveResult {
  dx: number;
  dy: number;
}

const SIGHT_RANGE = 6;

function canSeePlayer(
  enemy: Enemy,
  player: Entity,
  isTransparent: (x: number, y: number) => boolean,
): boolean {
  let visible = false;
  const fov = new ROT.FOV.PreciseShadowcasting(isTransparent);
  fov.compute(enemy.x, enemy.y, SIGHT_RANGE, (x, y, _r, v) => {
    if (v && x === player.x && y === player.y) {
      visible = true;
    }
  });
  return visible;
}

function chaseStep(
  enemy: Enemy,
  player: Entity,
  isPassable: (x: number, y: number) => boolean,
): MoveResult | null {
  const astar = new ROT.Path.AStar(player.x, player.y, isPassable, { topology: 8 });
  const path: { x: number; y: number }[] = [];
  astar.compute(enemy.x, enemy.y, (x, y) => path.push({ x, y }));

  if (path.length > 1) {
    return { dx: path[1].x - enemy.x, dy: path[1].y - enemy.y };
  }
  return null;
}

function wanderStep(
  enemy: Enemy,
  isPassable: (x: number, y: number) => boolean,
  rng: typeof ROT.RNG,
): MoveResult | null {
  const dirs = ROT.DIRS[8];
  const shuffled = rng.shuffle([...dirs]);

  for (const [dx, dy] of shuffled) {
    if (isPassable(enemy.x + dx, enemy.y + dy)) {
      return { dx, dy };
    }
  }
  return null;
}

export function getEnemyMove(
  enemy: Enemy,
  player: Entity,
  isTransparent: (x: number, y: number) => boolean,
  isPassable: (x: number, y: number) => boolean,
  turnNumber: number,
  rng: typeof ROT.RNG,
): MoveResult | null {
  // Slow enemies skip every other turn
  if (enemy.behavior === "slow" && turnNumber % 2 !== 0) {
    return null;
  }

  // Confused enemies always wander
  if (enemy.confusedTurns > 0) {
    return wanderStep(enemy, isPassable, rng);
  }

  const seesPlayer = canSeePlayer(enemy, player, isTransparent);

  if (seesPlayer) {
    return chaseStep(enemy, player, isPassable);
  }

  return wanderStep(enemy, isPassable, rng);
}
