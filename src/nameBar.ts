// HTML name entry shown on the results screen, for posting to the leaderboard.
const bar = document.getElementById('name-bar')!;
const input = document.getElementById('name') as HTMLInputElement;
const post = document.getElementById('post') as HTMLButtonElement;

let onPost: (name: string) => void = () => undefined;
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
