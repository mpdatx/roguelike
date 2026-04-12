import * as Phaser from "phaser";
import { DungeonScene } from "./scenes/DungeonScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#1a1a2e",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [DungeonScene],
  pixelArt: true,
};

new Phaser.Game(config);
