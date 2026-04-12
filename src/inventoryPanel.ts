import type { Entity, Enemy } from "./entities";
import type { GroundItem } from "./items";
import { getTemplate, getSlotForCategory, type EquipSlot } from "./items";
import type { Inventory } from "./inventory";

export class InventoryPanel {
  private overlay: HTMLDivElement;
  private panel: HTMLDivElement;
  private content: HTMLDivElement;
  private visible = false;

  constructor(
    private inventory: Inventory,
    private getPlayer: () => Entity,
    private getEnemies: () => Enemy[],
    private getFov: () => Set<string>,
    private getExplored: () => Set<string>,
    private getMap: () => Map<string, number>,
    private getGroundItems: () => GroundItem[],
    private onMessage: (msg: string) => void,
    private onChanged: () => void,
    private getRng: () => { getUniform: () => number },
  ) {
    this.overlay = document.createElement("div");
    this.overlay.className = "inv-overlay";
    this.overlay.addEventListener("pointerdown", (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.panel = document.createElement("div");
    this.panel.className = "inv-panel";

    const header = document.createElement("div");
    header.className = "inv-header";
    header.innerHTML = `<span>Inventory</span><button class="inv-close">&times;</button>`;
    header.querySelector(".inv-close")!.addEventListener("click", () => this.close());

    this.content = document.createElement("div");
    this.content.className = "inv-content";

    this.panel.appendChild(header);
    this.panel.appendChild(this.content);
    this.overlay.appendChild(this.panel);

    const style = document.createElement("style");
    style.textContent = `
      .inv-overlay {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 200;
        background: rgba(0,0,0,0.5);
        justify-content: center;
        align-items: flex-end;
      }
      .inv-overlay.open {
        display: flex;
      }
      .inv-panel {
        width: 100%;
        max-width: 420px;
        max-height: 70vh;
        background: #1a1a2e;
        border-top: 2px solid #3a3a5c;
        border-radius: 12px 12px 0 0;
        display: flex;
        flex-direction: column;
        font-family: monospace;
        color: #ccc;
        transform: translateY(100%);
        transition: transform 0.2s ease;
        pointer-events: auto;
      }
      .inv-overlay.open .inv-panel {
        transform: translateY(0);
      }
      .inv-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #2a2a4a;
        font-size: 16px;
        font-weight: bold;
      }
      .inv-close {
        background: none;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
      }
      .inv-content {
        overflow-y: auto;
        padding: 8px 0;
        flex: 1;
      }
      .inv-section-title {
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
        padding: 8px 16px 4px;
        letter-spacing: 1px;
      }
      .inv-equip-slot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        border-bottom: 1px solid #1f1f35;
        cursor: pointer;
        min-height: 44px;
      }
      .inv-equip-slot:active { background: #2a2a4a; }
      .inv-equip-slot .slot-label { color: #888; font-size: 12px; }
      .inv-equip-slot .slot-item { font-size: 13px; }
      .inv-equip-slot .slot-empty { color: #555; font-style: italic; font-size: 13px; }
      .inv-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        border-bottom: 1px solid #1f1f35;
        cursor: pointer;
        min-height: 44px;
      }
      .inv-item-row:active { background: #2a2a4a; }
      .inv-item-info { flex: 1; min-width: 0; }
      .inv-item-name { font-size: 13px; }
      .inv-item-desc { font-size: 11px; color: #888; }
      .inv-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .inv-actions button {
        background: #2a2a4a;
        border: 1px solid #3a3a5c;
        color: #ccc;
        font-family: monospace;
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 3px;
        cursor: pointer;
        min-height: 32px;
      }
      .inv-actions button:active { background: #3a3a5c; }
      .inv-footer {
        padding: 8px 16px;
        font-size: 11px;
        color: #888;
        text-align: center;
        border-top: 1px solid #2a2a4a;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.overlay);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.visible) this.close();
      if (e.key === "i" && !this.visible) this.open();
    });
  }

  open() {
    this.visible = true;
    this.render();
    this.overlay.classList.add("open");
  }

  close() {
    this.visible = false;
    this.overlay.classList.remove("open");
  }

  isOpen(): boolean {
    return this.visible;
  }

  private render() {
    const inv = this.inventory;
    let html = "";

    // Equipment section
    html += `<div class="inv-section-title">Equipment</div>`;
    const slots: { slot: EquipSlot; label: string }[] = [
      { slot: "weapon", label: "Weapon" },
      { slot: "armor", label: "Armor" },
      { slot: "ring", label: "Ring" },
    ];
    for (const { slot, label } of slots) {
      const equipped = inv.equipment[slot];
      if (equipped) {
        const t = getTemplate(equipped.templateId);
        const color = `#${t.color.toString(16).padStart(6, "0")}`;
        html += `<div class="inv-equip-slot" data-unequip="${slot}">
          <div><span class="slot-label">${label}:</span> <span class="slot-item" style="color:${color}">${t.name}</span> <span style="color:#888;font-size:11px">${t.description}</span></div>
          <div class="inv-actions"><button data-unequip="${slot}">Unequip</button></div>
        </div>`;
      } else {
        html += `<div class="inv-equip-slot">
          <div><span class="slot-label">${label}:</span> <span class="slot-empty">Empty</span></div>
        </div>`;
      }
    }

    // Active buffs
    if (inv.buffs.length > 0) {
      html += `<div class="inv-section-title">Active Effects</div>`;
      for (const buff of inv.buffs) {
        const label = buff.type === "strength" ? "Strength" : "Speed";
        html += `<div class="inv-item-row"><div class="inv-item-info">
          <div class="inv-item-name">${label} +${buff.amount}</div>
          <div class="inv-item-desc">${buff.turnsRemaining} turns remaining</div>
        </div></div>`;
      }
    }

    // Inventory items
    html += `<div class="inv-section-title">Items</div>`;
    if (inv.items.length === 0) {
      html += `<div class="inv-item-row"><div class="inv-item-info"><div class="inv-item-desc">No items</div></div></div>`;
    }
    for (let i = 0; i < inv.items.length; i++) {
      const t = getTemplate(inv.items[i].templateId);
      const color = `#${t.color.toString(16).padStart(6, "0")}`;
      const isEquippable = getSlotForCategory(t.category) !== null;
      const actionLabel = isEquippable ? "Equip" : "Use";

      html += `<div class="inv-item-row">
        <div class="inv-item-info">
          <div class="inv-item-name" style="color:${color}">${t.name}</div>
          <div class="inv-item-desc">${t.description}</div>
        </div>
        <div class="inv-actions">
          <button data-use="${i}">${actionLabel}</button>
          <button data-drop="${i}">Drop</button>
        </div>
      </div>`;
    }

    // Footer
    html += `<div class="inv-footer">${inv.slotCount}/${inv.maxSlots} slots</div>`;

    this.content.innerHTML = html;

    // Bind events
    this.content.querySelectorAll("[data-use]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.use!);
        this.inventory.useItem(
          idx,
          this.getPlayer(),
          this.getEnemies(),
          this.getFov(),
          this.getExplored(),
          this.getMap(),
          this.getGroundItems(),
          this.onMessage,
          this.getRng(),
        );
        this.onChanged();
        this.render();
      });
    });

    this.content.querySelectorAll("[data-drop]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.drop!);
        this.inventory.dropItem(idx, this.getPlayer(), this.getGroundItems(), this.onMessage);
        this.onChanged();
        this.render();
      });
    });

    this.content.querySelectorAll("[data-unequip]").forEach((el) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        const slot = (el as HTMLElement).dataset.unequip as EquipSlot;
        this.inventory.unequipSlot(slot, this.onMessage);
        this.onChanged();
        this.render();
      };
      if (el.tagName === "BUTTON") {
        el.addEventListener("click", handler);
      } else {
        el.addEventListener("click", handler);
      }
    });
  }

  destroy() {
    this.overlay.remove();
  }
}
