import Phaser from 'phaser';
import { loadManifest } from '../audio';
import { loadSounds } from '../sound';

/** Waits for fonts and the audio manifest, and makes the one pixel texture everything uses. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    loadSounds(this);
  }

  create(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff).fillRect(0, 0, 4, 4);
    g.generateTexture('px', 4, 4);
    g.destroy();

    void Promise.all([waitForFonts(), loadManifest()]).finally(() => this.scene.start('Menu'));
  }
}

/** Canvas text never re-renders when a font arrives late, so load every face before the first scene. */
async function waitForFonts(): Promise<void> {
  const faces: [string, string][] = [
    ['16px Silkscreen', 'A'],
    ['bold 16px Silkscreen', 'A'],
    ['16px VT323', 'a'],
    ['16px VT323', 'āń'], // latin-ext file: the tone marks
  ];
  await Promise.all(faces.map(([f, c]) => document.fonts.load(f, c).catch(() => [])));
}
