import Phaser from 'phaser';
import { setupCamera, WIDTH } from '../view';
import { hideBar } from '../answerBar';
import { COLORS, HEX, recordBest, state } from '../state';
import { button, confettiBackground, text } from '../ui';

interface Result {
  score: number;
  correct: number;
  answered: number;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(r: Result): void {
    hideBar();
    setupCamera(this);
    const cx = WIDTH / 2;
    confettiBackground(this);
    const best = recordBest(r.score);

    text(this, cx, 90, 'time!', 40, HEX.hot);
    text(this, cx, 130, `${state.mode} · lv ${state.level}`, 12, HEX.dim);
    const score = text(this, cx, 210, '0', 64, HEX.yellow);
    this.tweens.addCounter({
      from: 0, to: r.score, duration: 700,
      onUpdate: (t) => score.setText(String(Math.round(t.getValue() ?? 0))),
    });
    const pct = r.answered ? Math.round((r.correct / r.answered) * 100) : 0;
    text(this, cx, 270, `${r.correct}/${r.answered} right · ${pct}%`, 14, HEX.ink);

    if (best && r.score > 0) {
      text(this, cx, 310, '★ new best ★', 18, HEX.lime);
      const burst = this.add.particles(0, 0, 'px', {
        speed: { min: 100, max: 400 }, scale: { start: 3, end: 0 }, lifespan: 1200,
        gravityY: 250, tint: COLORS, emitting: false,
      });
      this.time.addEvent({ delay: 250, repeat: 4, callback: () => burst.explode(80, Phaser.Math.Between(60, 300), 210) });
    }

    button(this, cx, 400, 240, 50, 'again', 0xb6ff3b, () => this.scene.start('Game'));
    button(this, cx, 466, 240, 50, 'menu', 0x22e6ff, () => this.scene.start('Menu'));
    text(this, cx, 540, 'leaderboard coming soon', 9, HEX.dim);

    this.time.delayedCall(600, () => this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game')));
  }
}
