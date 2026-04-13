import type { ThemeDefinition } from "./theme";
import { px, darken, lighten } from "./spriteUtils";

export const spaceStationTheme: ThemeDefinition = {
  id: "spaceStation",
  name: "Space Station",

  palette: {
    floor: { bg: "#181820", fg: "#383840" },
    wall: { bg: "#2a3040", fg: "#4a5060" },
    exploredFloor: { bg: "#101018", fg: "#202028" },
    exploredWall: { bg: "#141820", fg: "#202830" },
    unexplored: { bg: "#08080c", fg: "#08080c" },
    player: "#00ccff",
    playerGlowStops: ["rgba(0, 204, 255, 0.14)", "rgba(0, 204, 255, 0.05)", "rgba(0, 204, 255, 0)"],
    stairs: "#ff8844",
    stairsExplored: "#664422",
    floorVariants: [
      { bg: "#181820", fg: "#383840" },
      { bg: "#1a1a22", fg: "#3a3a42" },
      { bg: "#16161e", fg: "#36363e" },
      { bg: "#181822", fg: "#383842" },
      { bg: "#1a181e", fg: "#3a383e" },
    ],
  },

  chars: {
    player: "@",
    wall: "\u2588", // full block
    floor: ".",
    stairs: "\u2261", // triple bar (elevator)
    enemies: { "Maintenance Bot": "b", "Security Drone": "d", Xenomorph: "x" },
    items: { potion: "+", scroll: "\u00a7", weapon: "\u2191", armor: "\u00d8", ring: "\u00b0" },
  },

  enemies: [
    { name: "Maintenance Bot", color: 0x8888aa, behavior: "wander" },
    { name: "Security Drone", color: 0xff6644, behavior: "chase" },
    { name: "Xenomorph", color: 0x44ff44, behavior: "slow" },
  ],

  items: [
    { id: "health_potion", name: "Med-Kit", description: "Restores 8 HP", color: 0xff4488 },
    { id: "greater_health_potion", name: "Trauma Kit", description: "Restores 15 HP", color: 0xff66aa },
    { id: "strength_potion", name: "Combat Stim", description: "+1 attack for 20 turns", color: 0xff8844 },
    { id: "speed_potion", name: "Reflex Booster", description: "Extra actions for 10 turns", color: 0x44ffff },
    { id: "scroll_lightning", name: "EMP Charge", description: "8 damage to nearest visible enemy", color: 0xffff44 },
    { id: "scroll_confusion", name: "Scrambler Pulse", description: "Scramble all visible enemies", color: 0xff88ff },
    { id: "scroll_mapping", name: "Station Schematic", description: "Reveal entire deck", color: 0x88ffff },
    { id: "scroll_teleportation", name: "Emergency Teleport", description: "Teleport to random location", color: 0xaa88ff },
    { id: "dagger", name: "Utility Knife", description: "+1 Attack", color: 0x8888aa },
    { id: "sword", name: "Laser Blade", description: "+2 Attack", color: 0x44ccff },
    { id: "battle_axe", name: "Plasma Cutter", description: "+3 Attack", color: 0xff8844 },
    { id: "enchanted_blade", name: "Particle Sword", description: "+4 Attack", color: 0x88aaff },
    { id: "leather_armor", name: "Flight Suit", description: "+1 Defense", color: 0x667788 },
    { id: "chainmail", name: "Tactical Vest", description: "+2 Defense", color: 0x889988 },
    { id: "plate_armor", name: "Power Armor", description: "+3 Defense", color: 0xaabbcc },
    { id: "ring_vitality", name: "Vitality Implant", description: "+5 Max HP", color: 0xff4488 },
    { id: "ring_sight", name: "Thermal Visor", description: "+3 FOV range", color: 0x44ffff },
    { id: "ring_protection", name: "Shield Module", description: "+1 Defense", color: 0x88aaff },
    { id: "regen_potion", name: "Nano-Med Injector", description: "Regen 1 HP/turn for 15 turns", color: 0x44ff88 },
    { id: "invisibility_potion", name: "Cloaking Device", description: "Invisible for 8 turns", color: 0xaa88ff },
    { id: "scroll_fireball", name: "Incendiary Grenade", description: "5 damage to all visible enemies", color: 0xff6622 },
    { id: "scroll_fear", name: "Sonic Disruptor", description: "All visible enemies flee", color: 0xcc44cc },
    { id: "scroll_enchant", name: "Weapon Mod Kit", description: "Upgrade equipped weapon", color: 0xffdd88 },
    { id: "spear", name: "Shock Prod", description: "+2 Attack", color: 0x44ccff },
    { id: "war_hammer", name: "Power Maul", description: "+3 Attack", color: 0xccbbaa },
    { id: "vampiric_blade", name: "Neuro-Drain Blade", description: "+2 Attack, lifesteal", color: 0xcc2244 },
    { id: "thorned_armor", name: "Reactive Plating", description: "+1 Def, reflect 1 dmg", color: 0x66aa44 },
    { id: "shield_armor", name: "Riot Shield", description: "+1 Def, 25% block", color: 0x8899aa },
    { id: "ring_regen", name: "Bio-Repair Module", description: "Heal 1 HP every 5 turns", color: 0x44ff88 },
    { id: "ring_blink", name: "Phase Shift Module", description: "10% blink when hit", color: 0xaa88ff },
  ],

  text: {
    descend: "You board the station...",
    descendLevel: (d) => `You take the elevator to deck ${d}...`,
    gameOver: (d) => `MISSION FAILED\n\nReached deck ${d}\n\nTap to restart`,
    levelNoun: "deck",
  },

  baseFovRange: 10,

  sprites: {
    floor: (ctx, variant) => {
      px(ctx, 0, 0, 32, 32, "#181820");
      // Metal grate grid
      px(ctx, 0, 0, 32, 1, "#222228");
      px(ctx, 0, 15, 32, 1, "#222228");
      px(ctx, 0, 31, 32, 1, "#222228");
      px(ctx, 0, 0, 1, 32, "#222228");
      px(ctx, 15, 0, 1, 32, "#222228");
      px(ctx, 31, 0, 1, 32, "#222228");
      // Grate holes
      px(ctx, 3, 3, 4, 4, "#141418");
      px(ctx, 9, 3, 4, 4, "#141418");
      px(ctx, 19, 3, 4, 4, "#141418");
      px(ctx, 25, 3, 4, 4, "#141418");
      px(ctx, 3, 19, 4, 4, "#141418");
      px(ctx, 9, 19, 4, 4, "#141418");
      px(ctx, 19, 19, 4, 4, "#141418");
      px(ctx, 25, 19, 4, 4, "#141418");
      // Rivet highlights
      if (variant % 2 === 0) {
        px(ctx, 7, 7, 2, 2, "#2a2a30");
        px(ctx, 23, 23, 2, 2, "#2a2a30");
      }
      if (variant === 1) {
        px(ctx, 14, 8, 3, 1, "#1c1c22"); // scuff mark
      }
    },

    wall: (ctx, variant) => {
      px(ctx, 0, 0, 32, 32, "#2a3040");
      // Horizontal panel seams
      px(ctx, 0, 0, 32, 1, "#1e2430");
      px(ctx, 0, 15, 32, 2, "#1e2430");
      px(ctx, 0, 31, 32, 1, "#1e2430");
      // Vertical panel seam
      const vx = variant % 2 === 0 ? 15 : 23;
      px(ctx, vx, 0, 2, 32, "#1e2430");
      // Panel highlight (top edge)
      px(ctx, 1, 1, 30, 1, "#344050");
      px(ctx, 1, 17, 30, 1, "#344050");
      // Rivets
      px(ctx, 3, 3, 2, 2, "#3a4858");
      px(ctx, 27, 3, 2, 2, "#3a4858");
      px(ctx, 3, 27, 2, 2, "#3a4858");
      px(ctx, 27, 27, 2, 2, "#3a4858");
      // Surface detail
      if (variant === 0 || variant === 2) {
        px(ctx, 8, 6, 6, 4, "#2e3848"); // vent
        px(ctx, 9, 7, 4, 2, "#1e2430");
      }
      if (variant === 1 || variant === 3) {
        // Warning stripe
        px(ctx, 2, 20, 4, 2, "#aa6622");
        px(ctx, 6, 20, 4, 2, "#2a3040");
        px(ctx, 10, 20, 4, 2, "#aa6622");
      }
    },

    stairs: (ctx) => {
      px(ctx, 0, 0, 32, 32, "#181820");
      // Elevator door frame
      px(ctx, 2, 2, 28, 28, "#3a4050");
      px(ctx, 4, 4, 24, 24, "#2a3040");
      // Door split
      px(ctx, 15, 4, 2, 24, "#1e2430");
      // Panel lines
      px(ctx, 4, 4, 11, 1, "#4a5060");
      px(ctx, 17, 4, 11, 1, "#4a5060");
      // Indicator light
      px(ctx, 13, 1, 6, 2, "#ff8844");
      px(ctx, 14, 0, 4, 1, "#ffaa66");
      // Door handle marks
      px(ctx, 12, 14, 2, 4, "#4a5060");
      px(ctx, 18, 14, 2, 4, "#4a5060");
    },

    player: (ctx) => {
      const c = "#00ccff", d = "#0099cc", dk = "#007799";
      // Helmet
      px(ctx, 10, 1, 12, 10, "#555566");
      px(ctx, 11, 0, 10, 1, "#555566");
      // Visor
      px(ctx, 12, 3, 8, 5, "#00ccff");
      px(ctx, 13, 4, 6, 3, "#00eeff");
      px(ctx, 14, 5, 2, 1, "#ffffff");
      // Suit body
      px(ctx, 9, 11, 14, 10, "#ddddee");
      px(ctx, 10, 11, 12, 1, "#eeeeff");
      // Chest panel
      px(ctx, 12, 13, 8, 4, "#aabbcc");
      px(ctx, 14, 14, 4, 2, c);
      // Arms
      px(ctx, 5, 12, 4, 8, "#ccccdd");
      px(ctx, 23, 12, 4, 8, "#ccccdd");
      // Gloves
      px(ctx, 5, 20, 4, 2, "#888899");
      px(ctx, 23, 20, 4, 2, "#888899");
      // Belt
      px(ctx, 9, 19, 14, 2, "#444455");
      px(ctx, 15, 19, 2, 2, c);
      // Legs
      px(ctx, 10, 21, 5, 7, "#ccccdd");
      px(ctx, 17, 21, 5, 7, "#ccccdd");
      // Boots
      px(ctx, 9, 27, 6, 3, "#555566");
      px(ctx, 17, 27, 6, 3, "#555566");
      px(ctx, 9, 29, 7, 1, "#333344");
      px(ctx, 17, 29, 7, 1, "#333344");
    },

    enemies: {
      "Maintenance Bot": (ctx) => {
        const c = "#8888aa", d = "#6666888", lt = "#aaaacc";
        // Boxy body
        px(ctx, 8, 8, 16, 16, c);
        px(ctx, 9, 7, 14, 1, c);
        px(ctx, 9, 24, 14, 1, c);
        // Face panel
        px(ctx, 10, 10, 12, 8, "#333344");
        // Eyes (LEDs)
        px(ctx, 12, 13, 3, 2, "#44ff44");
        px(ctx, 17, 13, 3, 2, "#44ff44");
        // Antenna
        px(ctx, 15, 2, 2, 6, "#666688");
        px(ctx, 14, 1, 4, 2, "#ff4444");
        // Arms (tool appendages)
        px(ctx, 4, 12, 4, 3, "#666688");
        px(ctx, 24, 12, 4, 3, "#666688");
        px(ctx, 3, 14, 2, 6, "#666688");
        px(ctx, 27, 14, 2, 6, "#666688");
        // Treads
        px(ctx, 8, 25, 6, 4, "#555566");
        px(ctx, 18, 25, 6, 4, "#555566");
        px(ctx, 8, 26, 6, 1, "#444455");
        px(ctx, 18, 26, 6, 1, "#444455");
        // Panel screws
        px(ctx, 10, 19, 2, 2, lt);
        px(ctx, 20, 19, 2, 2, lt);
      },
      "Security Drone": (ctx) => {
        const c = "#ff6644", d = "#cc4422";
        // Angular body
        px(ctx, 8, 10, 16, 12, "#555566");
        px(ctx, 6, 12, 20, 8, "#555566");
        // Central eye
        px(ctx, 13, 14, 6, 4, "#222233");
        px(ctx, 14, 15, 4, 2, c);
        px(ctx, 15, 15, 2, 1, "#ffaa88");
        // Wings/fins
        px(ctx, 2, 14, 5, 3, "#444455");
        px(ctx, 25, 14, 5, 3, "#444455");
        px(ctx, 1, 15, 2, 1, "#333344");
        px(ctx, 29, 15, 2, 1, "#333344");
        // Top sensor
        px(ctx, 14, 6, 4, 5, "#444455");
        px(ctx, 15, 5, 2, 2, c);
        // Bottom thrusters
        px(ctx, 10, 22, 4, 3, "#333344");
        px(ctx, 18, 22, 4, 3, "#333344");
        px(ctx, 11, 24, 2, 2, "#4488ff");
        px(ctx, 19, 24, 2, 2, "#4488ff");
        // Warning stripes
        px(ctx, 8, 10, 16, 1, c);
        px(ctx, 8, 21, 16, 1, c);
      },
      Xenomorph: (ctx) => {
        const c = "#44ff44", d = "#22cc22", dk = "#119911";
        // Elongated head
        px(ctx, 18, 2, 10, 6, dk);
        px(ctx, 20, 1, 6, 1, dk);
        px(ctx, 16, 5, 4, 4, dk);
        // Jaw
        px(ctx, 16, 8, 8, 2, dk);
        px(ctx, 15, 9, 2, 2, dk);
        // Teeth
        px(ctx, 17, 9, 1, 1, "#ffffff");
        px(ctx, 19, 9, 1, 1, "#ffffff");
        px(ctx, 21, 9, 1, 1, "#ffffff");
        // Eye
        px(ctx, 19, 4, 2, 2, c);
        // Body
        px(ctx, 10, 10, 12, 10, dk);
        px(ctx, 12, 9, 8, 2, dk);
        // Ribs
        px(ctx, 11, 12, 10, 1, d);
        px(ctx, 11, 15, 10, 1, d);
        px(ctx, 11, 18, 10, 1, d);
        // Arms (claws)
        px(ctx, 6, 11, 4, 6, dk);
        px(ctx, 4, 16, 3, 2, dk);
        px(ctx, 22, 11, 4, 6, dk);
        px(ctx, 25, 16, 3, 2, dk);
        // Claws
        px(ctx, 3, 17, 2, 1, c);
        px(ctx, 26, 17, 2, 1, c);
        // Legs
        px(ctx, 10, 20, 4, 7, dk);
        px(ctx, 18, 20, 4, 7, dk);
        // Tail
        px(ctx, 8, 19, 3, 2, dk);
        px(ctx, 5, 20, 4, 2, dk);
        px(ctx, 2, 21, 4, 2, dk);
        px(ctx, 0, 22, 3, 1, dk);
        px(ctx, 0, 21, 1, 1, c);
        // Feet
        px(ctx, 9, 27, 5, 2, dk);
        px(ctx, 18, 27, 5, 2, dk);
      },
    },

    items: {
      potion: (ctx, color) => {
        // Med-kit box
        px(ctx, 6, 6, 20, 20, "#dddddd");
        px(ctx, 7, 5, 18, 1, "#eeeeee");
        px(ctx, 7, 26, 18, 1, "#aaaaaa");
        // Red cross
        px(ctx, 14, 9, 4, 14, color);
        px(ctx, 10, 13, 12, 6, color);
        // Handle
        px(ctx, 11, 3, 10, 3, "#888888");
        px(ctx, 12, 2, 8, 1, "#999999");
        // Clasp
        px(ctx, 15, 26, 2, 2, "#888888");
      },
      scroll: (ctx, color) => {
        // Data pad
        px(ctx, 6, 3, 20, 26, "#333344");
        px(ctx, 7, 2, 18, 1, "#444455");
        px(ctx, 8, 5, 16, 18, "#1a1a2e");
        // Screen content
        px(ctx, 10, 7, 12, 1, color);
        px(ctx, 10, 10, 10, 1, "#4a5060");
        px(ctx, 10, 13, 12, 1, "#4a5060");
        px(ctx, 10, 16, 8, 1, "#4a5060");
        px(ctx, 10, 19, 11, 1, "#4a5060");
        // Power indicator
        px(ctx, 22, 25, 2, 2, "#44ff44");
        // Border highlight
        px(ctx, 6, 3, 1, 26, "#444455");
        px(ctx, 25, 3, 1, 26, "#222233");
      },
      weapon: (ctx, color) => {
        // Barrel
        px(ctx, 14, 0, 4, 14, "#666677");
        px(ctx, 13, 2, 1, 10, "#777788");
        px(ctx, 18, 2, 1, 10, "#555566");
        // Muzzle
        px(ctx, 13, 0, 6, 2, "#555566");
        px(ctx, 15, 0, 2, 1, color);
        // Body
        px(ctx, 10, 14, 12, 8, "#444455");
        px(ctx, 11, 13, 10, 1, "#555566");
        // Grip
        px(ctx, 12, 22, 8, 8, "#333344");
        px(ctx, 13, 24, 6, 1, "#2a2a3a");
        px(ctx, 13, 27, 6, 1, "#2a2a3a");
        // Trigger guard
        px(ctx, 10, 20, 2, 6, "#444455");
        // Energy cell glow
        px(ctx, 14, 15, 4, 4, color);
        px(ctx, 15, 16, 2, 2, lighten(color));
        // Scope
        px(ctx, 19, 10, 4, 4, "#555566");
        px(ctx, 20, 11, 2, 2, "#00ccff");
      },
      armor: (ctx, color) => {
        // Chest piece
        px(ctx, 7, 6, 18, 16, color);
        px(ctx, 8, 5, 16, 1, lighten(color));
        // Shoulder pads
        px(ctx, 3, 6, 5, 5, color);
        px(ctx, 24, 6, 5, 5, color);
        px(ctx, 3, 6, 5, 1, lighten(color));
        px(ctx, 24, 6, 5, 1, lighten(color));
        // Neck
        px(ctx, 12, 2, 8, 5, color);
        px(ctx, 14, 3, 4, 3, "#181820");
        // Tech panel
        px(ctx, 12, 10, 8, 6, "#333344");
        px(ctx, 13, 11, 6, 4, "#1a1a2e");
        px(ctx, 14, 12, 4, 2, "#00ccff");
        // Side panels
        px(ctx, 7, 6, 2, 16, darken(color));
        px(ctx, 23, 6, 2, 16, darken(color));
        // Belt
        px(ctx, 8, 20, 16, 2, "#444455");
        // Skirt
        px(ctx, 9, 22, 14, 6, color);
        px(ctx, 15, 23, 2, 5, darken(color));
      },
      ring: (ctx, color) => {
        // Cybernetic implant - circular with tech detail
        px(ctx, 9, 10, 14, 14, "#555566");
        px(ctx, 11, 8, 10, 2, "#555566");
        px(ctx, 11, 24, 10, 2, "#555566");
        // Inner cavity
        px(ctx, 12, 12, 8, 8, "#222233");
        px(ctx, 13, 11, 6, 1, "#222233");
        px(ctx, 13, 20, 6, 1, "#222233");
        // Circuit traces
        px(ctx, 9, 10, 2, 14, "#444455");
        px(ctx, 21, 10, 2, 14, "#666677");
        // Central gem/core
        px(ctx, 13, 5, 6, 5, "#333344");
        px(ctx, 14, 4, 4, 1, "#444455");
        px(ctx, 14, 6, 4, 3, color);
        px(ctx, 15, 7, 2, 1, lighten(color));
        // Power indicators
        px(ctx, 10, 16, 2, 1, color);
        px(ctx, 20, 16, 2, 1, color);
      },
    },
  },
};
