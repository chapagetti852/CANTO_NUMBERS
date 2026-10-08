import Phaser from 'phaser';
import { setupCamera, WIDTH } from '../view';
import { hideBar } from '../answerBar';
import { playMusic } from '../sound';
import { HEX, PAL, save, state, type Mode } from '../state';
import { confettiBackground, text } from '../ui';

const TITLE = [HEX.red, HEX.ink, HEX.gold, HEX.rose];

const MODES: { mode: Mode; title: string; line: string; example: string; fill: number }[] = [
  { mode: 'listen', title: 'Listen', line: 'hear a number, type the digits', example: '"sāam sahp baat" → 38', fill: PAL.red },
  { mode: 'read', title: 'Read', line: 'see a number, write it in yale', example: '38 → sāam sahp baat', fill: PAL.gold },
];

/** Step 1: pick a mode. Step 2 is LevelsScene. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    hideBar();
    setupCamera(this);
    playMusic(this, 'menu');
    const cx = WIDTH / 2;
    confettiBackground(this);

    // Title with per-letter colour cycling.
    const title = 'CANTO NUMBERS';
    const letters = [...title].map((c, i) =>
      text(this, cx - (title.length * 22) / 2 + i * 22 + 11, 64, c, 28, HEX.ink));
    this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => letters.forEach((l, i) => {
        l.setColor(TITLE[(i + Math.floor(this.time.now / 120)) % TITLE.length]);
        l.y = 64 + Math.sin(this.time.now / 150 + i) * 3;
      }),
    });
    text(this, cx, 100, 'cantonese numbers & money, in yale', 12, HEX.dim, true);
    text(this, cx, 150, 'choose how to practise', 11, HEX.ink);

    MODES.forEach((m, i) => this.card(cx, 230 + i * 150, m));

    // Answer input setting (Read mode).
    const input = text(this, cx, 528, '', 11, HEX.rose).setInteractive({ useHandCursor: true });
    const refresh = () => input.setText(`read answers: ${state.tiles ? 'tap tiles' : 'type'}  ⇄`);
    input.on('pointerdown', () => {
      state.tiles = !state.tiles;
      save();
      refresh();
    });
    refresh();
    text(this, cx, 566, 'new here? start with read, level 1', 9, HEX.dim);

    this.input.keyboard?.on('keydown-L', () => this.pick('listen'));
    this.input.keyboard?.on('keydown-R', () => this.pick('read'));
  }

  private card(cx: number, y: number, m: (typeof MODES)[number]): void {
    const w = 300;
    const h = 126;
    this.add.rectangle(cx + 5, y + 5, w, h, 0x000000, 0.5);
    const box = this.add.rectangle(cx, y, w, h, PAL.track).setStrokeStyle(4, m.fill).setInteractive({ useHandCursor: true });
    const parts = [
      box,
      text(this, cx, y - 34, m.title, 26, Phaser.Display.Color.IntegerToColor(m.fill).rgba),
      text(this, cx, y + 4, m.line, 13, HEX.ink, true),
      text(this, cx, y + 34, m.example, 13, HEX.dim, true),
    ];
    box.on('pointerover', () => parts.forEach((p) => p.setScale(1.03)));
    box.on('pointerout', () => parts.forEach((p) => p.setScale(1)));
    box.on('pointerdown', () => this.pick(m.mode));
  }

  private pick(mode: Mode): void {
    state.mode = mode;
    save();
    this.scene.start('Levels');
  }
}
