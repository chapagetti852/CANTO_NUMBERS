// Generates the Listen-mode audio: one clip per item in each level's pool.
// Voices rotate female / male so you hear both. Re-running only renders what changed
// (the filename includes the voice and a hash of the TTS text) and deletes stale clips.
//   npm run tts:clips
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { LEVELS, pool } from '../src/yale/items';
import { synthesize, VOICES } from './azure';

const DIR = 'public/assets/audio/clips';
const ROTATION = [VOICES[0], VOICES[1], VOICES[2], VOICES[1]]; // F, M, F, M

mkdirSync(DIR, { recursive: true });
const manifest: Record<string, string> = {};
const items = LEVELS.flatMap((l) => pool(l.level));
let made = 0;

for (const [i, it] of items.entries()) {
  if (manifest[it.id]) continue; // same item can appear in two levels' pools
  const voice = ROTATION[i % ROTATION.length];
  const hash = createHash('sha1').update(`${voice}|${it.tts}`).digest('hex').slice(0, 8);
  const file = `${it.id}-${voice.split('-')[2].replace('Neural', '').toLowerCase()}-${hash}.mp3`;
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
console.log(`\nDone: ${Object.keys(manifest).length} clips, ${made} new, ${stale.length} stale removed.`);
