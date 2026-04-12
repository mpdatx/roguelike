# Enemies & AI — Design Spec

## Context

The roguelike currently has dungeon generation, FOV, and player movement but no enemies or combat. This adds the minimum viable enemy system to create a core gameplay loop.

## Entities

Introduce a shared `Entity` interface used by both the player and enemies:

```ts
interface Entity {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  color: number;
  name: string;
}
```

The player is an `Entity`. Enemies extend this with an AI behavior field:

```ts
interface Enemy extends Entity {
  behavior: "chase" | "wander" | "slow";
  turnParity?: number; // for slow enemies, tracks even/odd turns
}
```

File: `src/entities.ts`

## Turn System

Use `ROT.Scheduler.Simple` for round-robin scheduling. All actors (player + enemies) are added to the scheduler. Each game "tick":

1. Get next actor from scheduler
2. If player: await input (the existing keyboard/tap handlers)
3. If enemy: execute AI immediately
4. After the actor acts: recompute FOV, redraw
5. Repeat

The scene transitions from the current "move immediately on input" model to a turn-based loop that yields on the player's turn.

File: `src/turnEngine.ts`

## Enemy Types

| Type   | HP | Attack | Defense | Color    | Behavior |
|--------|----|--------|---------|----------|----------|
| Rat    | 3  | 1      | 0       | 0x886644 | wander until player in FOV, then chase |
| Goblin | 6  | 2      | 1       | 0xff4444 | chase when player in FOV, wander otherwise |
| Snake  | 4  | 3      | 0       | 0x44ff44 | chase when in FOV, but only acts every other turn |

## AI Behaviors

Each enemy checks if it can see the player using `ROT.FOV.PreciseShadowcasting` with a range of 6.

- **Chase**: Compute A* path to player, move one step along it. If adjacent to player, bump-attack instead.
- **Wander**: Pick a random passable adjacent tile and move there. If no passable tile, skip turn.
- **Slow**: Same as chase, but skip every other turn (tracked via `turnParity`).

File: `src/ai.ts`

## Combat

Bump-to-attack for both player and enemies. When any entity tries to move into a tile occupied by another:

- `damage = max(1, attacker.attack - defender.defense)`
- Subtract damage from defender HP
- If defender HP <= 0: remove from game (if enemy) or trigger game over (if player)

No separate combat file needed — this logic lives in the turn engine's movement resolution.

## Spawning

During dungeon generation, after rooms are created:

- Skip the first room (player's starting room)
- For each other room: spawn 1-2 enemies at random floor positions within the room
- Enemy type chosen randomly with equal probability

Spawning logic added to `DungeonScene.generateDungeon()`.

## Rendering

- Enemies rendered as colored rectangles (same style as player), only when in the current FOV set
- Dead enemies are removed from the entity list and not rendered
- Player color remains `0x00ff88`

## Game Over

When player HP reaches 0:

- Stop the turn scheduler
- Display "Game Over" text centered on screen
- Tap or any key restarts: regenerate dungeon, reset all state

## File Structure

```
src/
  main.ts           — unchanged
  entities.ts       — Entity/Enemy interfaces, enemy type definitions, spawning
  ai.ts             — AI behavior functions (chase, wander, slow)
  turnEngine.ts     — turn loop, movement resolution, combat
  scenes/
    DungeonScene.ts — orchestrates everything, rendering, input, game over
```

## What This Does NOT Include

- No items, inventory, or loot drops
- No multiple dungeon levels
- No UI overlay (health bar, message log) — next iteration
- No speed/energy system — all actors get one turn per round
- No ranged attacks or status effects
