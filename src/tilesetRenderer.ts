import type { GameRenderer, RenderState } from "./renderer";
import { getTemplate, type ItemCategory } from "./items";

const TS = 32;

const spriteCache = new Map<string, HTMLCanvasElement>();

function createSprite(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TS;
  c.height = TS;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  return c;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
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

// --- Sprite definitions (32x32) ---

function floorSprite(variant: number): HTMLCanvasElement {
  return getSprite(`floor_${variant}`, (ctx) => {
    px(ctx, 0, 0, 32, 32, "#1a1a32");
    // Stone tile grid lines
    px(ctx, 0, 0, 32, 1, "#161630");
    px(ctx, 0, 0, 1, 32, "#161630");
    // Scattered texture specks
    const specks = [
      [5, 5], [18, 3], [27, 8], [10, 20], [22, 25], [3, 28], [14, 14],
      [28, 18], [7, 12], [20, 30], [12, 7], [25, 13], [4, 22], [16, 27],
    ];
    const colors = ["#1e1e38", "#1c1c36", "#201e3a", "#1d1d37"];
    for (let i = 0; i < specks.length; i++) {
      if ((i + variant) % 3 === 0) {
        px(ctx, specks[i][0], specks[i][1], 2, 2, colors[i % colors.length]);
      }
    }
    // Occasional crack
    if (variant === 0) {
      px(ctx, 8, 10, 1, 6, "#161630");
      px(ctx, 9, 15, 1, 4, "#161630");
    }
    if (variant === 2) {
      px(ctx, 20, 8, 4, 1, "#161630");
      px(ctx, 23, 9, 1, 3, "#161630");
    }
  });
}

function wallSprite(variant: number): HTMLCanvasElement {
  return getSprite(`wall_${variant}`, (ctx) => {
    px(ctx, 0, 0, 32, 32, "#2a2a4e");
    const mortar = "#222240";
    const hi = "#32325a";
    const sh = "#222244";
    // Horizontal mortar
    px(ctx, 0, 0, 32, 1, mortar);
    px(ctx, 0, 15, 32, 1, mortar);
    px(ctx, 0, 31, 32, 1, mortar);
    // Vertical mortar — offset by row
    const off1 = variant % 2 === 0 ? 15 : 7;
    const off2 = variant % 2 === 0 ? 7 : 23;
    px(ctx, off1, 0, 1, 16, mortar);
    px(ctx, off2, 15, 1, 17, mortar);
    // Brick highlights (top of each brick)
    px(ctx, 1, 1, 13, 1, hi);
    px(ctx, 17, 1, 14, 1, hi);
    px(ctx, 1, 16, 5, 1, hi);
    px(ctx, 9, 16, 14, 1, hi);
    px(ctx, 25, 16, 6, 1, hi);
    // Brick shadows (bottom of each brick)
    px(ctx, 1, 14, 13, 1, sh);
    px(ctx, 17, 14, 14, 1, sh);
    px(ctx, 1, 30, 5, 1, sh);
    px(ctx, 9, 30, 14, 1, sh);
    px(ctx, 25, 30, 6, 1, sh);
    // Surface texture
    if (variant === 1 || variant === 3) {
      px(ctx, 5, 6, 2, 2, "#2e2e52");
      px(ctx, 22, 22, 2, 2, "#2e2e52");
    }
    if (variant === 0 || variant === 2) {
      px(ctx, 10, 8, 2, 1, "#262646");
      px(ctx, 18, 24, 3, 1, "#262646");
    }
  });
}

function stairsSprite(): HTMLCanvasElement {
  return getSprite("stairs", (ctx) => {
    px(ctx, 0, 0, 32, 32, "#1a1a32");
    const c = "#ccaa00";
    const d = "#aa8800";
    const h = "#eedd44";
    // 5 descending steps
    px(ctx, 4, 4, 24, 4, c);
    px(ctx, 4, 4, 24, 1, h);
    px(ctx, 4, 7, 24, 1, d);

    px(ctx, 8, 9, 20, 4, c);
    px(ctx, 8, 9, 20, 1, h);
    px(ctx, 8, 12, 20, 1, d);

    px(ctx, 12, 14, 16, 4, c);
    px(ctx, 12, 14, 16, 1, h);
    px(ctx, 12, 17, 16, 1, d);

    px(ctx, 16, 19, 12, 4, c);
    px(ctx, 16, 19, 12, 1, h);
    px(ctx, 16, 22, 12, 1, d);

    px(ctx, 20, 24, 8, 4, c);
    px(ctx, 20, 24, 8, 1, h);
    px(ctx, 20, 27, 8, 1, d);
  });
}

function playerSprite(): HTMLCanvasElement {
  return getSprite("player", (ctx) => {
    const c = "#00ff88";
    const d = "#00cc66";
    const dk = "#00aa55";
    // Head
    px(ctx, 11, 2, 10, 8, c);
    px(ctx, 12, 1, 8, 1, c);
    // Hair
    px(ctx, 11, 1, 10, 2, "#006644");
    // Eyes
    px(ctx, 13, 5, 2, 2, "#ffffff");
    px(ctx, 14, 6, 1, 1, "#000000");
    px(ctx, 18, 5, 2, 2, "#ffffff");
    px(ctx, 19, 6, 1, 1, "#000000");
    // Mouth
    px(ctx, 14, 8, 4, 1, dk);
    // Body
    px(ctx, 10, 10, 12, 10, c);
    // Chest detail
    px(ctx, 15, 12, 2, 6, d);
    // Arms
    px(ctx, 6, 11, 4, 8, d);
    px(ctx, 22, 11, 4, 8, d);
    // Hands
    px(ctx, 6, 19, 4, 2, c);
    px(ctx, 22, 19, 4, 2, c);
    // Belt
    px(ctx, 10, 18, 12, 2, "#886644");
    px(ctx, 15, 18, 2, 2, "#ccaa44");
    // Legs
    px(ctx, 10, 20, 5, 8, d);
    px(ctx, 17, 20, 5, 8, d);
    // Boots
    px(ctx, 9, 27, 6, 3, "#664422");
    px(ctx, 17, 27, 6, 3, "#664422");
    // Boot soles
    px(ctx, 9, 29, 7, 1, "#442200");
    px(ctx, 17, 29, 7, 1, "#442200");
  });
}

function ratSprite(): HTMLCanvasElement {
  return getSprite("rat", (ctx) => {
    const c = "#886644";
    const d = "#664422";
    const lt = "#aa8866";
    // Body (oval)
    px(ctx, 8, 14, 16, 8, c);
    px(ctx, 10, 13, 12, 1, c);
    px(ctx, 10, 22, 12, 1, c);
    // Belly
    px(ctx, 12, 17, 8, 4, lt);
    // Head
    px(ctx, 3, 13, 7, 6, c);
    px(ctx, 1, 14, 3, 4, c);
    // Snout
    px(ctx, 1, 16, 2, 2, lt);
    px(ctx, 0, 17, 1, 1, "#ffaaaa");
    // Eyes
    px(ctx, 5, 14, 2, 2, "#ff0000");
    px(ctx, 6, 15, 1, 1, "#ff4444");
    // Ears
    px(ctx, 5, 11, 3, 3, d);
    px(ctx, 8, 11, 3, 3, d);
    px(ctx, 6, 12, 1, 1, "#ffccaa");
    px(ctx, 9, 12, 1, 1, "#ffccaa");
    // Tail
    px(ctx, 24, 18, 4, 2, d);
    px(ctx, 27, 16, 3, 2, d);
    px(ctx, 29, 14, 2, 2, d);
    // Legs
    px(ctx, 10, 22, 3, 4, d);
    px(ctx, 15, 22, 3, 4, d);
    px(ctx, 20, 22, 3, 4, d);
    // Whiskers
    px(ctx, 0, 15, 3, 1, "#aaa");
    px(ctx, 0, 18, 3, 1, "#aaa");
  });
}

function goblinSprite(): HTMLCanvasElement {
  return getSprite("goblin", (ctx) => {
    const c = "#44aa44";
    const d = "#338833";
    const dk = "#226622";
    // Head
    px(ctx, 10, 2, 12, 10, c);
    // Pointy ears
    px(ctx, 6, 4, 4, 4, c);
    px(ctx, 4, 3, 3, 3, c);
    px(ctx, 22, 4, 4, 4, c);
    px(ctx, 25, 3, 3, 3, c);
    px(ctx, 7, 5, 2, 2, "#ffccaa");
    px(ctx, 23, 5, 2, 2, "#ffccaa");
    // Eyes
    px(ctx, 12, 6, 3, 3, "#ffff00");
    px(ctx, 13, 7, 1, 1, "#ff0000");
    px(ctx, 18, 6, 3, 3, "#ffff00");
    px(ctx, 19, 7, 1, 1, "#ff0000");
    // Mouth / fangs
    px(ctx, 13, 10, 6, 1, dk);
    px(ctx, 14, 11, 1, 1, "#ffffff");
    px(ctx, 18, 11, 1, 1, "#ffffff");
    // Body (leather vest)
    px(ctx, 9, 12, 14, 10, "#884444");
    px(ctx, 10, 12, 12, 1, "#993333");
    // Arms
    px(ctx, 5, 13, 4, 8, c);
    px(ctx, 23, 13, 4, 8, c);
    // Fists
    px(ctx, 5, 21, 4, 2, d);
    px(ctx, 23, 21, 4, 2, d);
    // Legs
    px(ctx, 10, 22, 5, 7, d);
    px(ctx, 17, 22, 5, 7, d);
    // Feet
    px(ctx, 9, 28, 6, 2, dk);
    px(ctx, 17, 28, 6, 2, dk);
    // Weapon (club)
    px(ctx, 26, 8, 3, 14, "#886644");
    px(ctx, 25, 6, 5, 4, "#774433");
    // Loincloth
    px(ctx, 11, 21, 10, 2, "#664422");
  });
}

function snakeSprite(): HTMLCanvasElement {
  return getSprite("snake", (ctx) => {
    const c = "#44ff44";
    const d = "#22cc22";
    const dk = "#119911";
    const pat = "#33dd33";
    // Coiled body segments
    px(ctx, 4, 18, 6, 6, c);
    px(ctx, 3, 19, 1, 4, d);
    px(ctx, 5, 19, 2, 2, pat);

    px(ctx, 9, 14, 6, 6, d);
    px(ctx, 10, 15, 2, 2, pat);

    px(ctx, 14, 18, 6, 6, c);
    px(ctx, 15, 19, 2, 2, pat);

    px(ctx, 19, 14, 6, 6, d);
    px(ctx, 20, 15, 2, 2, pat);

    // Head
    px(ctx, 22, 7, 8, 7, c);
    px(ctx, 24, 6, 4, 1, c);
    // Eye
    px(ctx, 25, 9, 3, 2, "#ffffff");
    px(ctx, 26, 10, 1, 1, "#ff0000");
    // Nostril
    px(ctx, 29, 9, 1, 1, dk);
    // Tongue
    px(ctx, 30, 11, 2, 1, "#ff4444");
    px(ctx, 31, 12, 1, 1, "#ff4444");
    px(ctx, 30, 13, 1, 1, "#ff4444");
    // Neck
    px(ctx, 22, 13, 4, 2, d);
    // Tail
    px(ctx, 1, 20, 4, 4, d);
    px(ctx, 0, 22, 2, 2, dk);
    // Scale pattern on body
    px(ctx, 6, 20, 1, 1, dk);
    px(ctx, 11, 16, 1, 1, dk);
    px(ctx, 16, 20, 1, 1, dk);
    px(ctx, 21, 16, 1, 1, dk);
    // Underbelly
    px(ctx, 5, 23, 4, 1, "#66ff66");
    px(ctx, 15, 23, 4, 1, "#66ff66");
  });
}

const ITEM_SPRITES: Record<ItemCategory, (color: string) => HTMLCanvasElement> = {
  potion: (color) => getSprite(`potion_${color}`, (ctx) => {
    // Cork
    px(ctx, 13, 2, 6, 3, "#886644");
    px(ctx, 14, 1, 4, 1, "#aa8866");
    // Neck
    px(ctx, 12, 5, 8, 4, "#aaaaaa");
    px(ctx, 12, 5, 1, 4, "#888888");
    px(ctx, 19, 5, 1, 4, "#cccccc");
    // Body
    px(ctx, 9, 9, 14, 14, color);
    px(ctx, 10, 8, 12, 1, color);
    px(ctx, 10, 23, 12, 1, color);
    // Body shading
    px(ctx, 9, 9, 2, 14, darken(color));
    px(ctx, 21, 9, 2, 14, darken(color));
    // Highlight
    px(ctx, 12, 11, 2, 6, "#ffffff44");
    // Label
    px(ctx, 12, 17, 8, 4, "#ffffff33");
    // Bottom
    px(ctx, 11, 24, 10, 3, color);
    px(ctx, 12, 27, 8, 1, darken(color));
  }),
  scroll: (color) => getSprite(`scroll_${color}`, (ctx) => {
    // Main parchment
    px(ctx, 5, 6, 22, 20, "#ddccaa");
    // Left roller
    px(ctx, 3, 5, 3, 22, "#bbaa88");
    px(ctx, 3, 5, 1, 22, "#998877");
    px(ctx, 5, 5, 1, 22, "#ccbb99");
    // Right roller
    px(ctx, 26, 5, 3, 22, "#bbaa88");
    px(ctx, 26, 5, 1, 22, "#998877");
    px(ctx, 28, 5, 1, 22, "#ccbb99");
    // Ribbon/seal
    px(ctx, 10, 2, 12, 4, color);
    px(ctx, 11, 1, 10, 1, darken(color));
    // Text lines
    px(ctx, 8, 9, 16, 1, "#888866");
    px(ctx, 8, 12, 14, 1, "#888866");
    px(ctx, 8, 15, 16, 1, "#888866");
    px(ctx, 8, 18, 12, 1, "#888866");
    px(ctx, 8, 21, 15, 1, "#888866");
    px(ctx, 8, 24, 8, 1, "#888866");
  }),
  weapon: (color) => getSprite(`weapon_${color}`, (ctx) => {
    // Blade
    px(ctx, 14, 1, 4, 16, color);
    px(ctx, 13, 1, 1, 4, color);
    px(ctx, 18, 1, 1, 4, color);
    // Blade edge highlight
    px(ctx, 14, 1, 1, 16, lighten(color));
    // Blade shadow
    px(ctx, 17, 2, 1, 14, darken(color));
    // Point
    px(ctx, 15, 0, 2, 1, color);
    // Fuller (groove)
    px(ctx, 15, 3, 2, 11, darken(color));
    // Guard
    px(ctx, 9, 17, 14, 2, "#886644");
    px(ctx, 9, 17, 14, 1, "#aa8866");
    px(ctx, 8, 17, 1, 2, "#ccaa44");
    px(ctx, 23, 17, 1, 2, "#ccaa44");
    // Grip (wrapped)
    px(ctx, 13, 19, 6, 8, "#664422");
    px(ctx, 13, 20, 6, 1, "#553311");
    px(ctx, 13, 23, 6, 1, "#553311");
    px(ctx, 13, 26, 6, 1, "#553311");
    // Pommel
    px(ctx, 12, 27, 8, 3, "#886644");
    px(ctx, 13, 28, 6, 1, "#ccaa44");
  }),
  armor: (color) => getSprite(`armor_${color}`, (ctx) => {
    // Shoulders
    px(ctx, 3, 5, 8, 6, color);
    px(ctx, 21, 5, 8, 6, color);
    px(ctx, 4, 4, 6, 1, color);
    px(ctx, 22, 4, 6, 1, color);
    // Shoulder highlights
    px(ctx, 4, 5, 6, 1, lighten(color));
    px(ctx, 22, 5, 6, 1, lighten(color));
    // Neck opening
    px(ctx, 11, 2, 10, 4, color);
    px(ctx, 12, 1, 8, 1, lighten(color));
    px(ctx, 13, 3, 6, 2, "#1a1a32");
    // Chest
    px(ctx, 7, 8, 18, 14, color);
    // Chest shadow
    px(ctx, 7, 8, 2, 14, darken(color));
    px(ctx, 23, 8, 2, 14, darken(color));
    // Center seam
    px(ctx, 15, 8, 2, 14, darken(color));
    // Chest emblem
    px(ctx, 14, 11, 4, 4, lighten(color));
    px(ctx, 15, 12, 2, 2, "#ffffff44");
    // Skirt
    px(ctx, 8, 22, 16, 6, color);
    px(ctx, 9, 28, 14, 2, color);
    px(ctx, 8, 22, 1, 6, darken(color));
    px(ctx, 23, 22, 1, 6, darken(color));
    // Skirt slits
    px(ctx, 15, 24, 2, 6, darken(color));
  }),
  ring: (color) => getSprite(`ring_${color}`, (ctx) => {
    // Band - thicker ring
    px(ctx, 9, 12, 14, 12, color);
    px(ctx, 11, 10, 10, 2, color);
    px(ctx, 11, 24, 10, 2, color);
    // Hollow center
    px(ctx, 12, 14, 8, 8, "#1a1a32");
    px(ctx, 13, 13, 6, 1, "#1a1a32");
    px(ctx, 13, 22, 6, 1, "#1a1a32");
    // Band shading
    px(ctx, 9, 12, 2, 12, darken(color));
    px(ctx, 21, 12, 2, 12, lighten(color));
    // Gem setting
    px(ctx, 12, 6, 8, 6, "#dddddd");
    px(ctx, 13, 5, 6, 1, "#cccccc");
    // Gem
    px(ctx, 13, 7, 6, 4, color);
    px(ctx, 14, 6, 4, 1, color);
    // Gem facet highlight
    px(ctx, 14, 7, 2, 2, lighten(color));
    px(ctx, 13, 7, 1, 1, "#ffffff88");
    // Gem shadow
    px(ctx, 17, 9, 2, 2, darken(color));
  }),
};

function darken(color: string): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgb(${Math.floor(r * 0.6)},${Math.floor(g * 0.6)},${Math.floor(b * 0.6)})`;
}

function lighten(color: string): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.floor(r * 1.4))},${Math.min(255, Math.floor(g * 1.4))},${Math.min(255, Math.floor(b * 1.4))})`;
}

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
    const pcx = state.player.x * TS + TS / 2;
    const pcy = state.player.y * TS + TS / 2;
    const glowRadius = TS * 3.5;
    const gradient = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, glowRadius);
    gradient.addColorStop(0, "rgba(0, 255, 136, 0.12)");
    gradient.addColorStop(0.5, "rgba(0, 255, 136, 0.04)");
    gradient.addColorStop(1, "rgba(0, 255, 136, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(pcx - glowRadius, pcy - glowRadius, glowRadius * 2, glowRadius * 2);

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
