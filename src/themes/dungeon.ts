import type { ThemeDefinition } from "./theme";
import { px, darken, lighten } from "./spriteUtils";

export const dungeonTheme: ThemeDefinition = {
  id: "dungeon",
  name: "Dungeon",

  palette: {
    floor: { bg: "#1e1e3a", fg: "#4a4a6a" },
    wall: { bg: "#2a2a4a", fg: "#5a5a7a" },
    exploredFloor: { bg: "#12122a", fg: "#2a2a3a" },
    exploredWall: { bg: "#161630", fg: "#2a2a3a" },
    unexplored: { bg: "#0a0a18", fg: "#0a0a18" },
    player: "#00ff88",
    playerGlowStops: ["rgba(0, 255, 136, 0.12)", "rgba(0, 255, 136, 0.04)", "rgba(0, 255, 136, 0)"],
    stairs: "#ffcc00",
    stairsExplored: "#665500",
    floorVariants: [
      { bg: "#1e1e3a", fg: "#4a4a6a" },
      { bg: "#1c1e3c", fg: "#484a6c" },
      { bg: "#201e38", fg: "#4c4a68" },
      { bg: "#1e2038", fg: "#4a4c68" },
      { bg: "#1c1c3c", fg: "#48486c" },
    ],
  },

  chars: {
    player: "@",
    wall: "#",
    floor: "\u00b7",
    stairs: ">",
    enemies: { Rat: "r", Goblin: "g", Snake: "s" },
    items: { potion: "!", scroll: "?", weapon: "/", armor: "[", ring: "=" },
  },

  enemies: [
    { name: "Rat", color: 0x886644, behavior: "wander" },
    { name: "Goblin", color: 0xff4444, behavior: "chase" },
    { name: "Snake", color: 0x44ff44, behavior: "slow" },
  ],

  items: [
    { id: "health_potion", name: "Health Potion", description: "Restores 8 HP", color: 0xff4488 },
    { id: "greater_health_potion", name: "Greater Health Potion", description: "Restores 15 HP", color: 0xff66aa },
    { id: "strength_potion", name: "Strength Potion", description: "+1 attack for 20 turns", color: 0xff8844 },
    { id: "speed_potion", name: "Speed Potion", description: "Extra actions for 10 turns", color: 0x44ffff },
    { id: "scroll_lightning", name: "Scroll of Lightning", description: "8 damage to nearest visible enemy", color: 0xffff44 },
    { id: "scroll_confusion", name: "Scroll of Confusion", description: "Confuse all visible enemies", color: 0xff88ff },
    { id: "scroll_mapping", name: "Scroll of Mapping", description: "Reveal entire floor", color: 0x88ffff },
    { id: "scroll_teleportation", name: "Scroll of Teleportation", description: "Teleport to random location", color: 0xaa88ff },
    { id: "dagger", name: "Dagger", description: "+1 Attack", color: 0xaaaaaa },
    { id: "sword", name: "Sword", description: "+2 Attack", color: 0xcccccc },
    { id: "battle_axe", name: "Battle Axe", description: "+3 Attack", color: 0xdddddd },
    { id: "enchanted_blade", name: "Enchanted Blade", description: "+4 Attack", color: 0x88aaff },
    { id: "leather_armor", name: "Leather Armor", description: "+1 Defense", color: 0x886644 },
    { id: "chainmail", name: "Chainmail", description: "+2 Defense", color: 0xaaaaaa },
    { id: "plate_armor", name: "Plate Armor", description: "+3 Defense", color: 0xcccccc },
    { id: "ring_vitality", name: "Ring of Vitality", description: "+5 Max HP", color: 0xff4488 },
    { id: "ring_sight", name: "Ring of Sight", description: "+3 FOV range", color: 0x44ffff },
    { id: "ring_protection", name: "Ring of Protection", description: "+1 Defense", color: 0x88aaff },
  ],

  text: {
    descend: "You descend into the dungeon...",
    descendLevel: (d) => `You descend to level ${d}...`,
    gameOver: (d) => `GAME OVER\n\nReached level ${d}\n\nTap to restart`,
    levelNoun: "level",
  },

  baseFovRange: 8,

  sprites: {
    floor: (ctx, variant) => {
      px(ctx, 0, 0, 32, 32, "#1a1a32");
      px(ctx, 0, 0, 32, 1, "#161630");
      px(ctx, 0, 0, 1, 32, "#161630");
      const specks = [[5,5],[18,3],[27,8],[10,20],[22,25],[3,28],[14,14],[28,18],[7,12],[20,30],[12,7],[25,13],[4,22],[16,27]];
      const colors = ["#1e1e38", "#1c1c36", "#201e3a", "#1d1d37"];
      for (let i = 0; i < specks.length; i++) {
        if ((i + variant) % 3 === 0) px(ctx, specks[i][0], specks[i][1], 2, 2, colors[i % colors.length]);
      }
      if (variant === 0) { px(ctx, 8, 10, 1, 6, "#161630"); px(ctx, 9, 15, 1, 4, "#161630"); }
      if (variant === 2) { px(ctx, 20, 8, 4, 1, "#161630"); px(ctx, 23, 9, 1, 3, "#161630"); }
    },

    wall: (ctx, variant) => {
      px(ctx, 0, 0, 32, 32, "#2a2a4e");
      const m = "#222240", hi = "#32325a", sh = "#222244";
      px(ctx, 0, 0, 32, 1, m); px(ctx, 0, 15, 32, 1, m); px(ctx, 0, 31, 32, 1, m);
      const o1 = variant % 2 === 0 ? 15 : 7, o2 = variant % 2 === 0 ? 7 : 23;
      px(ctx, o1, 0, 1, 16, m); px(ctx, o2, 15, 1, 17, m);
      px(ctx, 1, 1, 13, 1, hi); px(ctx, 17, 1, 14, 1, hi);
      px(ctx, 1, 16, 5, 1, hi); px(ctx, 9, 16, 14, 1, hi); px(ctx, 25, 16, 6, 1, hi);
      px(ctx, 1, 14, 13, 1, sh); px(ctx, 17, 14, 14, 1, sh);
      px(ctx, 1, 30, 5, 1, sh); px(ctx, 9, 30, 14, 1, sh); px(ctx, 25, 30, 6, 1, sh);
      if (variant === 1 || variant === 3) { px(ctx, 5, 6, 2, 2, "#2e2e52"); px(ctx, 22, 22, 2, 2, "#2e2e52"); }
      if (variant === 0 || variant === 2) { px(ctx, 10, 8, 2, 1, "#262646"); px(ctx, 18, 24, 3, 1, "#262646"); }
    },

    stairs: (ctx) => {
      px(ctx, 0, 0, 32, 32, "#1a1a32");
      const c = "#ccaa00", d = "#aa8800", h = "#eedd44";
      px(ctx,4,4,24,4,c); px(ctx,4,4,24,1,h); px(ctx,4,7,24,1,d);
      px(ctx,8,9,20,4,c); px(ctx,8,9,20,1,h); px(ctx,8,12,20,1,d);
      px(ctx,12,14,16,4,c); px(ctx,12,14,16,1,h); px(ctx,12,17,16,1,d);
      px(ctx,16,19,12,4,c); px(ctx,16,19,12,1,h); px(ctx,16,22,12,1,d);
      px(ctx,20,24,8,4,c); px(ctx,20,24,8,1,h); px(ctx,20,27,8,1,d);
    },

    player: (ctx) => {
      const c="#00ff88",d="#00cc66",dk="#00aa55";
      px(ctx,11,2,10,8,c); px(ctx,12,1,8,1,c);
      px(ctx,11,1,10,2,"#006644");
      px(ctx,13,5,2,2,"#ffffff"); px(ctx,14,6,1,1,"#000000");
      px(ctx,18,5,2,2,"#ffffff"); px(ctx,19,6,1,1,"#000000");
      px(ctx,14,8,4,1,dk);
      px(ctx,10,10,12,10,c); px(ctx,15,12,2,6,d);
      px(ctx,6,11,4,8,d); px(ctx,22,11,4,8,d);
      px(ctx,6,19,4,2,c); px(ctx,22,19,4,2,c);
      px(ctx,10,18,12,2,"#886644"); px(ctx,15,18,2,2,"#ccaa44");
      px(ctx,10,20,5,8,d); px(ctx,17,20,5,8,d);
      px(ctx,9,27,6,3,"#664422"); px(ctx,17,27,6,3,"#664422");
      px(ctx,9,29,7,1,"#442200"); px(ctx,17,29,7,1,"#442200");
    },

    enemies: {
      Rat: (ctx) => {
        const c="#886644",d="#664422",lt="#aa8866";
        px(ctx,8,14,16,8,c); px(ctx,10,13,12,1,c); px(ctx,10,22,12,1,c);
        px(ctx,12,17,8,4,lt);
        px(ctx,3,13,7,6,c); px(ctx,1,14,3,4,c);
        px(ctx,1,16,2,2,lt); px(ctx,0,17,1,1,"#ffaaaa");
        px(ctx,5,14,2,2,"#ff0000"); px(ctx,6,15,1,1,"#ff4444");
        px(ctx,5,11,3,3,d); px(ctx,8,11,3,3,d);
        px(ctx,6,12,1,1,"#ffccaa"); px(ctx,9,12,1,1,"#ffccaa");
        px(ctx,24,18,4,2,d); px(ctx,27,16,3,2,d); px(ctx,29,14,2,2,d);
        px(ctx,10,22,3,4,d); px(ctx,15,22,3,4,d); px(ctx,20,22,3,4,d);
        px(ctx,0,15,3,1,"#aaa"); px(ctx,0,18,3,1,"#aaa");
      },
      Goblin: (ctx) => {
        const c="#44aa44",d="#338833",dk="#226622";
        px(ctx,10,2,12,10,c);
        px(ctx,6,4,4,4,c); px(ctx,4,3,3,3,c); px(ctx,22,4,4,4,c); px(ctx,25,3,3,3,c);
        px(ctx,7,5,2,2,"#ffccaa"); px(ctx,23,5,2,2,"#ffccaa");
        px(ctx,12,6,3,3,"#ffff00"); px(ctx,13,7,1,1,"#ff0000");
        px(ctx,18,6,3,3,"#ffff00"); px(ctx,19,7,1,1,"#ff0000");
        px(ctx,13,10,6,1,dk); px(ctx,14,11,1,1,"#ffffff"); px(ctx,18,11,1,1,"#ffffff");
        px(ctx,9,12,14,10,"#884444"); px(ctx,10,12,12,1,"#993333");
        px(ctx,5,13,4,8,c); px(ctx,23,13,4,8,c);
        px(ctx,5,21,4,2,d); px(ctx,23,21,4,2,d);
        px(ctx,10,22,5,7,d); px(ctx,17,22,5,7,d);
        px(ctx,9,28,6,2,dk); px(ctx,17,28,6,2,dk);
        px(ctx,26,8,3,14,"#886644"); px(ctx,25,6,5,4,"#774433");
        px(ctx,11,21,10,2,"#664422");
      },
      Snake: (ctx) => {
        const c="#44ff44",d="#22cc22",dk="#119911",pat="#33dd33";
        px(ctx,4,18,6,6,c); px(ctx,3,19,1,4,d); px(ctx,5,19,2,2,pat);
        px(ctx,9,14,6,6,d); px(ctx,10,15,2,2,pat);
        px(ctx,14,18,6,6,c); px(ctx,15,19,2,2,pat);
        px(ctx,19,14,6,6,d); px(ctx,20,15,2,2,pat);
        px(ctx,22,7,8,7,c); px(ctx,24,6,4,1,c);
        px(ctx,25,9,3,2,"#ffffff"); px(ctx,26,10,1,1,"#ff0000");
        px(ctx,29,9,1,1,dk);
        px(ctx,30,11,2,1,"#ff4444"); px(ctx,31,12,1,1,"#ff4444"); px(ctx,30,13,1,1,"#ff4444");
        px(ctx,22,13,4,2,d);
        px(ctx,1,20,4,4,d); px(ctx,0,22,2,2,dk);
        px(ctx,6,20,1,1,dk); px(ctx,11,16,1,1,dk); px(ctx,16,20,1,1,dk); px(ctx,21,16,1,1,dk);
        px(ctx,5,23,4,1,"#66ff66"); px(ctx,15,23,4,1,"#66ff66");
      },
    },

    items: {
      potion: (ctx, color) => {
        px(ctx,13,2,6,3,"#aaaaaa"); px(ctx,14,1,4,1,"#aa8866");
        px(ctx,12,5,8,4,"#aaaaaa"); px(ctx,12,5,1,4,"#888888"); px(ctx,19,5,1,4,"#cccccc");
        px(ctx,9,9,14,14,color); px(ctx,10,8,12,1,color); px(ctx,10,23,12,1,color);
        px(ctx,9,9,2,14,darken(color)); px(ctx,21,9,2,14,darken(color));
        px(ctx,12,11,2,6,"#ffffff44"); px(ctx,12,17,8,4,"#ffffff33");
        px(ctx,11,24,10,3,color); px(ctx,12,27,8,1,darken(color));
      },
      scroll: (ctx, color) => {
        px(ctx,5,6,22,20,"#ddccaa");
        px(ctx,3,5,3,22,"#bbaa88"); px(ctx,3,5,1,22,"#998877"); px(ctx,5,5,1,22,"#ccbb99");
        px(ctx,26,5,3,22,"#bbaa88"); px(ctx,26,5,1,22,"#998877"); px(ctx,28,5,1,22,"#ccbb99");
        px(ctx,10,2,12,4,color); px(ctx,11,1,10,1,darken(color));
        px(ctx,8,9,16,1,"#888866"); px(ctx,8,12,14,1,"#888866"); px(ctx,8,15,16,1,"#888866");
        px(ctx,8,18,12,1,"#888866"); px(ctx,8,21,15,1,"#888866"); px(ctx,8,24,8,1,"#888866");
      },
      weapon: (ctx, color) => {
        px(ctx,14,1,4,16,color); px(ctx,13,1,1,4,color); px(ctx,18,1,1,4,color);
        px(ctx,14,1,1,16,lighten(color)); px(ctx,17,2,1,14,darken(color));
        px(ctx,15,0,2,1,color); px(ctx,15,3,2,11,darken(color));
        px(ctx,9,17,14,2,"#886644"); px(ctx,9,17,14,1,"#aa8866");
        px(ctx,8,17,1,2,"#ccaa44"); px(ctx,23,17,1,2,"#ccaa44");
        px(ctx,13,19,6,8,"#664422");
        px(ctx,13,20,6,1,"#553311"); px(ctx,13,23,6,1,"#553311"); px(ctx,13,26,6,1,"#553311");
        px(ctx,12,27,8,3,"#886644"); px(ctx,13,28,6,1,"#ccaa44");
      },
      armor: (ctx, color) => {
        px(ctx,3,5,8,6,color); px(ctx,21,5,8,6,color);
        px(ctx,4,4,6,1,color); px(ctx,22,4,6,1,color);
        px(ctx,4,5,6,1,lighten(color)); px(ctx,22,5,6,1,lighten(color));
        px(ctx,11,2,10,4,color); px(ctx,12,1,8,1,lighten(color)); px(ctx,13,3,6,2,"#1a1a32");
        px(ctx,7,8,18,14,color);
        px(ctx,7,8,2,14,darken(color)); px(ctx,23,8,2,14,darken(color));
        px(ctx,15,8,2,14,darken(color));
        px(ctx,14,11,4,4,lighten(color)); px(ctx,15,12,2,2,"#ffffff44");
        px(ctx,8,22,16,6,color); px(ctx,9,28,14,2,color);
        px(ctx,8,22,1,6,darken(color)); px(ctx,23,22,1,6,darken(color));
        px(ctx,15,24,2,6,darken(color));
      },
      ring: (ctx, color) => {
        px(ctx,9,12,14,12,color); px(ctx,11,10,10,2,color); px(ctx,11,24,10,2,color);
        px(ctx,12,14,8,8,"#1a1a32"); px(ctx,13,13,6,1,"#1a1a32"); px(ctx,13,22,6,1,"#1a1a32");
        px(ctx,9,12,2,12,darken(color)); px(ctx,21,12,2,12,lighten(color));
        px(ctx,12,6,8,6,"#dddddd"); px(ctx,13,5,6,1,"#cccccc");
        px(ctx,13,7,6,4,color); px(ctx,14,6,4,1,color);
        px(ctx,14,7,2,2,lighten(color)); px(ctx,13,7,1,1,"#ffffff88");
        px(ctx,17,9,2,2,darken(color));
      },
    },
  },
};
