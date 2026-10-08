import Phaser from 'phaser';
import { setupCamera, WIDTH } from '../view';
import { hideBar } from '../answerBar';
import { playMusic } from '../sound';
import { HEX, PAL, save, state } from '../state';
import { LEVELS } from '../yale/items';
import { confettiBackground, labelColor, text } from '../ui';

const FILLS = [PAL.red, PAL.white, PAL.gold, PAL.rose, PAL.coral];

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
      const y = 126 + i * 78;
      const fill = FILLS[i];
      this.add.rectangle(cx + 4, y + 4, 300, 64, 0x000000, 0.5);
      const row = this.add.rectangle(cx, y, 300, 64, PAL.track).setInteractive({ useHandCursor: true });
      this.add.rectangle(cx - 150 + 28, y, 56, 64, fill);
      text(this, cx - 150 + 28, y, String(l.level), 26, labelColor(fill)).setStroke(HEX.bg, 0);
      text(this, cx - 150 + 70, y - 12, l.name, 13, HEX.ink).setOrigin(0, 0.5);
      text(this, cx - 150 + 70, y + 12, l.example, 13, HEX.dim, true).setOrigin(0, 0.5);
      const best = state.best[`${state.mode}-${l.level}`];
      if (best) text(this, cx + 142, y - 22, `best ${best}`, 8, HEX.gold).setOrigin(1, 0.5);
      row.on('pointerover', () => row.setFillStyle(PAL.deep));
      row.on('pointerout', () => row.setFillStyle(PAL.track));
      row.on('pointerdown', () => this.start(l.level));
    });

    text(this, cx, 528, 'each round is 60 seconds', 10, HEX.dim);
    text(this, cx, 550, 'wrong answers pause the clock so you can learn', 9, HEX.dim);

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
