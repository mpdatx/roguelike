import type { BehaviorType } from "../entities";
import type { ItemCategory } from "../items";

export interface ThemePalette {
  floor: { bg: string; fg: string };
  wall: { bg: string; fg: string };
  exploredFloor: { bg: string; fg: string };
  exploredWall: { bg: string; fg: string };
  unexplored: { bg: string; fg: string };
  player: string;
  playerGlowStops: [string, string, string]; // radial gradient: center, mid, edge
  stairs: string;
  stairsExplored: string;
  floorVariants: { bg: string; fg: string }[];
}

export interface ThemeChars {
  player: string;
  wall: string;
  floor: string;
  stairs: string;
  enemies: Record<string, string>;
  items: Record<ItemCategory, string>;
}

export interface ThemeEnemy {
  name: string;
  color: number;
  behavior: BehaviorType;
}

export interface ThemeItem {
  id: string;
  name: string;
  description: string;
  color: number;
}

export interface ThemeText {
  descend: string;
  descendLevel: (depth: number) => string;
  gameOver: (depth: number) => string;
  levelNoun: string;
}

export type SpriteDrawFn = (ctx: CanvasRenderingContext2D) => void;
export type VariantSpriteDrawFn = (ctx: CanvasRenderingContext2D, variant: number) => void;
export type ColorSpriteDrawFn = (ctx: CanvasRenderingContext2D, color: string) => void;

export interface ThemeSprites {
  floor: VariantSpriteDrawFn;
  wall: VariantSpriteDrawFn;
  stairs: SpriteDrawFn;
  player: SpriteDrawFn;
  enemies: Record<string, SpriteDrawFn>;
  items: Record<ItemCategory, ColorSpriteDrawFn>;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  palette: ThemePalette;
  chars: ThemeChars;
  enemies: ThemeEnemy[];
  items: ThemeItem[];
  text: ThemeText;
  baseFovRange: number;
  sprites: ThemeSprites;
}

let activeTheme: ThemeDefinition;
const themeRegistry = new Map<string, ThemeDefinition>();

export function registerTheme(theme: ThemeDefinition) {
  themeRegistry.set(theme.id, theme);
}

export function setTheme(id: string) {
  const theme = themeRegistry.get(id);
  if (!theme) throw new Error(`Unknown theme: ${id}`);
  activeTheme = theme;
}

export function getTheme(): ThemeDefinition {
  return activeTheme;
}

export function getThemeList(): { id: string; name: string }[] {
  return [...themeRegistry.values()].map((t) => ({ id: t.id, name: t.name }));
}
