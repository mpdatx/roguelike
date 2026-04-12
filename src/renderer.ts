import type { Entity, Enemy } from "./entities";
import type { GroundItem } from "./items";
import { getTemplate, type ItemCategory } from "./items";

export const TILE_SIZE = 24;
const FONT_SIZE = 18;
const FONT = `${FONT_SIZE}px monospace`;

// Character mappings
const WALL_CHAR = "#";
const FLOOR_CHAR = "\u00b7"; // middle dot
const STAIRS_CHAR = ">";
const PLAYER_CHAR = "@";

const ENEMY_CHARS: Record<string, string> = {
  Rat: "r",
  Goblin: "g",
  Snake: "s",
};

const ITEM_CHARS: Record<ItemCategory, string> = {
  potion: "!",
  scroll: "?",
  weapon: "/",
  armor: "[",
  ring: "=",
};

// Color palette
interface TileColors {
  bg: string;
  fg: string;
}

const PALETTE = {
  // Visible tiles
  floor: { bg: "#1e1e3a", fg: "#4a4a6a" },
  wall: { bg: "#2a2a4a", fg: "#5a5a7a" },
  // Explored but not visible
  exploredFloor: { bg: "#12122a", fg: "#2a2a3a" },
  exploredWall: { bg: "#161630", fg: "#2a2a3a" },
  // Not explored
  unexplored: { bg: "#0a0a18", fg: "#0a0a18" },
  // Entities
  player: "#00ff88",
  playerGlow: "rgba(0, 255, 136, 0.08)",
  stairs: "#ffcc00",
  stairsExplored: "#665500",
};

// Floor color variation seeds per tile
const floorVariants = [
  { bg: "#1e1e3a", fg: "#4a4a6a" },
  { bg: "#1c1e3c", fg: "#484a6c" },
  { bg: "#201e38", fg: "#4c4a68" },
  { bg: "#1e2038", fg: "#4a4c68" },
  { bg: "#1c1c3c", fg: "#48486c" },
];

function hashTile(x: number, y: number): number {
  // Simple deterministic hash for floor variation
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

export interface RenderState {
  map: Map<string, number>;
  mapWidth: number;
  mapHeight: number;
  fov: Set<string>;
  fovDistances: Map<string, number>;
  explored: Set<string>;
  player: Entity;
  enemies: Enemy[];
  groundItems: GroundItem[];
  stairs: { x: number; y: number } | null;
}

export interface GameRenderer {
  render(state: RenderState): HTMLCanvasElement;
  getCanvas(): HTMLCanvasElement;
  getTileSize(): number;
}

export class AsciiRenderer implements GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(private mapWidth: number, private mapHeight: number) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = mapWidth * TILE_SIZE;
    this.canvas.height = mapHeight * TILE_SIZE;
    this.ctx = this.canvas.getContext("2d")!;
  }

  render(state: RenderState): HTMLCanvasElement {
    const ctx = this.ctx;
    const ts = TILE_SIZE;

    // Clear
    ctx.fillStyle = PALETTE.unexplored.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw tiles
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const key = `${x},${y}`;
        const tile = state.map.get(key);
        const inFOV = state.fov.has(key);
        const isExplored = state.explored.has(key);

        if (!inFOV && !isExplored) continue;

        const isFloor = tile === 0;
        let colors: TileColors;

        if (inFOV) {
          if (isFloor) {
            // Floor variation
            const variant = hashTile(x, y) % floorVariants.length;
            colors = floorVariants[variant];
          } else {
            colors = PALETTE.wall;
          }
        } else {
          colors = isFloor ? PALETTE.exploredFloor : PALETTE.exploredWall;
        }

        // Distance-based dimming for FOV edges
        let alpha = 1.0;
        if (inFOV) {
          const dist = state.fovDistances.get(key) ?? 0;
          const maxDist = 8;
          alpha = Math.max(0.35, 1.0 - (dist / maxDist) * 0.65);
        }

        // Background
        ctx.globalAlpha = inFOV ? alpha : 1.0;
        ctx.fillStyle = colors.bg;
        ctx.fillRect(x * ts, y * ts, ts, ts);

        // Character
        ctx.fillStyle = colors.fg;
        const char = isFloor ? FLOOR_CHAR : WALL_CHAR;
        ctx.fillText(char, x * ts + ts / 2, y * ts + ts / 2 + 1);
      }
    }

    // Player glow (drawn before entities)
    ctx.globalAlpha = 1.0;
    const px = state.player.x * ts + ts / 2;
    const py = state.player.y * ts + ts / 2;
    const glowRadius = ts * 3;
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
    gradient.addColorStop(0, "rgba(0, 255, 136, 0.12)");
    gradient.addColorStop(0.5, "rgba(0, 255, 136, 0.04)");
    gradient.addColorStop(1, "rgba(0, 255, 136, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(px - glowRadius, py - glowRadius, glowRadius * 2, glowRadius * 2);

    // Draw stairs
    if (state.stairs) {
      const sKey = `${state.stairs.x},${state.stairs.y}`;
      if (state.fov.has(sKey) || state.explored.has(sKey)) {
        const inView = state.fov.has(sKey);
        ctx.globalAlpha = inView ? 1.0 : 0.4;
        ctx.fillStyle = inView ? PALETTE.stairs : PALETTE.stairsExplored;
        ctx.font = `bold ${FONT}`;
        ctx.fillText(STAIRS_CHAR, state.stairs.x * ts + ts / 2, state.stairs.y * ts + ts / 2 + 1);
        ctx.font = FONT;
      }
    }

    // Draw ground items
    ctx.globalAlpha = 1.0;
    for (const item of state.groundItems) {
      const iKey = `${item.x},${item.y}`;
      if (!state.fov.has(iKey)) continue;

      const template = getTemplate(item.templateId);
      const char = ITEM_CHARS[template.category] ?? "?";
      const dist = state.fovDistances.get(iKey) ?? 0;
      const alpha = Math.max(0.5, 1.0 - (dist / 8) * 0.5);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = hexToCSS(template.color);
      ctx.fillText(char, item.x * ts + ts / 2, item.y * ts + ts / 2 + 1);
    }

    // Draw enemies
    for (const enemy of state.enemies) {
      const eKey = `${enemy.x},${enemy.y}`;
      if (!state.fov.has(eKey)) continue;

      const dist = state.fovDistances.get(eKey) ?? 0;
      const alpha = Math.max(0.5, 1.0 - (dist / 8) * 0.5);

      const char = ENEMY_CHARS[enemy.name] ?? "?";
      ctx.globalAlpha = alpha;
      ctx.fillStyle = hexToCSS(enemy.color);
      ctx.font = `bold ${FONT}`;
      ctx.fillText(char, enemy.x * ts + ts / 2, enemy.y * ts + ts / 2 + 1);
      ctx.font = FONT;
    }

    // Draw player
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = PALETTE.player;
    ctx.font = `bold ${FONT}`;
    ctx.fillText(PLAYER_CHAR, px, py + 1);
    ctx.font = FONT;

    ctx.globalAlpha = 1.0;
    return this.canvas;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getTileSize(): number {
    return TILE_SIZE;
  }
}

function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
}
