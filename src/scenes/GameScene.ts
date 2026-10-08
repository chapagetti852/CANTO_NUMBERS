import Phaser from 'phaser';
import { setupCamera, shake, WIDTH, ZOOM } from '../view';
import { clearInput, setLocked, showBar } from '../answerBar';
import { playMusic, sfx } from '../sound';
import { hasClip, hasClips, speak, stop } from '../audio';
import { COLORS, HEX, PAL, state } from '../state';
import { checkYale, normalizeYale, parseDigits, type YaleVerdict } from '../yale/check';
import { pool, randomItem, type Item } from '../yale/items';
import { confettiBackground, FONT_ZH, text } from '../ui';

const ROUND_MS = 60_000;
/** Ignore NEXT for a moment after a miss so a double-tap doesn't skip the review. */
const REVIEW_MIN_MS = 400;

const GOOD = [['好嘢', 'hóu yéh!'], ['正！', 'jeng!'], ['犀利', 'sāi leih!'], ['叻！', 'lēk!'], ['勁！', 'gihng!']];
const BAD = [['錯！', 'cho!'], ['再試', 'joi si'], ['加油', 'gā yàuh!'], ['哎呀', 'āai ya!']];
const TONE = [['聲調！', 'sīng diuh!']];

export class GameScene extends Phaser.Scene {
  private item!: Item;
  private recent: string[] = [];
  private listenPool: Item[] = [];
  private score = 0;
  private streak = 0;
  private correct = 0;
  private answered = 0;
  private timeLeft = ROUND_MS;
  private paused = false;
  private over = false;
  private reviewing = false;
  private reviewSince = 0;
  private reviewObjs: Phaser.GameObjects.GameObject[] = [];

  private prompt!: Phaser.GameObjects.Text;
  private tag!: Phaser.GameObjects.Text;
  private reveal!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Rectangle;
  private bg!: Phaser.GameObjects.Particles.ParticleEmitter;
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('Game');
  }

  private get listen(): boolean {
    return state.mode === 'listen';
  }

  private get rate(): number {
    return state.level === 5 ? 1.3 : 1;
  }

  create(): void {
    Object.assign(this, {
      recent: [], score: 0, streak: 0, correct: 0, answered: 0, timeLeft: ROUND_MS, paused: false, over: false,
      reviewing: false, reviewObjs: [],
    });
    playMusic(this, 'game');
    setupCamera(this);
    const w = WIDTH;
    const cx = w / 2;

    this.bg = confettiBackground(this);
    this.burst = this.add.particles(0, 0, 'px', {
      speed: { min: 80, max: 360 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.5, end: 0 },
      lifespan: { min: 400, max: 1100 },
      gravityY: 300,
      tint: COLORS,
      emitting: false,
    }).setDepth(5);

    // HUD
    this.add.rectangle(cx, 10, w - 24, 8, PAL.track);
    this.timerBar = this.add.rectangle(12, 10, w - 24, 8, PAL.gold).setOrigin(0, 0.5);
    this.scoreText = text(this, 16, 34, '0', 20, HEX.gold).setOrigin(0, 0.5);
    this.streakText = text(this, w - 16, 34, '', 14, HEX.rose).setOrigin(1, 0.5);
    text(this, cx, 34, `${state.mode} · lv ${state.level}`, 10, HEX.dim);
    const quit = text(this, cx, 52, '[ quit ]', 9, HEX.dim).setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => this.finish());

    // Prompt
    this.prompt = text(this, cx, 220, '', 56, HEX.ink);
    this.tag = text(this, cx, 290, '', 14, HEX.ink);
    this.reveal = text(this, cx, 360, '', 22, HEX.gold, true).setWordWrapWidth(w - 32);

    if (this.listen) {
      this.listenPool = pool(state.level).filter((it) => !hasClips() || hasClip(it));
    }

    showBar({
      digits: this.listen,
      tiles: state.tiles,
      submit: (v) => this.submit(v),
      replay: () => this.listen && speak(this.item, this.rate),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => stop());
    this.next();
  }

  update(_t: number, dt: number): void {
    if (this.over || this.paused) return;
    this.timeLeft -= dt;
    this.timerBar.scaleX = Math.max(0, this.timeLeft / ROUND_MS);
    this.timerBar.fillColor = this.timeLeft < 10_000 ? PAL.red : PAL.gold;
    if (this.timeLeft <= 0) this.finish();
  }

  private next(): void {
    let it: Item;
    do {
      it = this.listen ? Phaser.Utils.Array.GetRandom(this.listenPool) : randomItem(state.level);
    } while (this.recent.includes(it.id) && this.recent.length < 50);
    this.recent = [...this.recent.slice(-8), it.id];
    this.item = it;

    this.reveal.setText('');
    this.prompt.setColor(HEX.ink).setScale(0.4).setAlpha(1);
    if (this.listen) {
      this.prompt.setText('▶ ? ? ?');
      this.tag.setText('listen');
      speak(it, this.rate);
    } else {
      this.prompt.setText(it.display);
      this.tag.setText(it.form === 'contracted' ? '★ contracted ★' : 'full form');
      this.tag.setColor(it.form === 'contracted' ? HEX.rose : HEX.ink);
    }
    this.tweens.add({ targets: this.prompt, scale: 1, duration: 220, ease: 'Back.Out' });
  }

  private submit(raw: string): void {
    if (this.reviewing) return this.endReview();
    if (this.paused || this.over) return;
    const value = raw.trim();
    if (!value) {
      if (this.listen) speak(this.item, this.rate);
      return;
    }
    let verdict: YaleVerdict;
    if (this.listen) {
      const p = parseDigits(value);
      const target = this.item.money ? this.item.value : this.item.value * 10;
      verdict = p === target ? 'correct' : 'wrong';
    } else {
      verdict = checkYale(value, this.item.answers);
    }
    this.answered++;
    if (verdict === 'correct') this.win();
    else this.lose(verdict, value);
  }

  private win(): void {
    this.correct++;
    this.streak++;
    const gained = state.level * 10 + (this.streak >= 3 ? this.streak * 2 : 0);
    this.score += gained;
    this.scoreText.setText(String(this.score));
    this.streakText.setText(this.streak >= 2 ? `x${this.streak} combo` : '');

    const { x, y } = this.prompt;
    this.burst.explode(40 + Math.min(this.streak, 20) * 8, x, y);
    this.cameras.main.flash(80, 255, 255, 255);
    if (this.streak >= 5) shake(this, 120, Math.min(6, 1 + this.streak * 0.25));
    this.bg.frequency = Math.max(8, 60 - this.streak * 5);
    this.popup(Phaser.Utils.Array.GetRandom(GOOD), true);
    this.floatText(`+${gained}`, HEX.gold);
    if (this.streak % 5 === 0) {
      sfx('combo', 0.5);
      this.time.delayedCall(120, () => this.burst.explode(120, x, y));
    } else {
      sfx('correct', 0.5);
    }

    if (this.listen) {
      this.prompt.setText(this.item.display).setColor(HEX.gold);
      this.reveal.setText(this.item.answers[0]);
    }
    clearInput();
    this.paused = true;
    this.time.delayedCall(this.listen ? 700 : 250, () => {
      this.paused = false;
      if (!this.over) this.next();
    });
  }

  private lose(verdict: YaleVerdict, typed: string): void {
    this.streak = 0;
    this.streakText.setText('');
    this.bg.frequency = 60;
    sfx('wrong', 0.5);
    shake(this, 200, 5);
    this.cameras.main.flash(120, 232, 17, 45);
    this.popup(Phaser.Utils.Array.GetRandom(verdict === 'tone' ? TONE : BAD), false);

    this.prompt.setColor(HEX.red);
    this.tweens.add({ targets: this.prompt, x: '+=6', duration: 30, yoyo: true, repeat: 5 });
    if (this.listen) {
      this.prompt.setText(this.item.display);
      speak(this.item, 1);
    }

    // The clock stops and the answer stays until NEXT: this is where the learning happens.
    this.paused = true;
    this.reviewing = true;
    this.reviewSince = this.time.now;
    setLocked(true);
    this.showReview(verdict, typed);
  }

  private showReview(verdict: YaleVerdict, typed: string): void {
    const cx = WIDTH / 2;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => (this.reviewObjs.push(o), o);
    this.reveal.setText('');
    const head = this.listen ? 'answer' : verdict === 'tone' ? 'right syllables · check the tones' : 'not quite · gold = what to fix';
    add(text(this, cx, 330, head, 10, verdict === 'tone' ? HEX.gold : HEX.red));
    add(text(this, cx, 356, `you: ${typed}`, 14, HEX.dim, true).setWordWrapWidth(320));
    const y = this.syllableRow(this.item.answers[0], this.listen ? null : typed, 392);
    if (this.item.alt) {
      const label = this.item.form === 'contracted' ? 'full form' : 'short form';
      add(text(this, cx, y + 8, `${label}: ${this.item.alt}`, 12, HEX.dim, true).setWordWrapWidth(320));
    }
    if (this.item.answers.length > 1) {
      add(text(this, cx, y + 30, `also ok: ${this.item.answers[1]}`, 12, HEX.dim, true));
    }
    add(text(this, cx, 560, 'tap next or press enter', 9, HEX.dim));
  }

  /** The correct answer, word by word, with the words that differ from `typed` in gold. Returns the bottom y. */
  private syllableRow(answer: string, typed: string | null, top: number): number {
    const units = answer.split(/\s+/);
    const theirs = typed ? typed.normalize('NFC').toLowerCase().trim().split(/[\s-]+/) : [];
    let k = 0;
    const words = units.map((u) => {
      const syl = u.split('-');
      const wrong = typed !== null && syl.some((s, j) => normalizeYale(s) !== normalizeYale(theirs[k + j] ?? ''));
      k += syl.length;
      const t = text(this, 0, 0, u, 24, wrong ? HEX.gold : HEX.ink, true);
      this.reviewObjs.push(t);
      return t;
    });
    // Lay out centred lines, wrapping at the screen width.
    const gap = 10;
    const maxW = WIDTH - 32;
    let line: Phaser.GameObjects.Text[] = [];
    let y = top;
    const flush = () => {
      const w = line.reduce((a, t) => a + t.width, 0) + gap * (line.length - 1);
      let x = (WIDTH - w) / 2;
      line.forEach((t) => { t.setOrigin(0, 0.5).setPosition(x, y); x += t.width + gap; });
      line = [];
      y += 32;
    };
    for (const t of words) {
      const w = line.reduce((a, o) => a + o.width + gap, 0) + t.width;
      if (line.length && w > maxW) flush();
      line.push(t);
    }
    flush();
    return y;
  }

  private endReview(): void {
    if (this.time.now - this.reviewSince < REVIEW_MIN_MS) return;
    this.reviewObjs.forEach((o) => o.destroy());
    this.reviewObjs = [];
    this.reviewing = false;
    this.paused = false;
    setLocked(false);
    clearInput();
    if (!this.over) this.next();
  }

  /** Chinese phrase + Yale, flung out of the prompt. */
  private popup([zh, yale]: string[], good: boolean): void {
    const x = Phaser.Math.Between(70, WIDTH - 70);
    const y = Phaser.Math.Between(110, 160);
    const color = Phaser.Utils.Array.GetRandom(good ? [HEX.gold, HEX.ink, HEX.rose] : [HEX.red]);
    const z = this.add.text(x, y, zh, {
      fontFamily: FONT_ZH, fontSize: '32px', color, stroke: HEX.bg, strokeThickness: 6, resolution: ZOOM,
    }).setOrigin(0.5).setDepth(10);
    const r = text(this, x, y + 28, yale, 14, color, true).setDepth(10);
    const angle = Phaser.Math.Between(-18, 18);
    [z, r].forEach((o) => o.setAngle(angle).setScale(0.3));
    this.tweens.add({ targets: [z, r], scale: 1.3, duration: 160, ease: 'Back.Out' });
    this.tweens.add({
      targets: [z, r], y: '-=50', alpha: 0, delay: 450, duration: 600,
      onComplete: () => { z.destroy(); r.destroy(); },
    });
  }

  private floatText(s: string, color: string): void {
    const t = text(this, this.scoreText.x + 40, this.scoreText.y, s, 14, color).setDepth(10);
    this.tweens.add({ targets: t, y: '-=20', alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }

  private finish(): void {
    if (this.over) return;
    this.over = true;
    stop();
    this.scene.start('Results', { score: this.score, correct: this.correct, answered: this.answered });
  }
}
