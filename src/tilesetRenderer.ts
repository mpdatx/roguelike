import type { GameRenderer, RenderState } from "./renderer";
import { getTemplate } from "./items";
import { getTheme } from "./themes";

const TS = 32;

const spriteCache = new Map<string, HTMLCanvasElement>();
let cachedThemeId = "";

function createSprite(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TS;
  c.height = TS;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  return c;
}

function getSprite(key: string, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const theme = getTheme();
  if (cachedThemeId !== theme.id) {
    spriteCache.clear();
    cachedThemeId = theme.id;
  }
  let sprite = spriteCache.get(key);
  if (!sprite) {
    sprite = createSprite(draw);
    spriteCache.set(key, sprite);
  }
  return sprite;
}

function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

function hashTile(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

export class TilesetRenderer implements GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(private mapWidth: number, private mapHeight: number) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = mapWidth * TS;
    this.canvas.height = mapHeight * TS;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(state: RenderState): HTMLCanvasElement {
    const ctx = this.ctx;
    const theme = getTheme();
    const { palette, sprites } = theme;

    ctx.fillStyle = palette.unexplored.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const key = `${x},${y}`;
        const tile = state.map.get(key);
        const inFOV = state.fov.has(key);
        const isExplored = state.explored.has(key);

        if (!inFOV && !isExplored) continue;

        const isFloor = tile === 0;
        const variant = hashTile(x, y) % 4;
        const sprite = isFloor
          ? getSprite(`floor_${variant}`, (c) => sprites.floor(c, variant))
          : getSprite(`wall_${variant}`, (c) => sprites.wall(c, variant));

        let alpha = 1.0;
        if (inFOV) {
          const dist = state.fovDistances.get(key) ?? 0;
          alpha = Math.max(0.35, 1.0 - (dist / 8) * 0.65);
        } else {
          alpha = 0.3;
        }

        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, x * TS, y * TS);
      }
    }

    // Player glow
    ctx.globalAlpha = 1.0;
    const pcx = state.player.x * TS + TS / 2;
    const pcy = state.player.y * TS + TS / 2;
    const glowRadius = TS * 3.5;
    const gradient = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, glowRadius);
    gradient.addColorStop(0, palette.playerGlowStops[0]);
    gradient.addColorStop(0.5, palette.playerGlowStops[1]);
    gradient.addColorStop(1, palette.playerGlowStops[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(pcx - glowRadius, pcy - glowRadius, glowRadius * 2, glowRadius * 2);

    // Stairs
    if (state.stairs) {
      const sKey = `${state.stairs.x},${state.stairs.y}`;
      if (state.fov.has(sKey) || state.explored.has(sKey)) {
        ctx.globalAlpha = state.fov.has(sKey) ? 1.0 : 0.3;
        const stairSprite = getSprite("stairs", (c) => sprites.stairs(c));
        ctx.drawImage(stairSprite, state.stairs.x * TS, state.stairs.y * TS);
      }
    }

    // Ground items
    for (const item of state.groundItems) {
      const iKey = `${item.x},${item.y}`;
      if (!state.fov.has(iKey)) continue;

      const template = getTemplate(item.templateId);
      const dist = state.fovDistances.get(iKey) ?? 0;
      ctx.globalAlpha = Math.max(0.5, 1.0 - (dist / 8) * 0.5);

      const color = hexToCSS(template.color);
      const drawFn = sprites.items[template.category];
      if (drawFn) {
        const itemSprite = getSprite(`item_${template.category}_${color}`, (c) => drawFn(c, color));
        ctx.drawImage(itemSprite, item.x * TS, item.y * TS);
      }
    }

    // Enemies
    for (const enemy of state.enemies) {
      const eKey = `${enemy.x},${enemy.y}`;
      if (!state.fov.has(eKey)) continue;

      const dist = state.fovDistances.get(eKey) ?? 0;
      ctx.globalAlpha = Math.max(0.5, 1.0 - (dist / 8) * 0.5);

      const drawFn = sprites.enemies[enemy.name];
      if (drawFn) {
        const enemySprite = getSprite(`enemy_${enemy.name}`, (c) => drawFn(c));
        ctx.drawImage(enemySprite, enemy.x * TS, enemy.y * TS);
      }
    }

    // Player
    ctx.globalAlpha = 1.0;
    const playerSprite = getSprite("player", (c) => sprites.player(c));
    ctx.drawImage(playerSprite, state.player.x * TS, state.player.y * TS);

    ctx.globalAlpha = 1.0;
    return this.canvas;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getTileSize(): number {
    return TS;
  }
}
