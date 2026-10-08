// Small shared helpers for pixel text, buttons and the background confetti.
import Phaser from 'phaser';
import { COLORS, HEX } from './state';
import { HEIGHT, WIDTH, ZOOM } from './view';

export const FONT = 'Silkscreen, monospace';
/** Silkscreen lacks ā and ń, so Yale uses VT323: has every tone mark, legible digits, lowercase. */
export const FONT_YALE = 'VT323, monospace';
/** VT323 is small for its nominal size; scale so `size` means roughly the same height in both fonts. */
const YALE_SCALE = 1.5;
export const FONT_ZH = 'PixelZh, "PingFang HK", "Noto Sans TC", sans-serif';

export function text(
  scene: Phaser.Scene, x: number, y: number, s: string, size = 16, color = HEX.ink, yale = false,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, yale ? s : s.toUpperCase(), {
      fontFamily: yale ? FONT_YALE : FONT,
      fontSize: `${Math.round(yale ? size * YALE_SCALE : size)}px`,
      padding: { top: Math.ceil(size / 4) }, // room for tone marks
      color,
      stroke: HEX.bg,
      strokeThickness: Math.max(2, size / 6),
      align: 'center',
      resolution: ZOOM,
    })
    .setOrigin(0.5);
}

export function button(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number,
  label: string, fill: number, onClick: () => void, size = 16,
): { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
  const shadow = scene.add.rectangle(x + 4, y + 4, w, h, 0x000000, 0.5);
  const box = scene.add.rectangle(x, y, w, h, fill).setInteractive({ useHandCursor: true });
  const t = text(scene, x, y, label, size, labelColor(fill)).setStroke(HEX.bg, 0);
  box.on('pointerover', () => box.setScale(1.05));
  box.on('pointerout', () => box.setScale(1));
  box.on('pointerdown', () => {
    scene.tweens.add({ targets: [box, t, shadow], y: '+=3', duration: 50, yoyo: true });
    onClick();
  });
  return { box, label: t };
}

/** Dark text on light fills, light text on dark ones. */
export function labelColor(fill: number): string {
  const c = Phaser.Display.Color.IntegerToColor(fill);
  return 0.299 * c.red + 0.587 * c.green + 0.114 * c.blue > 150 ? HEX.bg : HEX.ink;
}

/** Endless drifting pixels behind everything. Returns the emitter so callers can speed it up. */
export function confettiBackground(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
  const width = WIDTH;
  const height = HEIGHT;
  return scene.add
    .particles(0, 0, 'px', {
      x: { min: 0, max: width },
      y: height + 8,
      speedY: { min: -40, max: -120 },
      speedX: { min: -10, max: 10 },
      scale: { min: 0.5, max: 2 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 6000,
      frequency: 60,
      tint: COLORS,
    })
    .setDepth(-10);
}
