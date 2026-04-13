export class DPad {
  private container: HTMLDivElement;
  private onMove: ((dx: number, dy: number) => void) | null = null;
  private repeatTimer: ReturnType<typeof setTimeout> | null = null;
  private repeatInterval: ReturnType<typeof setInterval> | null = null;
  private activeDir: [number, number] | null = null;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "dpad";

    // 3x3 grid: 8 directions + center (wait)
    const dirs: { dx: number; dy: number; label: string; cls: string }[] = [
      { dx: -1, dy: -1, label: "\u2196", cls: "nw" },
      { dx: 0,  dy: -1, label: "\u2191", cls: "n" },
      { dx: 1,  dy: -1, label: "\u2197", cls: "ne" },
      { dx: -1, dy: 0,  label: "\u2190", cls: "w" },
      { dx: 0,  dy: 0,  label: "\u00b7", cls: "center" },
      { dx: 1,  dy: 0,  label: "\u2192", cls: "e" },
      { dx: -1, dy: 1,  label: "\u2199", cls: "sw" },
      { dx: 0,  dy: 1,  label: "\u2193", cls: "s" },
      { dx: 1,  dy: 1,  label: "\u2198", cls: "se" },
    ];

    for (const dir of dirs) {
      const btn = document.createElement("button");
      btn.className = `dpad-btn dpad-${dir.cls}`;
      btn.textContent = dir.label;
      btn.setAttribute("data-dx", String(dir.dx));
      btn.setAttribute("data-dy", String(dir.dy));

      // Tap fires immediately
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.fireMove(dir.dx, dir.dy);
        this.activeDir = [dir.dx, dir.dy];
        // Start repeat after 300ms hold, then every 120ms
        this.clearRepeat();
        this.repeatTimer = setTimeout(() => {
          this.repeatInterval = setInterval(() => {
            if (this.activeDir) {
              this.fireMove(this.activeDir[0], this.activeDir[1]);
            }
          }, 120);
        }, 300);
      });

      btn.addEventListener("pointerup", () => this.stopRepeat());
      btn.addEventListener("pointercancel", () => this.stopRepeat());
      btn.addEventListener("pointerleave", () => this.stopRepeat());
      btn.addEventListener("contextmenu", (e) => e.preventDefault());

      this.container.appendChild(btn);
    }

    const style = document.createElement("style");
    style.textContent = `
      #dpad {
        position: fixed;
        bottom: calc(110px + env(safe-area-inset-bottom, 0px));
        left: 12px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2px;
        z-index: 150;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }
      .dpad-btn {
        width: 48px;
        height: 48px;
        background: rgba(30, 30, 50, 0.8);
        border: 1px solid rgba(80, 80, 120, 0.5);
        border-radius: 6px;
        color: #aaa;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      .dpad-btn:active, .dpad-btn.active {
        background: rgba(60, 60, 100, 0.9);
        color: #fff;
        border-color: rgba(120, 120, 180, 0.7);
      }
      .dpad-center {
        background: rgba(20, 20, 40, 0.6);
        font-size: 14px;
        color: #666;
      }
      .dpad-n, .dpad-s, .dpad-e, .dpad-w {
        font-size: 22px;
        color: #ccc;
      }
      @media (hover: hover) and (pointer: fine) {
        #dpad { display: none; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.container);
  }

  setMoveCallback(cb: (dx: number, dy: number) => void) {
    this.onMove = cb;
  }

  private fireMove(dx: number, dy: number) {
    if (this.onMove) this.onMove(dx, dy);
  }

  private stopRepeat() {
    this.activeDir = null;
    this.clearRepeat();
  }

  private clearRepeat() {
    if (this.repeatTimer) { clearTimeout(this.repeatTimer); this.repeatTimer = null; }
    if (this.repeatInterval) { clearInterval(this.repeatInterval); this.repeatInterval = null; }
  }

  destroy() {
    this.clearRepeat();
    this.container.remove();
  }
}
