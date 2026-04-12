import type { Entity, Enemy } from "./entities";
import type { GroundItem } from "./items";
import { getTemplate } from "./items";
import { getTheme } from "./themes";

export const TILE_SIZE = 24;
const FONT_SIZE = 18;
const FONT = `${FONT_SIZE}px monospace`;

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

function hashTile(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
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
    const theme = getTheme();
    const { palette, chars } = theme;

    ctx.fillStyle = palette.unexplored.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const key = `${x},${y}`;
        const tile = state.map.get(key);
        const inFOV = state.fov.has(key);
        const isExplored = state.explored.has(key);

        if (!inFOV && !isExplored) continue;

        const isFloor = tile === 0;
        let bg: string, fg: string;

        if (inFOV) {
          if (isFloor) {
            const variant = hashTile(x, y) % palette.floorVariants.length;
            const fv = palette.floorVariants[variant];
            bg = fv.bg;
            fg = fv.fg;
          } else {
            bg = palette.wall.bg;
            fg = palette.wall.fg;
          }
        } else {
          const colors = isFloor ? palette.exploredFloor : palette.exploredWall;
          bg = colors.bg;
          fg = colors.fg;
        }

        let alpha = 1.0;
        if (inFOV) {
          const dist = state.fovDistances.get(key) ?? 0;
          alpha = Math.max(0.35, 1.0 - (dist / 8) * 0.65);
        }

        ctx.globalAlpha = inFOV ? alpha : 1.0;
        ctx.fillStyle = bg;
        ctx.fillRect(x * ts, y * ts, ts, ts);

        ctx.fillStyle = fg;
        ctx.fillText(isFloor ? chars.floor : chars.wall, x * ts + ts / 2, y * ts + ts / 2 + 1);
      }
    }

    // Player glow
    ctx.globalAlpha = 1.0;
    const px = state.player.x * ts + ts / 2;
    const py = state.player.y * ts + ts / 2;
    const glowRadius = ts * 3;
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
    gradient.addColorStop(0, palette.playerGlowStops[0]);
    gradient.addColorStop(0.5, palette.playerGlowStops[1]);
    gradient.addColorStop(1, palette.playerGlowStops[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(px - glowRadius, py - glowRadius, glowRadius * 2, glowRadius * 2);

    // Stairs
    if (state.stairs) {
      const sKey = `${state.stairs.x},${state.stairs.y}`;
      if (state.fov.has(sKey) || state.explored.has(sKey)) {
        const inView = state.fov.has(sKey);
        ctx.globalAlpha = inView ? 1.0 : 0.4;
        ctx.fillStyle = inView ? palette.stairs : palette.stairsExplored;
        ctx.font = `bold ${FONT}`;
        ctx.fillText(chars.stairs, state.stairs.x * ts + ts / 2, state.stairs.y * ts + ts / 2 + 1);
        ctx.font = FONT;
      }
    }

    // Ground items
    ctx.globalAlpha = 1.0;
    for (const item of state.groundItems) {
      const iKey = `${item.x},${item.y}`;
      if (!state.fov.has(iKey)) continue;

      const template = getTemplate(item.templateId);
      const char = chars.items[template.category] ?? "?";
      const dist = state.fovDistances.get(iKey) ?? 0;
      ctx.globalAlpha = Math.max(0.5, 1.0 - (dist / 8) * 0.5);
      ctx.fillStyle = hexToCSS(template.color);
      ctx.fillText(char, item.x * ts + ts / 2, item.y * ts + ts / 2 + 1);
    }

    // Enemies
    for (const enemy of state.enemies) {
      const eKey = `${enemy.x},${enemy.y}`;
      if (!state.fov.has(eKey)) continue;

      const dist = state.fovDistances.get(eKey) ?? 0;
      ctx.globalAlpha = Math.max(0.5, 1.0 - (dist / 8) * 0.5);
      const char = chars.enemies[enemy.name] ?? "?";
      ctx.fillStyle = hexToCSS(enemy.color);
      ctx.font = `bold ${FONT}`;
      ctx.fillText(char, enemy.x * ts + ts / 2, enemy.y * ts + ts / 2 + 1);
      ctx.font = FONT;
    }

    // Player
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = palette.player;
    ctx.font = `bold ${FONT}`;
    ctx.fillText(chars.player, px, py + 1);
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
