# Theme System — Design Spec

## Context

All visual and flavor content is hardcoded across 8+ files. This adds a theme system so the game can be reskinned with different settings (dungeon, space station, etc.) while keeping core mechanics identical.

## What Themes Control

### Cosmetics
- Color palettes (walls, floors, UI, entities, glow, minimap)
- ASCII character mappings (player, enemies, walls, floors, stairs, items)
- Tileset sprite draw functions (32x32 pixel art for all entities/tiles)
- Enemy names and colors
- Item names, descriptions, and colors
- Flavor text (descend messages, game over, level transitions)

### Light Mechanics
- Enemy behavior distribution (which of the 3 enemies is chase/wander/slow)
- Base FOV range (e.g. dungeon=8, space station=10 for brighter lighting)

### What Stays the Same Across Themes
- HP/ATK/DEF values and depth scaling formulas
- Item effect magnitudes (heal 8 HP, +1 attack, etc.)
- Inventory size (20 slots), equipment slots (3)
- Turn engine logic, combat formulas, A* pathfinding
- Buff durations, scroll effect mechanics
- Map generation parameters (room sizes, corridor lengths)
- UI layout and HUD structure

## Theme Interface

File: `src/themes/theme.ts`

```ts
interface ThemeDefinition {
  id: string;
  name: string;

  // Color palette
  palette: {
    floor: { bg: string; fg: string };
    wall: { bg: string; fg: string };
    exploredFloor: { bg: string; fg: string };
    exploredWall: { bg: string; fg: string };
    unexplored: { bg: string; fg: string };
    player: string;
    playerGlow: string;          // rgba for radial gradient
    stairs: string;
    stairsExplored: string;
    floorVariants: { bg: string; fg: string }[];
    // UI
    uiBg: string;                // HUD gradient base
    uiAccent: string;            // borders, button bg
    hpGood: string;
    hpMid: string;
    hpLow: string;
    minimapFloor: string;
    minimapWall: string;
    minimapEnemy: string;
  };

  // ASCII characters
  chars: {
    player: string;
    wall: string;
    floor: string;
    stairs: string;
    enemyChars: Record<string, string>;   // enemy name -> char
    itemChars: Record<ItemCategory, string>;
  };

  // Enemy definitions (3 enemies)
  enemies: {
    name: string;
    color: number;
    behavior: BehaviorType;
  }[];

  // Item reskin (same 18 template IDs, themed names/descriptions/colors)
  items: {
    id: string;              // matches base template ID
    name: string;
    description: string;
    color: number;
  }[];

  // Flavor text
  text: {
    descend: string;                    // "You descend into the dungeon..."
    descendLevel: (depth: number) => string;  // "You descend to level X..."
    gameOver: (depth: number) => string;
    levelNoun: string;                  // "level" or "deck"
  };

  // Light mechanics
  baseFovRange: number;

  // Tileset sprite draw functions (32x32)
  sprites: {
    floor: (ctx: CanvasRenderingContext2D, variant: number) => void;
    wall: (ctx: CanvasRenderingContext2D, variant: number) => void;
    stairs: (ctx: CanvasRenderingContext2D) => void;
    player: (ctx: CanvasRenderingContext2D) => void;
    enemies: Record<string, (ctx: CanvasRenderingContext2D) => void>;
    items: Record<ItemCategory, (ctx: CanvasRenderingContext2D, color: string) => void>;
  };
}
```

## File Structure

```
src/themes/
  theme.ts          — ThemeDefinition interface, getActiveTheme(), setTheme()
  dungeon.ts        — Default roguelike theme (extract current hardcoded values)
  spaceStation.ts   — Space station theme
  index.ts          — Re-exports, theme registry
```

## Default Dungeon Theme

Extracted directly from current hardcoded values — all existing enemies, items, sprites, colors, chars, and flavor text packaged into a `ThemeDefinition`. No behavior changes.

## Space Station Theme

### Enemies
| Slot | Name | Color | Behavior | ASCII | Description |
|------|------|-------|----------|-------|-------------|
| 1 | Maintenance Bot | 0x8888aa | wander | b | Drifts around corridors |
| 2 | Security Drone | 0xff6644 | chase | d | Locks onto intruders |
| 3 | Xenomorph | 0x44ff44 | slow | x | Lurks, hits hard |

### Items (same IDs, themed names)
| Base ID | Space Name | Description |
|---------|-----------|-------------|
| health_potion | Med-Kit | Restores 8 HP |
| greater_health_potion | Trauma Kit | Restores 15 HP |
| strength_potion | Combat Stim | +1 attack for 20 turns |
| speed_potion | Reflex Booster | Extra actions for 10 turns |
| scroll_lightning | EMP Charge | 8 damage to nearest visible enemy |
| scroll_confusion | Scrambler Pulse | Scramble all visible enemies |
| scroll_mapping | Station Schematic | Reveal entire deck |
| scroll_teleportation | Emergency Teleport | Teleport to random location |
| dagger | Utility Knife | +1 Attack |
| sword | Laser Blade | +2 Attack |
| battle_axe | Plasma Cutter | +3 Attack |
| enchanted_blade | Particle Sword | +4 Attack |
| leather_armor | Flight Suit | +1 Defense |
| chainmail | Tactical Vest | +2 Defense |
| plate_armor | Power Armor | +3 Defense |
| ring_vitality | Vitality Implant | +5 Max HP |
| ring_sight | Thermal Visor | +3 FOV range |
| ring_protection | Shield Module | +1 Defense |

### Color Palette
- Walls: Steel grey/blue (`#2a3040` base, `#3a4050` highlight)
- Floors: Dark metal grate (`#181820`, `#282830`)
- Player: Cyan (`#00ccff`)
- Player glow: Cyan radial
- Stairs: Orange (`#ff8844`) — elevator/airlock
- UI: Dark grey with cyan accents

### Sprites
- Walls: Metal panels with rivet details, horizontal seam lines
- Floors: Grated metal with grid pattern
- Stairs: Elevator door with orange indicator light
- Player: Space marine with helmet visor
- Maintenance Bot: Boxy robot with antenna
- Security Drone: Angular hovering drone with red eye
- Xenomorph: Alien creature with tail

### Flavor Text
- Descend: "You board the station..."
- Level transition: "You take the elevator to deck X..."
- Game over: "MISSION FAILED\n\nReached deck X\n\nTap to restart"
- Level noun: "deck"

### Light Mechanics
- baseFovRange: 10 (station has ambient lighting, better visibility)

## Integration Points

### entities.ts
- `ENEMY_TEMPLATES` replaced by `getActiveTheme().enemies`
- `createPlayer()` reads player color from theme

### items.ts
- `TEMPLATES` keeps base mechanics but overlays `name`, `description`, `color` from theme
- Item template lookup merges base + theme overrides

### renderer.ts (ASCII)
- `PALETTE`, `ENEMY_CHARS`, `ITEM_CHARS`, character constants all read from theme
- `floorVariants` from theme palette

### tilesetRenderer.ts
- Sprite functions read from `theme.sprites.*` instead of hardcoded functions
- Sprite cache keys include theme ID to invalidate on switch

### DungeonScene.ts
- Flavor messages from `theme.text.*`
- FOV range from `theme.baseFovRange` (replaces `BASE_FOV_RANGE` in items.ts)

### hud.ts
- UI colors from `theme.palette.*`
- Minimap colors from theme
- Buff labels stay generic (STR/SPD)

### inventory.ts
- Scroll effect messages can reference theme text for consistency (e.g. "deck" vs "floor")

## Theme Selection

Add a theme selector to the game start or HUD. For now: a simple button in the HUD next to the renderer toggle. Switching themes restarts the game (new dungeon generation with new theme applied).

## What This Does NOT Include
- Runtime theme switching mid-run (restart required)
- Theme-specific map generation algorithms
- Theme-specific music or sound
- User-created custom themes
- More than 2 themes
