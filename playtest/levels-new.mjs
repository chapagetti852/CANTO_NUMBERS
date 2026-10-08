// Big numbers (5) and Decimals & % (6) in Read mode: right answers score, misses show a review.
const G = `game.scene.getScene('Game')`;
const answer = (v) => `(() => { document.getElementById('answer').value = ${v}; document.getElementById('go').click(); return true; })()`;
const start = (lv) => `(() => { const m = game.scene.getScene('Menu'); m.pick('read'); setTimeout(() => game.scene.getScene('Levels').start(${lv}), 100); return true; })()`;

export default [
  { name: 'levels list', action: 'expect', expect: { expression: `(() => { game.scene.getScene('Menu').pick('read'); return true; })()` } },
  { name: 'w0', action: 'wait', ms: 300 },
  { name: 'levels', action: 'screenshot' },
  { name: 'start lv5', action: 'expect', expect: { expression: `(() => { game.scene.getScene('Levels').start(5); return true; })()` } },
  { name: 'w1', action: 'wait', ms: 500 },
  { name: 'big prompt', action: 'screenshot' },
  { name: '9 digits fit', action: 'expect', expect: { expression: `${G}.setPrompt('123,456,789').width`, atMost: 336 } },
  { name: 'restore prompt', action: 'expect', expect: { expression: `(${G}.setPrompt(${G}.item.display), true)` } },
  { name: 'right', action: 'expect', expect: { expression: answer(`${G}.item.answers[0]`) } },
  { name: 'scored 50', action: 'expect', expect: { expression: `${G}.score`, atLeast: 50 } },
  { name: 'w2', action: 'wait', ms: 500 },
  { name: 'miss', action: 'expect', expect: { expression: answer(`'yāt'`) } },
  { name: 'reviewing', action: 'expect', expect: { expression: `${G}.reviewing`, equals: true } },
  { name: 'big review', action: 'screenshot' },
  { name: 'quit', action: 'expect', expect: { expression: `(() => { ${G}.finish(); return true; })()` } },
  { name: 'w3', action: 'wait', ms: 400 },
  { name: 'start lv6', action: 'expect', expect: { expression: `(() => { game.scene.getScene('Results').scene.start('Levels'); setTimeout(() => game.scene.getScene('Levels').start(6), 100); return true; })()` } },
  { name: 'w4', action: 'wait', ms: 600 },
  { name: 'decimal prompt', action: 'screenshot' },
  { name: 'right 6', action: 'expect', expect: { expression: answer(`${G}.item.answers[0]`) } },
  { name: 'scored 60', action: 'expect', expect: { expression: `${G}.score`, atLeast: 60 } },
];
