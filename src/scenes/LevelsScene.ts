import Phaser from 'phaser';
import { setupCamera, WIDTH } from '../view';
import { hideBar } from '../answerBar';
import { playMusic } from '../sound';
import { HEX, isNewPlayer, PAL, save, state } from '../state';
import { LEVELS } from '../yale/items';
import { confettiBackground, glisten, labelColor, text } from '../ui';

const FILLS = [PAL.red, PAL.white, PAL.gold, PAL.rose, PAL.coral, PAL.white, PAL.red];

/** Step 2: pick a level for the chosen mode. */
export class LevelsScene extends Phaser.Scene {
  constructor() {
    super('Levels');
  }

  create(): void {
    hideBar();
    setupCamera(this);
    playMusic(this, 'menu');
    const cx = WIDTH / 2;
    confettiBackground(this);
    const listen = state.mode === 'listen';

    const back = text(this, 30, 32, '‹ back', 12, HEX.dim).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Menu'));
    text(this, cx, 32, listen ? 'listen' : 'read', 22, listen ? HEX.red : HEX.gold);
    text(this, cx, 62, listen ? 'hear a number, type the digits' : 'see a number, write it in yale', 12, HEX.ink, true);

    LEVELS.forEach((l, i) => {
      const y = 112 + i * 62;
      const fill = FILLS[i];
      this.add.rectangle(cx + 4, y + 4, 300, 54, 0x000000, 0.5);
      const row = this.add.rectangle(cx, y, 300, 54, PAL.track).setInteractive({ useHandCursor: true });
      const parts = [
        row,
        this.add.rectangle(cx - 150 + 24, y, 48, 54, fill),
        text(this, cx - 150 + 24, y, String(l.level), 22, labelColor(fill)).setStroke(HEX.bg, 0),
        text(this, cx - 150 + 60, y - 11, l.name, 12, HEX.ink).setOrigin(0, 0.5),
        text(this, cx - 150 + 60, y + 11, l.example, 11, HEX.dim, true).setOrigin(0, 0.5),
      ];
      parts.slice(2).forEach((p) => p.setDepth(2));
      // A new player arriving from Listen is steered on to level 1.
      if (l.level === 1 && listen && isNewPlayer()) glisten(this, cx, y, 300, 54);
      const best = state.best[`${state.mode}-${l.level}`];
      if (best) text(this, cx + 144, y - 19, `best ${best}`, 8, HEX.gold).setOrigin(1, 0.5);
      row.on('pointerover', () => row.setFillStyle(PAL.deep));
      row.on('pointerout', () => row.setFillStyle(PAL.track));
      row.on('pointerdown', () => this.start(l.level));
    });

    text(this, cx, 560, 'each round is 60 seconds', 10, HEX.dim);
    text(this, cx, 580, 'wrong answers pause the clock so you can learn', 9, HEX.dim);

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= LEVELS.length) this.start(n);
      if (e.key === 'Escape') this.scene.start('Menu');
    });
  }

  private start(level: number): void {
    state.level = level;
    save();
    this.scene.start('Game');
  }
}
