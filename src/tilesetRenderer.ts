import type { GameRenderer, RenderState } from "./renderer";
import { getTemplate, type ItemCategory } from "./items";

const TS = 16; // tile size for pixel art

// Pre-rendered sprite cache
const spriteCache = new Map<string, HTMLCanvasElement>();

function createSprite(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TS;
  c.height = TS;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  return c;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function getSprite(key: string, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let sprite = spriteCache.get(key);
  if (!sprite) {
    sprite = createSprite(draw);
    spriteCache.set(key, sprite);
  }
  return sprite;
}

// --- Sprite definitions ---

function floorSprite(variant: number): HTMLCanvasElement {
  return getSprite(`floor_${variant}`, (ctx) => {
    // Dark base
    rect(ctx, 0, 0, TS, TS, "#1a1a32");
    // Subtle stone texture dots
    const dots = [
      [3, 3], [9, 2], [13, 5], [5, 10], [11, 12], [2, 14], [7, 7],
      [14, 9], [1, 6], [10, 14],
    ];
    const colors = ["#1e1e38", "#1c1c36", "#201e3a"];
    for (let i = 0; i < dots.length; i++) {
      if ((i + variant) % 3 === 0) {
        px(ctx, dots[i][0], dots[i][1], colors[i % colors.length]);
      }
    }
    // Occasional tiny highlight
    if (variant % 3 === 0) {
      px(ctx, 6 + variant, 4 + variant % 5, "#24243e");
    }
  });
}

function wallSprite(variant: number): HTMLCanvasElement {
  return getSprite(`wall_${variant}`, (ctx) => {
    // Brick pattern
    rect(ctx, 0, 0, TS, TS, "#2a2a4e");
    // Mortar lines
    const mortar = "#222240";
    rect(ctx, 0, 0, TS, 1, mortar);      // top edge
    rect(ctx, 0, 7, TS, 1, mortar);       // middle horizontal
    rect(ctx, 0, 15, TS, 1, mortar);      // bottom edge
    // Vertical mortar - offset per row
    const vx1 = variant % 2 === 0 ? 7 : 3;
    const vx2 = variant % 2 === 0 ? 3 : 11;
    rect(ctx, vx1, 0, 1, 8, mortar);
    rect(ctx, vx2, 7, 1, 9, mortar);
    // Highlight on bricks
    const hi = "#32325a";
    rect(ctx, 1, 1, TS - 2, 1, hi);
    rect(ctx, 1, 8, TS - 2, 1, hi);
    // Shadow at bottom of bricks
    const sh = "#222244";
    rect(ctx, 1, 6, TS - 2, 1, sh);
    rect(ctx, 1, 14, TS - 2, 1, sh);
  });
}

function stairsSprite(): HTMLCanvasElement {
  return getSprite("stairs", (ctx) => {
    rect(ctx, 0, 0, TS, TS, "#1a1a32");
    const c = "#ccaa00";
    // Descending steps
    rect(ctx, 3, 3, 10, 2, c);
    rect(ctx, 5, 6, 8, 2, c);
    rect(ctx, 7, 9, 6, 2, c);
    rect(ctx, 9, 12, 4, 2, c);
  });
}

function playerSprite(): HTMLCanvasElement {
  return getSprite("player", (ctx) => {
    const c = "#00ff88";
    const d = "#00cc66";
    // Head
    rect(ctx, 6, 1, 4, 4, c);
    // Eyes
    px(ctx, 7, 3, "#000");
    px(ctx, 9, 3, "#000");
    // Body
    rect(ctx, 6, 5, 4, 5, c);
    // Arms
    rect(ctx, 4, 6, 2, 3, d);
    rect(ctx, 10, 6, 2, 3, d);
    // Legs
    rect(ctx, 6, 10, 2, 4, d);
    rect(ctx, 8, 10, 2, 4, d);
    // Belt
    rect(ctx, 6, 8, 4, 1, "#886644");
  });
}

function ratSprite(): HTMLCanvasElement {
  return getSprite("rat", (ctx) => {
    const c = "#886644";
    const d = "#664422";
    // Body
    rect(ctx, 4, 7, 8, 4, c);
    // Head
    rect(ctx, 2, 7, 3, 3, c);
    // Eye
    px(ctx, 3, 8, "#ff0000");
    // Tail
    rect(ctx, 12, 9, 3, 1, d);
    px(ctx, 14, 8, d);
    // Ears
    px(ctx, 3, 6, d);
    px(ctx, 4, 6, d);
    // Legs
    px(ctx, 5, 11, d);
    px(ctx, 7, 11, d);
    px(ctx, 9, 11, d);
    px(ctx, 11, 11, d);
  });
}

function goblinSprite(): HTMLCanvasElement {
  return getSprite("goblin", (ctx) => {
    const c = "#44aa44";
    const d = "#338833";
    // Head
    rect(ctx, 5, 1, 6, 5, c);
    // Pointy ears
    px(ctx, 4, 2, c);
    px(ctx, 3, 1, c);
    px(ctx, 11, 2, c);
    px(ctx, 12, 1, c);
    // Eyes
    px(ctx, 7, 3, "#ff0000");
    px(ctx, 9, 3, "#ff0000");
    // Mouth
    rect(ctx, 7, 5, 3, 1, d);
    // Body
    rect(ctx, 5, 6, 6, 4, "#884444");
    // Arms
    rect(ctx, 3, 7, 2, 3, c);
    rect(ctx, 11, 7, 2, 3, c);
    // Legs
    rect(ctx, 5, 10, 2, 4, d);
    rect(ctx, 9, 10, 2, 4, d);
    // Weapon (club)
    rect(ctx, 13, 5, 2, 5, "#886644");
  });
}

function snakeSprite(): HTMLCanvasElement {
  return getSprite("snake", (ctx) => {
    const c = "#44ff44";
    const d = "#22cc22";
    // Coiled body
    rect(ctx, 3, 8, 3, 3, c);
    rect(ctx, 5, 6, 3, 3, d);
    rect(ctx, 7, 8, 3, 3, c);
    rect(ctx, 9, 6, 3, 3, d);
    // Head
    rect(ctx, 11, 4, 4, 3, c);
    // Eye
    px(ctx, 13, 5, "#ff0000");
    // Tongue
    px(ctx, 15, 5, "#ff4444");
    px(ctx, 15, 6, "#ff4444");
    // Tail
    rect(ctx, 1, 9, 2, 2, d);
    px(ctx, 0, 10, d);
  });
}

const ITEM_SPRITES: Record<ItemCategory, (color: string) => HTMLCanvasElement> = {
  potion: (color) => getSprite(`potion_${color}`, (ctx) => {
    // Bottle
    rect(ctx, 6, 2, 4, 3, "#aaaaaa");
    rect(ctx, 5, 5, 6, 7, color);
    rect(ctx, 6, 12, 4, 2, color);
    // Cork
    rect(ctx, 7, 1, 2, 2, "#886644");
    // Highlight
    px(ctx, 6, 6, "#ffffff");
  }),
  scroll: (color) => getSprite(`scroll_${color}`, (ctx) => {
    // Roll
    rect(ctx, 3, 3, 10, 10, "#ddccaa");
    rect(ctx, 2, 3, 1, 10, "#bbaa88");
    rect(ctx, 13, 3, 1, 10, "#bbaa88");
    // Ribbon
    rect(ctx, 5, 1, 6, 2, color);
    // Text lines
    rect(ctx, 5, 5, 6, 1, "#888866");
    rect(ctx, 5, 7, 5, 1, "#888866");
    rect(ctx, 5, 9, 6, 1, "#888866");
    rect(ctx, 5, 11, 3, 1, "#888866");
  }),
  weapon: (color) => getSprite(`weapon_${color}`, (ctx) => {
    // Blade
    rect(ctx, 7, 1, 2, 8, color);
    px(ctx, 7, 0, color);
    // Guard
    rect(ctx, 5, 9, 6, 1, "#886644");
    // Grip
    rect(ctx, 7, 10, 2, 4, "#664422");
    // Pommel
    rect(ctx, 7, 14, 2, 1, "#886644");
    // Edge highlight
    px(ctx, 6, 2, "#ffffff");
  }),
  armor: (color) => getSprite(`armor_${color}`, (ctx) => {
    // Chestplate
    rect(ctx, 4, 3, 8, 8, color);
    // Shoulders
    rect(ctx, 2, 3, 3, 3, color);
    rect(ctx, 11, 3, 3, 3, color);
    // Neck
    rect(ctx, 6, 1, 4, 3, color);
    // Skirt
    rect(ctx, 5, 11, 6, 3, color);
    // Detail lines
    rect(ctx, 7, 5, 2, 5, "#ffffff22");
  }),
  ring: (color) => getSprite(`ring_${color}`, (ctx) => {
    // Ring band
    rect(ctx, 5, 5, 6, 6, color);
    rect(ctx, 6, 6, 4, 4, "#1a1a32"); // hollow center
    // Gem
    rect(ctx, 6, 3, 4, 3, "#ffffff");
    rect(ctx, 7, 4, 2, 1, color);
  }),
};

function hashTile(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
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

    ctx.fillStyle = "#0a0a18";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw tiles
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const key = `${x},${y}`;
        const tile = state.map.get(key);
        const inFOV = state.fov.has(key);
        const isExplored = state.explored.has(key);

        if (!inFOV && !isExplored) continue;

        const isFloor = tile === 0;
        const variant = hashTile(x, y) % 4;
        const sprite = isFloor ? floorSprite(variant) : wallSprite(variant);

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
    const px = state.player.x * TS + TS / 2;
    const py = state.player.y * TS + TS / 2;
    const glowRadius = TS * 3;
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
    gradient.addColorStop(0, "rgba(0, 255, 136, 0.15)");
    gradient.addColorStop(0.5, "rgba(0, 255, 136, 0.05)");
    gradient.addColorStop(1, "rgba(0, 255, 136, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(px - glowRadius, py - glowRadius, glowRadius * 2, glowRadius * 2);

    // Stairs
    if (state.stairs) {
      const sKey = `${state.stairs.x},${state.stairs.y}`;
      if (state.fov.has(sKey) || state.explored.has(sKey)) {
        ctx.globalAlpha = state.fov.has(sKey) ? 1.0 : 0.3;
        ctx.drawImage(stairsSprite(), state.stairs.x * TS, state.stairs.y * TS);
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
      const drawFn = ITEM_SPRITES[template.category];
      if (drawFn) {
        ctx.drawImage(drawFn(color), item.x * TS, item.y * TS);
      }
    }

    // Enemies
    const enemySpriteFns: Record<string, () => HTMLCanvasElement> = {
      Rat: ratSprite,
      Goblin: goblinSprite,
      Snake: snakeSprite,
    };

    for (const enemy of state.enemies) {
      const eKey = `${enemy.x},${enemy.y}`;
      if (!state.fov.has(eKey)) continue;

      const dist = state.fovDistances.get(eKey) ?? 0;
      ctx.globalAlpha = Math.max(0.5, 1.0 - (dist / 8) * 0.5);

      const fn = enemySpriteFns[enemy.name];
      if (fn) {
        ctx.drawImage(fn(), enemy.x * TS, enemy.y * TS);
      }
    }

    // Player
    ctx.globalAlpha = 1.0;
    ctx.drawImage(playerSprite(), state.player.x * TS, state.player.y * TS);

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
