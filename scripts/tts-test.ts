// The risk test: does Azure actually SAY the contracted forms? Writes audio-test/*.mp3.
// Where the TTS spelling is uncertain, several spellings are generated so you can pick by ear.
import { mkdirSync, writeFileSync } from 'node:fs';
import { synthesize } from './azure';

const CASES: [string, string][] = [
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
];

mkdirSync('audio-test', { recursive: true });
for (const [i, [label, zh]] of CASES.entries()) {
  const file = `audio-test/${String(i + 1).padStart(2, '0')} ${label.replace(/[()$/]/g, '')}.mp3`;
  writeFileSync(file, await synthesize(zh));
  console.log('✓', file);
}
