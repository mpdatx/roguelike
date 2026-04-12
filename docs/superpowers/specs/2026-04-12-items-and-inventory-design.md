# Items & Inventory — Design Spec

## Context

The roguelike has dungeon generation, enemies with AI, combat, and a HUD. There's no item system — the player has flat attack/defense stats with no way to improve or use consumables. This adds a full loot system with potions, scrolls, weapons, armor, and rings.

## Item Data Model

File: `src/items.ts`

```ts
type ItemCategory = "potion" | "scroll" | "weapon" | "armor" | "ring";

interface ItemTemplate {
  id: string;
  name: string;
  category: ItemCategory;
  color: number;
  description: string;
  weight: number; // spawn weight, higher = more common
  // consumable effects
  healAmount?: number;
  buffType?: BuffType;
  buffDuration?: number;
  buffAmount?: number;
  scrollEffect?: ScrollEffect;
  // equipment stats
  attackBonus?: number;
  defenseBonus?: number;
  maxHpBonus?: number;
  fovBonus?: number;
}

interface Item {
  templateId: string;
  x: number;
  y: number;
}

interface InventoryItem {
  templateId: string;
}
```

## Item Templates (~18 items)

### Potions (consumable)
| Item | Color | Effect | Spawn Weight |
|------|-------|--------|-------------|
| Health Potion | 0xff4488 | Heal 8 HP | 10 |
| Greater Health Potion | 0xff66aa | Heal 15 HP | 4 |
| Strength Potion | 0xff8844 | +1 attack for 20 turns | 3 |
| Speed Potion | 0x44ffff | Extra turn for 10 turns | 2 |

### Scrolls (consumable)
| Item | Color | Effect | Spawn Weight |
|------|-------|--------|-------------|
| Scroll of Lightning | 0xffff44 | 8 damage to nearest visible enemy | 4 |
| Scroll of Confusion | 0xff88ff | All visible enemies wander for 10 turns | 3 |
| Scroll of Mapping | 0x88ffff | Reveal entire floor | 2 |
| Scroll of Teleportation | 0xaa88ff | Teleport to random floor tile | 3 |

### Weapons (equippable, one slot)
| Item | Color | Attack | Spawn Weight |
|------|-------|--------|-------------|
| Dagger | 0xaaaaaa | +1 | 8 |
| Sword | 0xcccccc | +2 | 5 |
| Battle Axe | 0xdddddd | +3 | 2 |
| Enchanted Blade | 0x88aaff | +4 | 1 |

### Armor (equippable, one slot)
| Item | Color | Defense | Spawn Weight |
|------|-------|---------|-------------|
| Leather Armor | 0x886644 | +1 | 8 |
| Chainmail | 0xaaaaaa | +2 | 4 |
| Plate Armor | 0xcccccc | +3 | 1 |

### Rings (equippable, one slot)
| Item | Color | Effect | Spawn Weight |
|------|-------|--------|-------------|
| Ring of Vitality | 0xff4488 | +5 max HP | 3 |
| Ring of Sight | 0x44ffff | +3 FOV range | 3 |
| Ring of Protection | 0x88aaff | +1 defense | 3 |

## Equipment System

Three equipment slots: `weapon`, `armor`, `ring`.

File: extend `Entity` or add to player-specific state in `src/entities.ts`

```ts
interface Equipment {
  weapon: InventoryItem | null;
  armor: InventoryItem | null;
  ring: InventoryItem | null;
}
```

Equipping an item removes it from inventory and places it in the slot. If a slot is occupied, the old item goes back to inventory. If inventory is full when unequipping, block the action with a message.

### Stat Computation

Player's effective stats are computed from base + equipment + active buffs:
- `effectiveAttack = baseAttack + weapon.attackBonus + strengthBuff`
- `effectiveDefense = baseDefense + armor.defenseBonus + ring.defenseBonus(if protection)`
- `effectiveMaxHp = baseMaxHp + ring.maxHpBonus(if vitality)`
- `effectiveFovRange = baseFovRange + ring.fovBonus(if sight)`

File: `src/items.ts` — export a `getEffectiveStats()` function

## Temporary Buffs

```ts
type BuffType = "strength" | "speed";

interface ActiveBuff {
  type: BuffType;
  amount: number;
  turnsRemaining: number;
}
```

Stored on the player as `ActiveBuff[]`. Decremented each player turn in the turn engine. Speed buff grants an extra action per turn (player acts twice before enemies get a turn).

File: player buff state managed alongside inventory in `src/inventory.ts`

## Inventory

File: `src/inventory.ts`

```ts
class Inventory {
  items: InventoryItem[];
  equipment: Equipment;
  buffs: ActiveBuff[];
  maxSlots: number; // 20
}
```

### Pickup
When the player moves onto a tile containing an item:
- If inventory has space: pick up, log message, remove from ground
- If full: log "Inventory full." and leave item on ground

### Actions
- **Use** (potions/scrolls): Apply effect, remove from inventory, log message
- **Equip** (weapons/armor/rings): Move to equipment slot, swap if occupied
- **Unequip**: Move from slot back to inventory (if space)
- **Drop**: Remove from inventory, place on ground at player position

## Scroll Effects

Implemented as functions in `src/items.ts`:
- **Lightning**: Find nearest enemy in FOV, deal 8 damage. If none visible, log "No target."
- **Confusion**: All enemies currently in FOV get a `confused` flag for 10 turns. Confused enemies wander randomly instead of chasing.
- **Mapping**: Add all floor tiles to the `explored` set.
- **Teleportation**: Pick a random floor tile not occupied by an enemy, move player there.

### Enemy Confusion

Add `confusedTurns: number` to the `Enemy` interface. When > 0, the enemy wanders instead of chasing, and the counter decrements each turn.

## Spawning

In `generateDungeon()`, after enemy spawning:
- For each room (including the first): spawn 0-2 items at random floor positions
- Item type chosen by weighted random from templates
- Items cannot spawn on the same tile as another item or enemy

File: spawn function in `src/items.ts`

## Rendering

Ground items rendered as small diamonds (rotated squares) at tile position, in their template color. Only rendered when in FOV. Rendered between tiles and entities (below player/enemies, above floor).

Add a `itemGraphics` layer in DungeonScene between `tileGraphics` and `entityGraphics`.

## Inventory Panel (DOM)

File: `src/inventoryPanel.ts`

Triggered by a backpack icon button added to the HUD. The panel slides up from the bottom, covering ~70% of the screen.

### Layout
- **Header**: "Inventory" title + close button
- **Equipment section**: 3 slots (Weapon, Armor, Ring) showing equipped item name or "Empty". Tap to unequip.
- **Divider**
- **Item list**: Scrollable list of inventory items. Each row: item name (colored), short description. Tap to show action buttons (Use/Equip/Drop).
- **Footer**: "X/20 slots" counter

### Behavior
- Opens on HUD button tap
- Closes on: close button, tap outside panel, Escape key
- While open: game input is paused (turn engine is already waiting for player input, so this is naturally handled)
- Using/equipping an item updates the panel in-place (doesn't close)
- `pointer-events: auto` on the panel so taps don't pass through to the game

### Styling
- Same dark theme as HUD: `#1a1a2e` background, `#ccc` text, monospace font
- Item colors match their ground rendering colors
- Equipment slots highlighted with border
- Slide-up animation (CSS transition)

## Integration Changes

### entities.ts
- Add `confusedTurns` to `Enemy` interface (default 0)

### turnEngine.ts
- Accept `Inventory` reference
- After player acts: decrement buff timers, remove expired buffs
- After enemy acts: decrement `confusedTurns`
- Use `getEffectiveStats()` for combat damage calculation
- Handle speed buff: if active, player gets a second action before advancing to enemies
- Call `onPickup` callback when player lands on an item tile

### ai.ts
- Check `confusedTurns > 0` — if confused, wander instead of normal behavior

### DungeonScene.ts
- Add `items: Item[]` ground items array
- Add `itemGraphics` rendering layer
- Add `Inventory` instance for player
- Pass inventory to turn engine
- Handle pickup when player moves
- Render ground items in FOV

### hud.ts
- Add inventory button (backpack icon)
- Show active buff indicators next to HP bar

## What This Does NOT Include
- Item identification/unidentified items
- Cursed items
- Stacking consumables
- Shops or gold
- Item crafting or upgrading
