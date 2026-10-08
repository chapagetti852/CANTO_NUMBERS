// Plays part of a Read-mode round: one right answer, one tone mistake, one wrong answer.
const answer = (v) => `(() => { document.getElementById('answer').value = ${v}; document.getElementById('go').click(); return true; })()`;
const G = `game.scene.getScene('Game')`;
const toneless = `${G}.item.answers[0].normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')`;

export default [
  { name: 'menu up', action: 'expect', expect: { expression: `game.scene.isActive('Menu')`, equals: true } },
  { name: 'menu', action: 'screenshot' },
  { name: 'start level 4', action: 'expect', expect: { expression: `(() => { const m = game.scene.getScene('Menu'); m.start(4); return true; })()` } },
  { name: 'settle', action: 'wait', ms: 500 },
  { name: 'game up', action: 'expect', expect: { expression: `game.scene.isActive('Game')`, equals: true } },
  { name: 'prompt', action: 'screenshot' },
  { name: 'right answer', action: 'expect', expect: { expression: answer(`${G}.item.answers[0].toUpperCase()`) } },
  { name: 'scored', action: 'expect', expect: { expression: `${G}.score`, atLeast: 40 } },
  { name: 'burst', action: 'screenshot' },
  { name: 'next item', action: 'wait', ms: 600 },
  { name: 'tone mistake (if item has tones)', action: 'expect', expect: { expression: answer(`(${toneless} === ${G}.item.answers[0] ? 'zzz' : ${toneless})`) } },
  { name: 'reveal shown', action: 'expect', expect: { expression: `${G}.reveal.text.length > 0`, equals: true } },
  { name: 'streak reset', action: 'expect', expect: { expression: `${G}.streak`, equals: 0 } },
  { name: 'miss', action: 'screenshot' },
  { name: 'reveal ends', action: 'wait', ms: 1800 },
  { name: 'finish', action: 'expect', expect: { expression: `(() => { ${G}.finish(); return true; })()` } },
  { name: 'settle2', action: 'wait', ms: 900 },
  { name: 'results up', action: 'expect', expect: { expression: `game.scene.isActive('Results')`, equals: true } },
  { name: 'results', action: 'screenshot' },
];
