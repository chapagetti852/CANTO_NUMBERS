import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';

export const WIDTH = 360;
export const HEIGHT = 600;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#0b0b1a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    resizeInterval: 100, // the answer bar and phone keyboard resize our container
  },
  scene: [BootScene, MenuScene, GameScene, ResultsScene],
});

if (import.meta.env.DEV) (window as any).__PHASER_GAME__ = game;
