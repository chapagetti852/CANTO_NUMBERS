// Generates the Listen-mode audio: one clip per item in each level's pool.
// Voices rotate female / male so you hear both. Re-running only renders what changed
// (the filename includes the voice and a hash of the TTS text) and deletes stale clips.
// Clips marked bad on review.html (scripts/clip-review.json) are re-rendered: first with a
// slightly longer pause before the contracted "ah", then in another voice. An item that is bad
// in every variant is left out of Listen mode.
// Why: review 1 flagged 44/140 contracted clips, 42 of them 7x/8x/9x ("nah"/"lah": the voice
// runs the "ah" into the previous syllable). Test round 4: 25ms is always clean but audibly a
// little long; 50ms+ sounds robotic. So 20ms stays the default and 25ms is the fallback.
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

/** The TTS text as generated, then with the fallback pause before the contracted 呀. */
function ttsVariants(tts: string): string[] {
  if (!tts.includes('呀')) return [tts];
  const bare = tts.replace(/<break time="\d+ms"\/>呀/g, '呀');
  return [...new Set([tts, bare.replace(/呀/g, '<break time="25ms"/>呀')])];
}

for (const [i, it] of items.entries()) {
  if (manifest[it.id] || dropped.includes(it.id)) continue; // same item can appear in two levels' pools
  const first = ROTATION[i % ROTATION.length];
  const voices = [first, ...VOICES.filter((v) => v !== first)];
  const candidates = voices.flatMap((voice) => ttsVariants(it.tts).map((tts) => ({ voice, tts })));
  const pick = candidates.find((c) => verdicts[fileFor(it.id, c.voice, c.tts)] !== 'bad');
  if (!pick) {
    dropped.push(it.id);
    continue;
  }
  const { voice, tts } = pick;
  const file = fileFor(it.id, voice, tts);
  manifest[it.id] = file;
  if (existsSync(`${DIR}/${file}`)) continue;
  writeFileSync(`${DIR}/${file}`, await synthesize(tts, voice));
  made++;
  process.stdout.write(`\r${made} new clips (${i + 1}/${items.length}) ${it.display.padEnd(10)} ${tts}      `);
}

const keep = new Set(Object.values(manifest));
const stale = readdirSync(DIR).filter((f) => f.endsWith('.mp3') && !keep.has(f));
stale.forEach((f) => unlinkSync(`${DIR}/${f}`));
writeFileSync('public/assets/audio/manifest.json', JSON.stringify(manifest, null, 1) + '\n');
console.log(`\nDone: ${Object.keys(manifest).length} clips, ${made} new, ${stale.length} stale removed, ${dropped.length} dropped (bad in every voice).`);
