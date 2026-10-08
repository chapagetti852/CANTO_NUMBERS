// Listen mode: Azure clips play, digit answers score, money accepts "3.20"-style input.
// Uses window.__PHASER_GAME__ because the page reloads (the harness's `game` would be stale).
const G = `window.__PHASER_GAME__.scene.getScene('Game')`;
const digits = `(${G}.item.money ? (${G}.item.value / 10).toFixed(${G}.item.value % 10 ? 2 : 0) : String(${G}.item.value))`;
const answer = (v) => `(() => { document.getElementById('answer').value = ${v}; document.getElementById('go').click(); return true; })()`;
const clipsFetched = `performance.getEntriesByType('resource').filter(e => e.name.includes('/assets/audio/clips/')).length`;

export default [
  { name: 'switch to listen + reload', action: 'expect', expect: { expression: `(() => { localStorage.setItem('canto-numbers-v1', JSON.stringify({ mode: 'listen', level: 4 })); setTimeout(() => location.reload(), 0); return true; })()` } },
  { name: 'reload', action: 'wait', ms: 3000 },
  { name: 'start level 4', action: 'expect', expect: { expression: `(() => { window.__PHASER_GAME__.scene.getScene('Menu').start(4); return true; })()` } },
  { name: 'w', action: 'wait', ms: 800 },
  { name: 'in listen mode', action: 'expect', expect: { expression: `${G}.listen`, equals: true } },
  { name: 'pool uses generated clips', action: 'expect', expect: { expression: `${G}.listenPool.length`, atLeast: 50 } },
  { name: 'clip fetched', action: 'expect', expect: { expression: clipsFetched, atLeast: 1 } },
  { name: 'answer in digits', action: 'expect', expect: { expression: answer(digits) } },
  { name: 'scored', action: 'expect', expect: { expression: `${G}.score`, atLeast: 40 } },
  { name: 'reveal shows yale', action: 'expect', expect: { expression: `${G}.reveal.text.length > 0`, equals: true } },
  { name: 'w2', action: 'wait', ms: 900 },
  { name: 'second clip fetched', action: 'expect', expect: { expression: clipsFetched, atLeast: 2 } },
  { name: 'wrong answer', action: 'expect', expect: { expression: answer(`'0.01'`) } },
  { name: 'streak reset', action: 'expect', expect: { expression: `${G}.streak`, equals: 0 } },
];
