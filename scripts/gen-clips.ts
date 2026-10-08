// Generates the Listen-mode audio: one clip per item in each level's pool.
// Voices rotate female / male so you hear both. Re-running only renders what changed
// (the filename includes the voice and a hash of the TTS text) and deletes stale clips.
// Clips marked bad on review.html (scripts/clip-review.json) are re-voiced; an item that is
// bad in every voice is left out of Listen mode.
//   npm run tts:clips
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { LEVELS, pool } from '../src/yale/items';
import { synthesize, VOICES } from './azure';

const DIR = 'public/assets/audio/clips';
const ROTATION = [VOICES[0], VOICES[1], VOICES[2], VOICES[1]]; // F, M, F, M

const REVIEW = 'scripts/clip-review.json';
const verdicts: Record<string, 'good' | 'bad'> = existsSync(REVIEW) ? JSON.parse(readFileSync(REVIEW, 'utf8')) : {};

function fileFor(id: string, voice: string, tts: string): string {
  const hash = createHash('sha1').update(`${voice}|${tts}`).digest('hex').slice(0, 8);
  return `${id}-${voice.split('-')[2].replace('Neural', '').toLowerCase()}-${hash}.mp3`;
}

mkdirSync(DIR, { recursive: true });
const manifest: Record<string, string> = {};
const items = LEVELS.flatMap((l) => pool(l.level));
const dropped: string[] = [];
let made = 0;

for (const [i, it] of items.entries()) {
  if (manifest[it.id] || dropped.includes(it.id)) continue; // same item can appear in two levels' pools
  const first = ROTATION[i % ROTATION.length];
  const voices = [first, ...VOICES.filter((v) => v !== first)];
  const voice = voices.find((v) => verdicts[fileFor(it.id, v, it.tts)] !== 'bad');
  if (!voice) {
    dropped.push(it.id);
    continue;
  }
  const file = fileFor(it.id, voice, it.tts);
  manifest[it.id] = file;
  if (existsSync(`${DIR}/${file}`)) continue;
  writeFileSync(`${DIR}/${file}`, await synthesize(it.tts, voice));
  made++;
  process.stdout.write(`\r${made} new clips (${i + 1}/${items.length}) ${it.display.padEnd(10)} ${it.tts}      `);
}

const keep = new Set(Object.values(manifest));
const stale = readdirSync(DIR).filter((f) => f.endsWith('.mp3') && !keep.has(f));
stale.forEach((f) => unlinkSync(`${DIR}/${f}`));
writeFileSync('public/assets/audio/manifest.json', JSON.stringify(manifest, null, 1) + '\n');
console.log(`\nDone: ${Object.keys(manifest).length} clips, ${made} new, ${stale.length} stale removed, ${dropped.length} dropped (bad in every voice).`);
