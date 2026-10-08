// The HTML answer bar under the canvas: text input, tone buttons, GO, replay.
import { applyTone } from './yale/check';

const bar = document.getElementById('answer-bar')!;
const input = document.getElementById('answer') as HTMLInputElement;
const tones = document.getElementById('tones')!;
const replay = document.getElementById('replay')!;
const go = document.getElementById('go')!;

let onSubmit: (value: string) => void = () => undefined;
let onReplay: () => void = () => undefined;

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
  input.focus();
});
tones.addEventListener('pointerdown', (e) => {
  // pointerdown + preventDefault keeps focus (and the phone keyboard) in the input.
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  e.preventDefault();
  input.value = applyTone(input.value, Number(btn.dataset.tone));
  input.focus();
});

export interface BarOptions {
  digits: boolean;      // Listen mode: numeric keypad, no tone buttons
  toneButtons: boolean;
  submit: (value: string) => void;
  replay: () => void;
}

export function showBar(o: BarOptions): void {
  onSubmit = o.submit;
  onReplay = o.replay;
  input.inputMode = o.digits ? 'decimal' : 'text';
  input.placeholder = o.digits ? '38.50' : 'sāam go yih';
  tones.classList.toggle('hidden', o.digits || !o.toneButtons);
  replay.classList.toggle('hidden', !o.digits);
  bar.classList.add('on');
  clearInput();
}

export function hideBar(): void {
  bar.classList.remove('on');
  input.blur();
}

export function clearInput(): void {
  input.value = '';
  input.focus();
}

export function setLocked(locked: boolean): void {
  input.disabled = locked;
  if (!locked) input.focus();
}
