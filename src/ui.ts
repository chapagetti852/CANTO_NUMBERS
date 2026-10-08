// Small shared helpers for pixel text, buttons and the background confetti.
import Phaser from 'phaser';
import { COLORS, HEX } from './state';

export const FONT = 'Silkscreen, monospace';
/** Silkscreen lacks ā and ń, so anything in Yale uses Pixelify Sans. */
export const FONT_YALE = '"Pixelify Sans", monospace';
export const FONT_ZH = 'PixelZh, "PingFang HK", "Noto Sans TC", sans-serif';

export function text(
  scene: Phaser.Scene, x: number, y: number, s: string, size = 16, color = HEX.ink, yale = false,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, s.toUpperCase(), {
      fontFamily: yale ? FONT_YALE : FONT,
      fontSize: `${size}px`,
      fontStyle: yale ? 'bold' : '',
      padding: { top: Math.ceil(size / 4) }, // room for tone marks on capitals
      color,
      stroke: '#0b0b1a',
      strokeThickness: Math.max(2, size / 6),
      align: 'center',
    })
    .setOrigin(0.5);
}

export function button(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number,
  label: string, fill: number, onClick: () => void, size = 16,
): { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
  const shadow = scene.add.rectangle(x + 4, y + 4, w, h, 0x000000, 0.5);
  const box = scene.add.rectangle(x, y, w, h, fill).setInteractive({ useHandCursor: true });
  const t = text(scene, x, y, label, size, '#0b0b1a').setStroke('#0b0b1a', 0);
  box.on('pointerover', () => box.setScale(1.05));
  box.on('pointerout', () => box.setScale(1));
  box.on('pointerdown', () => {
    scene.tweens.add({ targets: [box, t, shadow], y: '+=3', duration: 50, yoyo: true });
    onClick();
  });
  return { box, label: t };
}

/** Endless drifting pixels behind everything. Returns the emitter so callers can speed it up. */
export function confettiBackground(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
  const { width, height } = scene.scale.gameSize;
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
