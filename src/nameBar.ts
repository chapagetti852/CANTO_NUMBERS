// HTML name entry shown on the results screen, for posting to the leaderboard.
// Phones get an in-app letter pad instead of the system keyboard.
import { touch } from './answerBar';

const bar = document.getElementById('name-bar')!;
const letters = document.getElementById('letters')!;
const input = document.getElementById('name') as HTMLInputElement;
const post = document.getElementById('post') as HTMLButtonElement;

let onPost: (name: string) => void = () => undefined;

input.readOnly = touch;
if (touch) input.inputMode = 'none';
letters.classList.toggle('hidden', !touch);
letters.addEventListener('pointerdown', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  e.preventDefault();
  const v = btn.dataset.back !== undefined ? input.value.slice(0, -1) : input.value + btn.dataset.key;
  input.value = v.slice(0, input.maxLength);
});
const submit = () => onPost(input.value);
post.addEventListener('click', submit);
input.addEventListener('keydown', (e) => {
  e.stopPropagation(); // don't let Enter restart the round
  if (e.key === 'Enter') {
    e.preventDefault();
    submit();
  }
});

export function showNameBar(name: string, cb: (name: string) => void): void {
  onPost = cb;
  input.value = name;
  setPosting(false);
  bar.classList.add('on');
}

export function hideNameBar(): void {
  bar.classList.remove('on');
  input.blur();
}

export function setPosting(busy: boolean): void {
  post.disabled = busy;
  post.textContent = busy ? '...' : 'POST';
}
