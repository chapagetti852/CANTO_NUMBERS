// The HTML answer bar under the canvas: input, GO/NEXT, replay, syllable tiles, number pad, tones.
// On phones the system keyboard never opens (it resizes the page and is janky); the in-app
// keys are the only input. On PC they are optional (menu setting).
import { applyTone } from './yale/check';

const bar = document.getElementById('answer-bar')!;
const input = document.getElementById('answer') as HTMLInputElement;
const tiles = document.getElementById('tiles')!;
const digits = document.getElementById('digits')!;
const tones = document.getElementById('tones')!;
const hint = document.getElementById('hint')!;
const replay = document.getElementById('replay')!;
const go = document.getElementById('go')!;

/** Phones and tablets: in-app keys only, never the system keyboard. */
export const touch = window.matchMedia('(pointer: coarse)').matches;

let onSubmit: (value: string) => void = () => undefined;
let onReplay: () => void = () => undefined;
let locked = false;
let tilesOn = false;

const submit = () => onSubmit(input.value);
go.addEventListener('click', submit);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submit();
  }
});
replay.addEventListener('click', () => {
  onReplay();
  focus();
});

/** pointerdown + preventDefault keeps focus in the input (and any phone keyboard open). */
function onTap(el: HTMLElement, fn: (btn: HTMLButtonElement) => void): void {
  el.addEventListener('pointerdown', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn) return;
    e.preventDefault();
    if (!locked) fn(btn);
    focus();
  });
}

onTap(tones, (btn) => {
  input.value = applyTone(input.value, Number(btn.dataset.tone));
  updateHint();
});

onTap(digits, (btn) => {
  input.value = btn.dataset.back !== undefined ? input.value.slice(0, -1) : input.value + btn.dataset.key;
});

onTap(tiles, (btn) => {
  const v = input.value.trimEnd();
  if (btn.dataset.back !== undefined) {
    input.value = v.replace(/[^\s-]+$/, '').replace(/[\s-]+$/, '');
  } else {
    input.value = (v ? `${v} ` : '') + btn.dataset.syl;
  }
  updateHint();
});

/** Nudge toward the next step: a syllable without a tone mark still needs a tone. */
function updateHint(): void {
  if (!tilesOn) return hint.replaceChildren();
  const last = input.value.trim().split(/[\s-]+/).pop() ?? '';
  const toned = /[̀-ͯ]|h$/.test(last.normalize('NFD')) || /^(sei|baat|go|bun)$/.test(last);
  hint.textContent = !last ? 'tap a syllable' : toned ? 'next syllable, or GO' : `now a tone for "${last}"`;
}

function focus(): void {
  if (!touch) input.focus();
}

export interface BarOptions {
  digits: boolean;      // Listen mode: number pad; Read mode: syllable tiles + tones
  keys: boolean;        // PC setting: show the on-screen keys (phones always do)
  submit: (value: string) => void;
  replay: () => void;
}

export function showBar(o: BarOptions): void {
  onSubmit = o.submit;
  onReplay = o.replay;
  const keys = touch || o.keys;
  tilesOn = !o.digits && keys;
  input.inputMode = touch ? 'none' : o.digits ? 'decimal' : 'text';
  input.readOnly = touch;
  input.placeholder = keys ? '' : o.digits ? '38.50' : 'sāam go yih';
  tiles.classList.toggle('hidden', !tilesOn);
  digits.classList.toggle('hidden', !(o.digits && keys));
  tones.classList.toggle('hidden', o.digits);
  hint.classList.toggle('hidden', !tilesOn);
  replay.classList.toggle('hidden', !o.digits);
  bar.classList.add('on');
  setLocked(false);
  clearInput();
}

export function hideBar(): void {
  bar.classList.remove('on');
  input.blur();
}

export function clearInput(): void {
  input.value = '';
  updateHint();
  focus();
}

/** While locked (reviewing a wrong answer) edits are ignored and GO becomes NEXT. */
export function setLocked(on: boolean): void {
  locked = on;
  input.readOnly = on || touch;
  go.textContent = on ? 'NEXT' : 'GO';
  if (on) hint.textContent = '';
  else updateHint();
  focus();
}
