import Phaser from 'phaser';
import { setupCamera, WIDTH } from '../view';
import { hideBar } from '../answerBar';
import { HEX, PAL, save, state, type Mode } from '../state';
import { LEVELS } from '../yale/items';
import { button, confettiBackground, labelColor, text } from '../ui';

const TITLE = [HEX.red, HEX.ink, HEX.gold, HEX.rose];
const LEVEL_FILLS = [PAL.red, PAL.white, PAL.gold, PAL.rose, PAL.coral];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    hideBar();
    setupCamera(this);
    const cx = WIDTH / 2;
    confettiBackground(this);

    // Title with per-letter colour cycling.
    const title = 'CANTO NUMBERS';
    const letters = [...title].map((c, i) =>
      text(this, cx - (title.length * 22) / 2 + i * 22 + 11, 52, c, 28, '#fff'));
    this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => letters.forEach((l, i) => {
        l.setColor(TITLE[(i + Math.floor(this.time.now / 120)) % TITLE.length]);
        l.y = 52 + Math.sin(this.time.now / 150 + i) * 3;
      }),
    });
    text(this, cx, 86, 'sahp luhk gáu? 16? 69?', 12, HEX.dim, true);

    // Mode toggle.
    const modes: { mode: Mode; label: string }[] = [
      { mode: 'listen', label: '🔊 Listen' },
      { mode: 'read', label: '👀 Read' },
    ];
    const modeButtons = modes.map((m, i) =>
      button(this, cx - 80 + i * 160, 130, 150, 40, m.label.replace(/^\S+ /, ''), 0, () => {
        state.mode = m.mode;
        save();
        refresh();
      }));
    const modeHint = text(this, cx, 162, '', 10, HEX.dim);

    // Levels.
    const levelRows = LEVELS.map((l, i) => {
      const y = 210 + i * 62;
      const b = button(this, cx, y, 300, 50, '', LEVEL_FILLS[i], () => this.start(l.level));
      b.label.setText(`${l.level}  ${l.name}`.toUpperCase()).setY(y - 7);
      const sub = text(this, cx, y + 12, '', 11, labelColor(LEVEL_FILLS[i]), true).setStroke('#000', 0);
      return { level: l.level, hint: l.hint, sub };
    });

    // Tone button toggle.
    const tones = text(this, cx, 532, '', 12, HEX.rose).setInteractive({ useHandCursor: true });
    tones.on('pointerdown', () => {
      state.toneButtons = !state.toneButtons;
      save();
      refresh();
    });
    text(this, cx, 572, 'tap a level · keys 1-5', 9, HEX.dim);

    const refresh = () => {
      modeButtons.forEach((b, i) => {
        const fill = modes[i].mode === state.mode ? PAL.gold : PAL.track;
        b.box.setFillStyle(fill);
        b.label.setColor(labelColor(fill));
      });
      modeHint.setText(state.mode === 'listen' ? 'HEAR IT → TYPE DIGITS' : 'SEE IT → TYPE YALE');
      levelRows.forEach((r) => {
        const best = state.best[`${state.mode}-${r.level}`];
        r.sub.setText(`${r.hint}${best ? `   best ${best}` : ''}`.toUpperCase());
      });
      tones.setText(`TONE BUTTONS: ${state.toneButtons ? 'ON' : 'OFF'}`);
    };
    refresh();

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= LEVELS.length) this.start(n);
    });
  }

  private start(level: number): void {
    state.level = level;
    save();
    this.scene.start('Game');
  }
}
