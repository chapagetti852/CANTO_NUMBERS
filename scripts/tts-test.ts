// The risk test: does Azure actually SAY the contracted forms? Writes audio-test/<round>/*.mp3.
// Where the TTS spelling is uncertain, several spellings are generated so you can pick by ear.
import { mkdirSync, writeFileSync } from 'node:fs';
import { synthesize, VOICES } from './azure';

type Case = [label: string, zh: string, voice?: string];

const ROUNDS: Record<string, Case[]> = {
  // Round 1 result: 卅 good (三呀 → "mah"), 四呀 good (卌 bad), 九呀 → "lah".
  round1: [
    ['yah yāt (21)', '廿一'],
    ['sā-ah baat mān (38) A', '卅八蚊'],
    ['sā-ah baat mān (38) B', '三呀八蚊'],
    ['sāam sahp baat mān (38 full, for comparison)', '三十八蚊'],
    ['sei-ah ńgh (45) A', '卌五'],
    ['sei-ah ńgh (45) B', '四呀五'],
    ['ńgh-ah luhk (56)', '五呀六'],
    ['gáu-ah gáu (99)', '九呀九'],
    ['sāam go yih ($3.20)', '三個二'],
    ['yāt go bun ($1.50)', '一個半'],
    ['léuhng mān ($2)', '兩蚊'],
    ['baak yih (120)', '百二'],
    ['chīn ńgh (1500)', '千五'],
    ['maahn yih (12000)', '萬二'],
    ['yāt baak lìhng ńgh (105)', '一百零五'],
  ],
  // Round 2: which spelling of the "-ah" syllable works for 60–90?
  round2: [
    ...([[6, '六', 'luhk', 3, '三', 'sāam'], [7, '七', 'chāt', 4, '四', 'sei'], [8, '八', 'baat', 2, '二', 'yih'], [9, '九', 'gáu', 7, '七', 'chāt']] as const)
      .flatMap(([t, tz, ty, u, uz, uy]) =>
        (['呀', '啊', '亞'] as const).map((ah, i): Case =>
          [`${ty}-ah ${uy} (${t}${u}) ${'ABC'[i]}`, `${tz}${ah}${uz}`])),
    ['MALE sā-ah baat mān (38)', '卅八蚊', VOICES[1]],
    ['MALE sei-ah ńgh (45)', '四呀五', VOICES[1]],
  ],
};

const round = process.argv[2] ?? 'round2';
const dir = `audio-test/${round}`;
mkdirSync(dir, { recursive: true });
for (const [i, [label, zh, voice]] of ROUNDS[round].entries()) {
  const file = `${dir}/${String(i + 1).padStart(2, '0')} ${label.replace(/[()$/]/g, '')}.mp3`;
  writeFileSync(file, await synthesize(zh, voice));
  console.log('✓', file);
}
