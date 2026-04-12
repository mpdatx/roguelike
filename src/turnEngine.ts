import * as ROT from "rot-js";
import type { Entity, Enemy } from "./entities";
import { getEnemyMove } from "./ai";
import type { Inventory } from "./inventory";
import type { GroundItem } from "./items";
import { getEffectiveStats } from "./items";

export type ActorType = "player" | "enemy";

interface Actor {
  type: ActorType;
  entity: Entity;
}

export class TurnEngine {
  private scheduler: InstanceType<typeof ROT.Scheduler.Simple>;
  private turnNumber = 0;
  private running = true;
  private playerResolve: ((move: { dx: number; dy: number }) => void) | null = null;

  constructor(
    private player: Entity,
    private enemies: Enemy[],
    private map: Map<string, number>,
    private rng: typeof ROT.RNG,
    private inventory: Inventory,
    private groundItems: GroundItem[],
    private onTurnProcessed: () => void,
    private onEnemyKilled: (enemy: Enemy) => void,
    private onPlayerDied: () => void,
    private onMessage: (msg: string) => void,
  ) {
    this.scheduler = new ROT.Scheduler.Simple();
    this.scheduler.add({ type: "player", entity: player } as Actor, true);
    for (const enemy of enemies) {
      this.scheduler.add({ type: "enemy", entity: enemy } as Actor, true);
    }
  }

  async run() {
    while (this.running) {
      const actor = this.scheduler.next() as Actor | null;
      if (!actor) break;

      if (actor.type === "player") {
        const move = await this.waitForPlayerInput();
        if (!this.running) break;
        this.resolveMove(this.player, move.dx, move.dy);
        this.tryPickup();
        this.inventory.tickBuffs();
        this.turnNumber++;

        // Speed buff: grant an extra action
        if (this.inventory.hasSpeedBuff()) {
          this.onTurnProcessed();
          if (this.player.hp <= 0) { this.running = false; this.onPlayerDied(); break; }
          const extra = await this.waitForPlayerInput();
          if (!this.running) break;
          this.resolveMove(this.player, extra.dx, extra.dy);
          this.tryPickup();
        }
      } else {
        const enemy = actor.entity as Enemy;
        if (enemy.hp <= 0) {
          this.scheduler.remove(actor);
          continue;
        }
        // Decrement confusion
        if (enemy.confusedTurns > 0) {
          enemy.confusedTurns--;
        }
        const move = getEnemyMove(
          enemy,
          this.player,
          (x, y) => this.isTransparent(x, y),
          (x, y) => this.isPassable(x, y),
          this.turnNumber,
          this.rng,
        );
        if (move) {
          this.resolveMove(enemy, move.dx, move.dy);
        }
      }

      this.onTurnProcessed();

      if (this.player.hp <= 0) {
        this.running = false;
        this.onPlayerDied();
        break;
      }
    }
  }

  private waitForPlayerInput(): Promise<{ dx: number; dy: number }> {
    return new Promise((resolve) => {
      this.playerResolve = resolve;
    });
  }

  submitPlayerMove(dx: number, dy: number) {
    if (this.playerResolve) {
      const resolve = this.playerResolve;
      this.playerResolve = null;
      resolve({ dx, dy });
    }
  }

  isWaitingForInput(): boolean {
    return this.playerResolve !== null;
  }

  stop() {
    this.running = false;
    if (this.playerResolve) {
      const resolve = this.playerResolve;
      this.playerResolve = null;
      resolve({ dx: 0, dy: 0 });
    }
  }

  private tryPickup() {
    this.inventory.tryPickup(this.groundItems, this.player, this.onMessage);
  }

  private resolveMove(entity: Entity, dx: number, dy: number) {
    const newX = entity.x + dx;
    const newY = entity.y + dy;

    const target = this.getEntityAt(newX, newY, entity);
    if (target) {
      this.resolveCombat(entity, target);
      return;
    }

    if (this.map.get(`${newX},${newY}`) !== 0) return;

    entity.x = newX;
    entity.y = newY;
  }

  private resolveCombat(attacker: Entity, defender: Entity) {
    const attackerStats = attacker === this.player
      ? getEffectiveStats(this.player, this.inventory.equipment, this.inventory.buffs)
      : { attack: attacker.attack, defense: attacker.defense, maxHp: attacker.maxHp, fovRange: 8 };

    const defenderStats = defender === this.player
      ? getEffectiveStats(this.player, this.inventory.equipment, this.inventory.buffs)
      : { attack: defender.attack, defense: defender.defense, maxHp: defender.maxHp, fovRange: 8 };

    const damage = Math.max(1, attackerStats.attack - defenderStats.defense);
    defender.hp -= damage;
    this.onMessage(`${attacker.name} hits ${defender.name} for ${damage} damage.`);

    if (defender.hp <= 0 && defender !== this.player) {
      const enemy = defender as Enemy;
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }
      this.onMessage(`${enemy.name} dies!`);
      this.onEnemyKilled(enemy);
    }
  }

  private getEntityAt(x: number, y: number, exclude: Entity): Entity | null {
    if (exclude !== this.player && this.player.x === x && this.player.y === y) {
      return this.player;
    }
    for (const enemy of this.enemies) {
      if (enemy !== exclude && enemy.hp > 0 && enemy.x === x && enemy.y === y) {
        return enemy;
      }
    }
    return null;
  }

  private isTransparent(x: number, y: number): boolean {
    return this.map.get(`${x},${y}`) === 0;
  }

  private isPassable(x: number, y: number): boolean {
    if (this.map.get(`${x},${y}`) !== 0) return false;
    for (const enemy of this.enemies) {
      if (enemy.hp > 0 && enemy.x === x && enemy.y === y) return false;
    }
    return true;
  }
}
