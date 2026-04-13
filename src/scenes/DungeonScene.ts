import * as Phaser from "phaser";
import * as ROT from "rot-js";
import { type Entity, type Enemy, createPlayer, spawnEnemies, spawnBoss, findFloorTile } from "../entities";
import { type GroundItem, spawnItems, pickItem, getEffectiveStats } from "../items";
import { Inventory } from "../inventory";
import { TurnEngine } from "../turnEngine";
import { HUD } from "../hud";
import { InventoryPanel } from "../inventoryPanel";
import { AsciiRenderer, type GameRenderer } from "../renderer";
import { TilesetRenderer } from "../tilesetRenderer";
import { getTheme, setTheme, getThemeList } from "../themes";
import { DPad } from "../dpad";

interface Stairs {
  x: number;
  y: number;
}

export class DungeonScene extends Phaser.Scene {
  private map: Map<string, number> = new Map();
  private mapWidth = 60;
  private mapHeight = 40;
  private player!: Entity;
  private enemies: Enemy[] = [];
  private groundItems: GroundItem[] = [];
  private inventory!: Inventory;
  private stairs: Stairs | null = null;
  private depth = 1;
  private fov: Set<string> = new Set();
  private fovDistances: Map<string, number> = new Map();
  private explored: Set<string> = new Set();
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private turnEngine!: TurnEngine;
  private gameOver = false;
  private gameOverText!: Phaser.GameObjects.Text;
  private rng!: typeof ROT.RNG;
  private hud!: HUD;
  private inventoryPanel!: InventoryPanel;
  private dpad!: DPad;
  private asciiRenderer!: AsciiRenderer;
  private tilesetRenderer!: TilesetRenderer;
  private activeRenderer!: GameRenderer;
  private useTileset = false;
  private mapImage!: Phaser.GameObjects.Image;
  private mapTextureKey = "mapTexture";

  constructor() {
    super("DungeonScene");
  }

  create() {
    this.asciiRenderer = new AsciiRenderer(this.mapWidth, this.mapHeight);
    this.tilesetRenderer = new TilesetRenderer(this.mapWidth, this.mapHeight);
    this.activeRenderer = this.asciiRenderer;

    this.textures.addCanvas(this.mapTextureKey, this.activeRenderer.getCanvas());
    this.mapImage = this.add.image(0, 0, this.mapTextureKey).setOrigin(0, 0);

    this.gameOverText = this.add.text(0, 0, "", {
      fontSize: "32px",
      color: "#ff4444",
      fontFamily: "monospace",
      align: "center",
    }).setScrollFactor(0).setDepth(10).setVisible(false);

    this.rng = ROT.RNG.clone();
    this.camera = this.cameras.main;
    this.inventory = new Inventory();
    this.hud = new HUD(this.mapWidth, this.mapHeight);
    this.dpad = new DPad();
    this.dpad.setMoveCallback((dx, dy) => {
      if (this.inventoryPanel.isOpen()) return;
      if (this.gameOver) { this.restartGame(); return; }
      if (!this.turnEngine.isWaitingForInput()) return;
      this.turnEngine.submitPlayerMove(dx, dy);
    });
    this.startNewGame();

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.inventoryPanel.isOpen()) return;
      if (this.gameOver) {
        this.restartGame();
        return;
      }
      this.handleTap(pointer);
    });

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (this.inventoryPanel.isOpen()) return;
      if (this.gameOver) {
        this.restartGame();
        return;
      }
      this.handleKey(event.key);
    });

    this.scale.on("resize", () => {
      this.renderAll();
      this.centerCameraOnPlayer();
      this.positionGameOverText();
    });
  }

  private startNewGame() {
    this.gameOver = false;
    this.gameOverText.setVisible(false);
    this.depth = 1;
    this.inventory.reset();
    this.hud.clearMessages();
    this.hud.addMessage(getTheme().text.descend);

    this.generateLevel(true);
    this.startLevel();
  }

  private descend() {
    this.turnEngine.stop();
    this.depth++;
    this.hud.addMessage(getTheme().text.descendLevel(this.depth));
    this.generateLevel(false);
    this.startLevel();
  }

  private generateLevel(newPlayer: boolean) {
    this.map.clear();
    this.fov.clear();
    this.fovDistances.clear();
    this.explored.clear();

    // Scale map parameters with depth
    const depthScale = Math.min(this.depth - 1, 10);
    const roomWidthMin = 4;
    const roomWidthMax = Math.min(9 + Math.floor(depthScale / 3), 12);
    const roomHeightMin = 3;
    const roomHeightMax = Math.min(6 + Math.floor(depthScale / 4), 9);
    const corridorMax = Math.min(6 + Math.floor(depthScale / 2), 10);

    const digger = new ROT.Map.Digger(this.mapWidth, this.mapHeight, {
      roomWidth: [roomWidthMin, roomWidthMax],
      roomHeight: [roomHeightMin, roomHeightMax],
      corridorLength: [2, corridorMax],
    });

    digger.create((x, y, value) => {
      this.map.set(`${x},${y}`, value);
    });

    const rooms = digger.getRooms();
    if (rooms.length === 0) return;

    // --- Assign special room roles ---
    const playerRoomIdx = 0;
    const stairsRoomIdx = rooms.length > 1 ? rooms.length - 1 : 0;

    // Pick a treasure room (not player start, not stairs) every level
    let treasureRoomIdx = -1;
    if (rooms.length > 3) {
      const candidates = [];
      for (let i = 1; i < rooms.length - 1; i++) candidates.push(i);
      treasureRoomIdx = this.rng.getItem(candidates)!;
    }

    // Boss room every 5 levels (not player start, not stairs, not treasure)
    let bossRoomIdx = -1;
    if (this.depth % 5 === 0 && rooms.length > 4) {
      const candidates = [];
      for (let i = 1; i < rooms.length - 1; i++) {
        if (i !== treasureRoomIdx) candidates.push(i);
      }
      if (candidates.length > 0) bossRoomIdx = this.rng.getItem(candidates)!;
    }

    // --- Place player ---
    const startRoom = rooms[playerRoomIdx];
    const px = Math.floor((startRoom.getLeft() + startRoom.getRight()) / 2);
    const py = Math.floor((startRoom.getTop() + startRoom.getBottom()) / 2);
    if (newPlayer) {
      this.player = createPlayer(px, py);
    } else {
      this.player.x = px;
      this.player.y = py;
    }

    // --- Place stairs ---
    if (rooms.length > 1) {
      const lastRoom = rooms[stairsRoomIdx];
      this.stairs = {
        x: Math.floor((lastRoom.getLeft() + lastRoom.getRight()) / 2),
        y: Math.floor((lastRoom.getTop() + lastRoom.getBottom()) / 2),
      };
    } else {
      this.stairs = null;
    }

    // --- Spawn enemies ---
    const enemySkip = new Set([playerRoomIdx]);
    // Boss room and treasure room get custom enemy counts
    const enemyOverrides = new Map<number, number>();
    if (treasureRoomIdx >= 0) enemyOverrides.set(treasureRoomIdx, 0); // no enemies in treasure room
    if (bossRoomIdx >= 0) enemyOverrides.set(bossRoomIdx, 0); // boss spawned separately

    this.enemies = spawnEnemies(rooms, this.map, this.rng, this.depth, enemySkip, enemyOverrides);

    // Spawn boss
    if (bossRoomIdx >= 0) {
      const boss = spawnBoss(rooms[bossRoomIdx], this.map, this.rng, this.depth);
      this.enemies.push(boss);
    }

    // --- Spawn items ---
    const itemSkip = new Set<number>();
    if (bossRoomIdx >= 0) itemSkip.add(bossRoomIdx); // boss room: no random loot
    const itemOverrides = new Map<number, number>();
    if (treasureRoomIdx >= 0) {
      // Treasure room: 3-5 items, all depth-scaled
      itemOverrides.set(treasureRoomIdx, this.rng.getUniformInt(3, 5));
    }

    this.groundItems = spawnItems(rooms, this.map, this.enemies, this.rng, this.depth, itemSkip, itemOverrides);

    // Boss room drops: 1-2 guaranteed good items near the boss
    if (bossRoomIdx >= 0) {
      const bossRoom = rooms[bossRoomIdx];
      const bossDrops = this.rng.getUniformInt(1, 2);
      const occupied = new Set(this.enemies.map((e) => `${e.x},${e.y}`));
      for (let i = 0; i < bossDrops; i++) {
        const pos = findFloorTile(bossRoom, this.map, occupied, this.rng);
        if (pos) {
          // Force rare item (pick from weight <= 2 items)
          const rareItem = pickItem(this.rng, this.depth + 5);
          this.groundItems.push({ templateId: rareItem.id, x: pos.x, y: pos.y });
          occupied.add(`${pos.x},${pos.y}`);
        }
      }
    }
  }

  private startLevel() {
    this.computeFOV();
    this.renderAll();
    this.updateHUD();
    this.centerCameraOnPlayer();

    if (this.inventoryPanel) this.inventoryPanel.destroy();
    this.inventoryPanel = new InventoryPanel(
      this.inventory,
      () => this.player,
      () => this.enemies,
      () => this.fov,
      () => this.explored,
      () => this.map,
      () => this.groundItems,
      (msg) => this.hud.addMessage(msg),
      () => { this.computeFOV(); this.renderAll(); this.updateHUD(); },
      () => this.rng,
    );
    this.hud.setInventoryCallback(() => this.inventoryPanel.open());
    this.hud.setToggleRendererCallback(() => this.toggleRenderer());
    this.hud.setThemeCallback(() => this.cycleTheme());

    this.turnEngine = new TurnEngine(
      this.player,
      this.enemies,
      this.map,
      this.rng,
      this.inventory,
      this.groundItems,
      () => {
        this.checkStairs();
        this.computeFOV();
        this.renderAll();
        this.updateHUD();
        this.centerCameraOnPlayer();
      },
      () => {},
      () => this.showGameOver(),
      (msg) => this.hud.addMessage(msg),
    );
    this.turnEngine.run();
  }

  private checkStairs() {
    if (this.stairs && this.player.x === this.stairs.x && this.player.y === this.stairs.y) {
      this.descend();
    }
  }

  private restartGame() {
    this.turnEngine.stop();
    this.startNewGame();
  }

  private computeFOV() {
    this.fov.clear();
    this.fovDistances.clear();
    const stats = getEffectiveStats(this.player, this.inventory.equipment, this.inventory.buffs);
    const fov = new ROT.FOV.PreciseShadowcasting((x, y) => {
      return this.map.get(`${x},${y}`) === 0;
    });

    fov.compute(this.player.x, this.player.y, stats.fovRange, (x, y, r, visible) => {
      if (visible) {
        const key = `${x},${y}`;
        this.fov.add(key);
        this.fovDistances.set(key, r);
        this.explored.add(key);
      }
    });
  }

  private toggleRenderer() {
    this.useTileset = !this.useTileset;
    this.activeRenderer = this.useTileset ? this.tilesetRenderer : this.asciiRenderer;
    // Swap the canvas source in Phaser
    this.textures.remove(this.mapTextureKey);
    this.textures.addCanvas(this.mapTextureKey, this.activeRenderer.getCanvas());
    this.mapImage.setTexture(this.mapTextureKey);
    this.renderAll();
    this.centerCameraOnPlayer();
  }

  private cycleTheme() {
    const themes = getThemeList();
    const currentId = getTheme().id;
    const idx = themes.findIndex((t) => t.id === currentId);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next.id);
    this.turnEngine.stop();
    this.startNewGame();
  }

  private renderAll() {
    this.activeRenderer.render({
      map: this.map,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      fov: this.fov,
      fovDistances: this.fovDistances,
      explored: this.explored,
      player: this.player,
      enemies: this.enemies,
      groundItems: this.groundItems,
      stairs: this.stairs,
    });

    // Refresh the Phaser texture from the updated offscreen canvas
    const tex = this.textures.get(this.mapTextureKey);
    if (tex instanceof Phaser.Textures.CanvasTexture) {
      tex.refresh();
    }
  }

  private updateHUD() {
    const stats = getEffectiveStats(this.player, this.inventory.equipment, this.inventory.buffs);
    this.hud.updateHP(this.player, stats.maxHp);
    this.hud.updateStats(stats, this.depth);
    this.hud.updateBuffs(this.inventory.buffs);
    this.hud.updateMinimap(this.map, this.explored, this.fov, this.player, this.enemies, this.stairs);
  }

  private centerCameraOnPlayer() {
    const ts = this.activeRenderer.getTileSize();
    this.camera.scrollX = this.player.x * ts - this.scale.width / 2;
    this.camera.scrollY = this.player.y * ts - this.scale.height / 2;
  }

  private handleTap(pointer: Phaser.Input.Pointer) {
    if (!this.turnEngine.isWaitingForInput()) return;

    const ts = this.activeRenderer.getTileSize();
    const tileX = Math.floor(pointer.worldX / ts);
    const tileY = Math.floor(pointer.worldY / ts);
    const dx = tileX - this.player.x;
    const dy = tileY - this.player.y;

    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
      this.turnEngine.submitPlayerMove(Math.sign(dx), Math.sign(dy));
      return;
    }

    const astar = new ROT.Path.AStar(tileX, tileY, (x, y) => {
      if (this.map.get(`${x},${y}`) !== 0) return false;
      if (this.enemies.some((e) => e.x === x && e.y === y)) return false;
      return true;
    }, { topology: 8 });

    const path: { x: number; y: number }[] = [];
    astar.compute(this.player.x, this.player.y, (x, y) => path.push({ x, y }));

    if (path.length > 1) {
      this.turnEngine.submitPlayerMove(
        path[1].x - this.player.x,
        path[1].y - this.player.y,
      );
    }
  }

  private handleKey(key: string) {
    if (!this.turnEngine.isWaitingForInput()) return;

    if (key === "i") {
      this.inventoryPanel.open();
      return;
    }
    if (key === "t") {
      this.toggleRenderer();
      return;
    }

    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      s: [0, 1],
      a: [-1, 0],
      d: [1, 0],
      h: [-1, 0],
      j: [0, 1],
      k: [0, -1],
      l: [1, 0],
      y: [-1, -1],
      u: [1, -1],
      b: [-1, 1],
      n: [1, 1],
      ".": [0, 0],
    };

    const move = moves[key];
    if (move) {
      this.turnEngine.submitPlayerMove(move[0], move[1]);
    }
  }

  private showGameOver() {
    this.gameOver = true;
    this.gameOverText.setText(getTheme().text.gameOver(this.depth));
    this.gameOverText.setVisible(true);
    this.positionGameOverText();
  }

  private positionGameOverText() {
    this.gameOverText.setPosition(
      this.scale.width / 2 - this.gameOverText.width / 2,
      this.scale.height / 2 - this.gameOverText.height / 2,
    );
  }
}
