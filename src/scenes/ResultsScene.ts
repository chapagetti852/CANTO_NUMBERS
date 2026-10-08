import Phaser from 'phaser';
import { setupCamera, WIDTH } from '../view';
import { hideBar } from '../answerBar';
import { cleanName, leaderboardEnabled, postScore, topScores, type Entry } from '../leaderboard';
import { hideNameBar, setPosting, showNameBar } from '../nameBar';
import { COLORS, HEX, PAL, recordBest, save, state } from '../state';
import { playMusic } from '../sound';
import { button, confettiBackground, text } from '../ui';

interface Result {
  score: number;
  correct: number;
  answered: number;
}

const BOARD_Y = 214;
const ROW_H = 22;

export class ResultsScene extends Phaser.Scene {
  private rows: Phaser.GameObjects.Text[] = [];
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super('Results');
  }

  create(r: Result): void {
    hideBar();
    setupCamera(this);
    playMusic(this, 'menu');
    const cx = WIDTH / 2;
    confettiBackground(this);
    const best = recordBest(r.score);
    this.rows = [];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => hideNameBar());

    text(this, cx, 40, 'time!', 32, HEX.red);
    text(this, cx, 70, `${state.mode} · lv ${state.level}`, 10, HEX.dim);
    const score = text(this, cx, 112, '0', 48, HEX.gold);
    this.tweens.addCounter({
      from: 0, to: r.score, duration: 700,
      onUpdate: (t) => score.setText(String(Math.round(t.getValue() ?? 0))),
    });
    const pct = r.answered ? Math.round((r.correct / r.answered) * 100) : 0;
    text(this, cx, 152, `${r.correct}/${r.answered} right · ${pct}%`, 12, HEX.ink);

    if (best && r.score > 0) {
      text(this, cx, 176, '★ new best ★', 14, HEX.rose);
      const burst = this.add.particles(0, 0, 'px', {
        speed: { min: 100, max: 400 }, scale: { start: 3, end: 0 }, lifespan: 1200,
        gravityY: 250, tint: COLORS, emitting: false,
      });
      this.time.addEvent({ delay: 250, repeat: 4, callback: () => burst.explode(80, Phaser.Math.Between(60, 300), 112) });
    }

    // Leaderboard: top 8 for this mode + level.
    this.add.rectangle(cx, BOARD_Y + 3.5 * ROW_H, WIDTH - 40, 8 * ROW_H + 12, PAL.track, 0.6);
    this.status = text(this, cx, BOARD_Y + 3.5 * ROW_H, '', 10, HEX.dim);
    if (leaderboardEnabled) {
      void this.loadBoard();
      if (r.score > 0) showNameBar(state.name, (raw) => void this.post(raw, r));
    } else {
      this.status.setText('leaderboard offline');
    }

    button(this, cx - 62, 430, 112, 40, 'again', PAL.gold, () => this.scene.start('Game'));
    button(this, cx + 62, 430, 112, 40, 'levels', PAL.white, () => this.scene.start('Levels'));

    this.time.delayedCall(600, () => this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game')));
  }

  private async loadBoard(highlight?: Entry): Promise<void> {
    this.status.setText('loading...');
    try {
      this.drawBoard(await topScores(state.mode, state.level), highlight);
    } catch {
      if (this.sys.isActive()) this.status.setText('leaderboard unreachable');
    }
  }

  private drawBoard(entries: Entry[], highlight?: Entry): void {
    if (!this.sys.isActive()) return; // left the scene while loading
    this.rows.forEach((t) => t.destroy());
    this.rows = [];
    this.status.setText(entries.length ? '' : 'no scores yet: be first!');
    let marked = false;
    entries.forEach((e, i) => {
      const mine = !marked && !!highlight && e.name === highlight.name && e.score === highlight.score;
      if (mine) marked = true;
      const color = mine ? HEX.gold : i === 0 ? HEX.rose : HEX.ink;
      const y = BOARD_Y + i * ROW_H;
      const style = { fontFamily: 'VT323, monospace', fontSize: '22px', color, resolution: this.cameras.main.zoom };
      this.rows.push(
        this.add.text(40, y, `${i + 1}.`, style).setOrigin(0, 0.5),
        this.add.text(66, y, e.name, style).setOrigin(0, 0.5),
        this.add.text(WIDTH - 40, y, String(e.score), style).setOrigin(1, 0.5),
      );
    });
  }

  private async post(raw: string, r: Result): Promise<void> {
    const name = cleanName(raw);
    if (!name) return;
    state.name = name;
    save();
    setPosting(true);
    try {
      await postScore(name, state.mode, state.level, r.score, r.correct);
      hideNameBar();
      await this.loadBoard({ name, score: r.score });
    } catch {
      setPosting(false);
      if (this.sys.isActive()) this.status.setText("couldn't post: try again");
    }
  }
}
