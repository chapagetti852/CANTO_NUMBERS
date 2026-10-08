// Dev-only clip review page (review.html). Lists Listen-mode clips; mark each good or bad.
import { LEVELS, pool, type Item } from './yale/items';

type Verdict = 'good' | 'bad';
const list = document.getElementById('list')!;
const count = document.getElementById('count')!;
const allBox = document.getElementById('all') as HTMLInputElement;
const unratedBox = document.getElementById('unrated') as HTMLInputElement;

const manifest: Record<string, string> = await (await fetch('assets/audio/manifest.json')).json();
const verdicts: Record<string, Verdict> = await (await fetch('/__clip-review')).json();
const items = new Map<string, Item>();
for (const l of LEVELS) for (const it of pool(l.level)) if (manifest[it.id]) items.set(it.id, it);

let rows: { it: Item; file: string; el: HTMLElement }[] = [];
let cur = 0;
const audio = new Audio();

function play(i: number): void {
  cur = Math.max(0, Math.min(rows.length - 1, i));
  rows.forEach((r, j) => r.el.classList.toggle('current', j === cur));
  const r = rows[cur];
  if (!r) return;
  r.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  audio.src = `assets/audio/clips/${r.file}`;
  void audio.play();
}

async function mark(i: number, v: Verdict): Promise<void> {
  const r = rows[i];
  if (!r) return;
  verdicts[r.file] = v;
  r.el.classList.remove('good', 'bad');
  r.el.classList.add(v);
  updateCount();
  await fetch('/__clip-review', { method: 'POST', body: JSON.stringify({ file: r.file, verdict: v }) });
  play(i + 1);
}

function updateCount(): void {
  const files = [...items.values()].filter(show).map((it) => manifest[it.id]);
  const done = files.filter((f) => verdicts[f]).length;
  const bad = files.filter((f) => verdicts[f] === 'bad').length;
  count.textContent = `${done}/${files.length} rated · ${bad} bad`;
}

function show(it: Item): boolean {
  return allBox.checked || it.form === 'contracted';
}

function render(): void {
  list.replaceChildren();
  rows = [...items.values()]
    .filter(show)
    .filter((it) => !unratedBox.checked || !verdicts[manifest[it.id]])
    .map((it) => {
      const file = manifest[it.id];
      const el = document.createElement('div');
      el.className = `row ${verdicts[file] ?? ''}`;
      const voice = file.split('-').slice(-2, -1)[0];
      el.innerHTML = `<span class="disp"></span><span class="yale"></span><span class="voice"></span>
        <span><button class="p">▶</button> <button class="g">good</button> <button class="b">bad</button></span>`;
      el.querySelector('.disp')!.textContent = it.display;
      el.querySelector('.yale')!.textContent = it.answers[0];
      el.querySelector('.voice')!.textContent = voice;
      list.append(el);
      return { it, file, el };
    });
  rows.forEach((r, i) => {
    r.el.querySelector('.p')!.addEventListener('click', () => play(i));
    r.el.querySelector('.g')!.addEventListener('click', () => void mark(i, 'good'));
    r.el.querySelector('.b')!.addEventListener('click', () => void mark(i, 'bad'));
  });
  updateCount();
  cur = 0;
  rows.forEach((r, j) => r.el.classList.toggle('current', j === 0));
}

document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === ' ') { e.preventDefault(); play(cur); }
  if (e.key === 'g') void mark(cur, 'good');
  if (e.key === 'b') void mark(cur, 'bad');
  if (e.key === 'ArrowDown') { e.preventDefault(); play(cur + 1); }
  if (e.key === 'ArrowUp') { e.preventDefault(); play(cur - 1); }
});
allBox.addEventListener('change', render);
unratedBox.addEventListener('change', render);
render();
