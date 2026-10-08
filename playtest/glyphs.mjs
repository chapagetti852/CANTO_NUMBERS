export default [
  { name: 'draw', action: 'expect', expect: { expression: `(() => { const s = game.scene.getScene('Menu'); s.children.removeAll(); ['SĀAM GÁU LÌHNG ŃGH', 'sāam gáu lìhng ńgh', 'M̀H NGĀAM YÀUH'.normalize('NFC'), 'LÉUHNG HÒUH'].forEach((t, i) => s.add.text(10, 40 + i * 60, t, { fontFamily: 'Silkscreen', fontSize: '24px', color: '#fff' })); return true; })()` } },
  { name: 'wait', action: 'wait', ms: 300 },
  { name: 'glyphs', action: 'screenshot' },
];
