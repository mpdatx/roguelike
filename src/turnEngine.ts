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
        this.inventory.tickBuffs(this.player, this.onMessage);
        this.turnNumber++;

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
        if (enemy.confusedTurns > 0) enemy.confusedTurns--;
        if (enemy.fleeingTurns > 0) enemy.fleeingTurns--;

        const move = getEnemyMove(
          enemy,
          this.player,
          (x, y) => this.isTransparent(x, y),
          (x, y) => this.isPassable(x, y),
          this.turnNumber,
          this.rng,
          this.inventory.hasInvisibility(),
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
    const isPlayerAttacking = attacker === this.player;
    const isPlayerDefending = defender === this.player;

    const attackerStats = isPlayerAttacking
      ? getEffectiveStats(this.player, this.inventory.equipment, this.inventory.buffs)
      : { attack: attacker.attack, defense: attacker.defense, maxHp: attacker.maxHp, fovRange: 8 };

    const defenderStats = isPlayerDefending
      ? getEffectiveStats(this.player, this.inventory.equipment, this.inventory.buffs)
      : { attack: defender.attack, defense: defender.defense, maxHp: defender.maxHp, fovRange: 8 };

    // Block chance (player defending with shield)
    if (isPlayerDefending) {
      const blockChance = this.inventory.getBlockChance();
      if (blockChance > 0 && this.rng.getUniform() < blockChance) {
        this.onMessage(`You block ${attacker.name}'s attack!`);
        return;
      }

      // Blink chance (ring of teleportation)
      const blinkChance = this.inventory.getBlinkChance();
      if (blinkChance > 0 && this.rng.getUniform() < blinkChance) {
        this.blinkPlayer();
        this.onMessage("You blink away from danger!");
        return;
      }
    }

    const damage = Math.max(1, attackerStats.attack - defenderStats.defense);
    defender.hp -= damage;
    this.onMessage(`${attacker.name} hits ${defender.name} for ${damage} damage.`);

    // Lifesteal (player attacking with vampiric weapon)
    if (isPlayerAttacking && this.inventory.hasLifesteal()) {
      const healed = Math.min(1, attackerStats.maxHp - attacker.hp);
      if (healed > 0) {
        attacker.hp += healed;
        this.onMessage("You drain life from the enemy!");
      }
    }

    // Thorns (player defending with thorned armor)
    if (isPlayerDefending) {
      const thorns = this.inventory.getThorns();
      if (thorns > 0) {
        attacker.hp -= thorns;
        this.onMessage(`Thorns deal ${thorns} damage to ${attacker.name}!`);
      }
    }

    if (defender.hp <= 0 && !isPlayerDefending) {
      const enemy = defender as Enemy;
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }
      this.onMessage(`${enemy.name} dies!`);
      this.onEnemyKilled(enemy);
    }

    // Check if thorns killed the attacker
    if (attacker.hp <= 0 && !isPlayerAttacking) {
      const enemy = attacker as Enemy;
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }
      this.onMessage(`${enemy.name} dies from thorns!`);
      this.onEnemyKilled(enemy);
    }
  }

  private blinkPlayer() {
    const floors: { x: number; y: number }[] = [];
    for (const [key, value] of this.map) {
      if (value !== 0) continue;
      const [sx, sy] = key.split(",");
      const x = parseInt(sx);
      const y = parseInt(sy);
      // Blink to a nearby floor tile (within 5)
      const dist = Math.hypot(x - this.player.x, y - this.player.y);
      if (dist < 2 || dist > 5) continue;
      if (this.enemies.some((e) => e.x === x && e.y === y)) continue;
      floors.push({ x, y });
    }
    if (floors.length > 0) {
      const dest = floors[Math.floor(this.rng.getUniform() * floors.length)];
      this.player.x = dest.x;
      this.player.y = dest.y;
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
