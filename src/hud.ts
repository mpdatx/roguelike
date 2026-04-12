import type { Entity, Enemy } from "./entities";
import type { ActiveBuff, EffectiveStats } from "./items";

const MAX_MESSAGES = 50;
const VISIBLE_MESSAGES = 4;
const MINIMAP_SCALE = 2;

export class HUD {
  private container: HTMLDivElement;
  private hpFill: HTMLDivElement;
  private hpText: HTMLSpanElement;
  private statsText: HTMLSpanElement;
  private buffsContainer: HTMLDivElement;
  private messageLog: HTMLDivElement;
  private messages: string[] = [];
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private invButton: HTMLButtonElement;
  private toggleBtn: HTMLButtonElement;

  constructor(
    private mapWidth: number,
    private mapHeight: number,
  ) {
    this.container = document.createElement("div");
    this.container.id = "hud";
    this.container.innerHTML = `
      <div class="hud-row hud-top-row">
        <div class="hud-left">
          <div class="hud-hp">
            <div class="hud-hp-bar"><div class="hud-hp-fill"></div></div>
            <span class="hud-hp-text"></span>
          </div>
          <div class="hud-stats-row">
            <span class="hud-stats-text"></span>
            <span class="hud-buffs"></span>
          </div>
        </div>
        <div class="hud-right">
          <button class="hud-toggle-btn" title="Toggle view (t)">&#x1F3A8;</button>
          <button class="hud-inv-btn" title="Inventory (i)">&#x1F392;</button>
          <canvas class="hud-minimap"></canvas>
        </div>
      </div>
      <div class="hud-messages"></div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #hud {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        pointer-events: none;
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px;
        background: linear-gradient(transparent, rgba(10, 10, 30, 0.85) 30%);
        font-family: monospace;
        color: #ccc;
      }
      .hud-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .hud-top-row {
        justify-content: space-between;
      }
      .hud-left {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }
      .hud-right {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .hud-hp {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hud-hp-bar {
        flex: 1;
        max-width: 200px;
        height: 14px;
        background: #2a2a4a;
        border-radius: 3px;
        overflow: hidden;
      }
      .hud-hp-fill {
        height: 100%;
        background: #00ff88;
        transition: width 0.2s ease;
      }
      .hud-hp-text {
        font-size: 12px;
        white-space: nowrap;
      }
      .hud-stats-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .hud-stats-text {
        font-size: 11px;
        color: #888;
      }
      .hud-buffs {
        display: flex;
        gap: 4px;
      }
      .hud-buff {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 3px;
        background: #2a2a4a;
      }
      .hud-buff.strength { color: #ff8844; border: 1px solid #ff8844; }
      .hud-buff.speed { color: #44ffff; border: 1px solid #44ffff; }
      .hud-toggle-btn,
      .hud-inv-btn {
        pointer-events: auto;
        background: #2a2a4a;
        border: 1px solid #3a3a5c;
        color: #ccc;
        font-size: 18px;
        width: 36px;
        height: 36px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
      }
      .hud-toggle-btn:active,
      .hud-inv-btn:active { background: #3a3a5c; }
      .hud-minimap {
        border: 1px solid #3a3a5c;
        border-radius: 3px;
        image-rendering: pixelated;
        flex-shrink: 0;
      }
      .hud-messages {
        font-size: 11px;
        line-height: 1.4;
        max-height: ${VISIBLE_MESSAGES * 1.4}em;
        overflow: hidden;
      }
      .hud-messages .msg { opacity: 0.9; }
      .hud-messages .msg:not(:last-child) { opacity: 0.5; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.container);

    this.hpFill = this.container.querySelector(".hud-hp-fill")!;
    this.hpText = this.container.querySelector(".hud-hp-text")!;
    this.statsText = this.container.querySelector(".hud-stats-text")!;
    this.buffsContainer = this.container.querySelector(".hud-buffs")!;
    this.messageLog = this.container.querySelector(".hud-messages")!;
    this.invButton = this.container.querySelector(".hud-inv-btn")!;
    this.toggleBtn = this.container.querySelector(".hud-toggle-btn")!;
    this.minimapCanvas = this.container.querySelector(".hud-minimap")!;
    this.minimapCanvas.width = mapWidth * MINIMAP_SCALE;
    this.minimapCanvas.height = mapHeight * MINIMAP_SCALE;
    this.minimapCtx = this.minimapCanvas.getContext("2d")!;
  }

  setInventoryCallback(cb: () => void) {
    this.invButton.addEventListener("click", cb);
  }

  setToggleRendererCallback(cb: () => void) {
    this.toggleBtn.addEventListener("click", cb);
  }

  updateHP(player: Entity, effectiveMaxHp: number) {
    const pct = Math.max(0, player.hp / effectiveMaxHp) * 100;
    this.hpFill.style.width = `${pct}%`;

    if (pct > 50) {
      this.hpFill.style.background = "#00ff88";
    } else if (pct > 25) {
      this.hpFill.style.background = "#ffaa00";
    } else {
      this.hpFill.style.background = "#ff4444";
    }

    this.hpText.textContent = `HP ${player.hp}/${effectiveMaxHp}`;
  }

  updateStats(stats: EffectiveStats, depth?: number) {
    let text = `ATK ${stats.attack}  DEF ${stats.defense}`;
    if (depth !== undefined) text += `  LVL ${depth}`;
    this.statsText.textContent = text;
  }

  updateBuffs(buffs: ActiveBuff[]) {
    this.buffsContainer.innerHTML = buffs.map((b) => {
      const label = b.type === "strength" ? `STR+${b.amount}` : `SPD`;
      return `<span class="hud-buff ${b.type}">${label} ${b.turnsRemaining}t</span>`;
    }).join("");
  }

  addMessage(msg: string) {
    this.messages.push(msg);
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this.renderMessages();
  }

  clearMessages() {
    this.messages = [];
    this.renderMessages();
  }

  private renderMessages() {
    const visible = this.messages.slice(-VISIBLE_MESSAGES);
    this.messageLog.innerHTML = visible
      .map((m) => `<div class="msg">${m}</div>`)
      .join("");
  }

  updateMinimap(
    map: Map<string, number>,
    explored: Set<string>,
    fov: Set<string>,
    player: Entity,
    enemies: Enemy[],
    stairs?: { x: number; y: number } | null,
  ) {
    const ctx = this.minimapCtx;
    const s = MINIMAP_SCALE;
    ctx.fillStyle = "#0a0a1e";
    ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const key = `${x},${y}`;
        const tile = map.get(key);
        if (!explored.has(key)) continue;

        if (fov.has(key)) {
          ctx.fillStyle = tile === 0 ? "#3a3a5c" : "#1a1a2e";
        } else {
          ctx.fillStyle = tile === 0 ? "#2a2a4a" : "#0a0a1e";
        }
        ctx.fillRect(x * s, y * s, s, s);
      }
    }

    for (const enemy of enemies) {
      if (fov.has(`${enemy.x},${enemy.y}`)) {
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(enemy.x * s, enemy.y * s, s, s);
      }
    }

    // Stairs
    if (stairs && (fov.has(`${stairs.x},${stairs.y}`) || explored.has(`${stairs.x},${stairs.y}`))) {
      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(stairs.x * s, stairs.y * s, s, s);
    }

    ctx.fillStyle = "#00ff88";
    ctx.fillRect(player.x * s, player.y * s, s, s);
  }

  destroy() {
    this.container.remove();
  }
}
