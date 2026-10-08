// Plays part of a Read-mode round: one right answer, one tone mistake, one wrong answer.
const answer = (v) => `(() => { document.getElementById('answer').value = ${v}; document.getElementById('go').click(); return true; })()`;
const G = `game.scene.getScene('Game')`;
const toneless = `${G}.item.answers[0].normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')`;

export default [
  { name: 'menu up', action: 'expect', expect: { expression: `game.scene.isActive('Menu')`, equals: true } },
  { name: 'menu', action: 'screenshot' },
  { name: 'pick read', action: 'expect', expect: { expression: `(() => { game.scene.getScene('Menu').pick('read'); return true; })()` } },
  { name: 'levels settle', action: 'wait', ms: 300 },
  { name: 'levels', action: 'screenshot' },
  { name: 'start level 4', action: 'expect', expect: { expression: `(() => { game.scene.getScene('Levels').start(4); return true; })()` } },
  { name: 'settle', action: 'wait', ms: 500 },
  { name: 'game up', action: 'expect', expect: { expression: `game.scene.isActive('Game')`, equals: true } },
  { name: 'prompt', action: 'screenshot' },
  { name: 'right answer', action: 'expect', expect: { expression: answer(`${G}.item.answers[0].toUpperCase()`) } },
  { name: 'scored', action: 'expect', expect: { expression: `${G}.score`, atLeast: 40 } },
  { name: 'burst', action: 'screenshot' },
  { name: 'next item', action: 'wait', ms: 600 },
  { name: 'tone mistake (if item has tones)', action: 'expect', expect: { expression: answer(`(${toneless} === ${G}.item.answers[0] ? 'zzz' : ${toneless})`) } },
  { name: 'review shown', action: 'expect', expect: { expression: `${G}.reviewing && ${G}.reviewObjs.length > 2`, equals: true } },
  { name: 'clock paused', action: 'expect', expect: { expression: `${G}.paused`, equals: true } },
  { name: 'streak reset', action: 'expect', expect: { expression: `${G}.streak`, equals: 0 } },
  { name: 'miss', action: 'screenshot' },
  { name: 'still reviewing later', action: 'wait', ms: 2500 },
  { name: 'review waits for NEXT', action: 'expect', expect: { expression: `${G}.reviewing`, equals: true } },
  { name: 'press NEXT', action: 'expect', expect: { expression: `(() => { document.getElementById('go').click(); return true; })()` } },
  { name: 'moved on', action: 'expect', expect: { expression: `!${G}.reviewing && !${G}.paused`, equals: true } },
  { name: 'finish', action: 'expect', expect: { expression: `(() => { ${G}.finish(); return true; })()` } },
  { name: 'settle2', action: 'wait', ms: 900 },
  { name: 'results up', action: 'expect', expect: { expression: `game.scene.isActive('Results')`, equals: true } },
  { name: 'results', action: 'screenshot' },
];
