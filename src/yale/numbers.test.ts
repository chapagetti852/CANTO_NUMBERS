// The answer key's ground truth. When your teacher corrects something, fix it here
// first, then make numbers.ts pass.
import { describe, expect, it } from 'vitest';
import { contractedForms, fullForm, moneyContracted, moneyFull, formatMoney } from './numbers';
import { applyTone, checkYale, parseDigits } from './check';

const full = (n: number) => fullForm(n).yale;
const con = (n: number) => contractedForms(n).map((r) => r.yale);

describe('full form', () => {
  it.each([
    [0, 'lìhng'],
    [7, 'chāt'],
    [10, 'sahp'],
    [15, 'sahp ńgh'],
    [20, 'yih sahp'],
    [38, 'sāam sahp baat'],
    [100, 'yāt baak'],
    [105, 'yāt baak lìhng ńgh'],
    [110, 'yāt baak yāt sahp'],
    [200, 'léuhng baak'],
    [1005, 'yāt chīn lìhng ńgh'],
    [1500, 'yāt chīn ńgh baak'],
    [2000, 'léuhng chīn'],
    [10000, 'yāt maahn'],
    [12000, 'yāt maahn léuhng chīn'],
    [20000, 'léuhng maahn'],
    [150000, 'sahp ńgh maahn'],
    [10500, 'yāt maahn lìhng ńgh baak'],
  ])('%i → %s', (n, yale) => expect(full(n)).toBe(yale));

  it('builds TTS text', () => {
    expect(fullForm(105).zh).toBe('一百零五');
    expect(fullForm(2000).zh).toBe('兩千');
  });
});

describe('contracted form', () => {
  it.each([
    [21, ['yah yāt']],
    [38, ['sā-ah baat']],
    [45, ['sei-ah ńgh']],
    [99, ['gáu-ah gáu']],
    [120, ['baak yih', 'yāt baak yih']],
    [250, ['léuhng baak ńgh']],
    [1500, ['chīn ńgh', 'yāt chīn ńgh']],
    [12000, ['maahn yih', 'yāt maahn yih']],
  ])('%i → %j', (n, forms) => expect(con(n)).toEqual(forms));

  it.each([20, 30, 15, 105, 125, 7])('%i has no contracted form', (n) => expect(con(n)).toEqual([]));
});

describe('money', () => {
  const yale = (rs: { yale: string }[]) => rs.map((r) => r.yale);
  it('full', () => {
    expect(yale(moneyFull(20))).toContain('léuhng mān');
    expect(yale(moneyFull(32))[0]).toBe('sāam mān léuhng hòuh');
    expect(yale(moneyFull(15))[0]).toBe('yāt mān ńgh hòuh');
    expect(yale(moneyFull(5))).toEqual(['ńgh hòuh']);
  });
  it('contracted', () => {
    expect(yale(moneyContracted(32))[0]).toBe('sāam go yih');
    expect(yale(moneyContracted(15))[0]).toBe('yāt go bun');
    expect(yale(moneyContracted(25))[0]).toBe('léuhng go bun');
    expect(yale(moneyContracted(380))[0]).toBe('sā-ah baat mān');
    expect(yale(moneyContracted(30))).toEqual([]);
  });
  it('formats', () => {
    expect(formatMoney(32)).toBe('$3.20');
    expect(formatMoney(15000)).toBe('$1,500');
  });
});

describe('checking', () => {
  it('ignores spacing, hyphens and case', () => {
    expect(checkYale('SĀ AH BAAT', ['sā-ah baat'])).toBe('correct');
    expect(checkYale('sā-ahbaat', ['sā-ah baat'])).toBe('correct');
  });
  it('accepts decomposed tone marks', () => {
    expect(checkYale('sāam', ['sāam'])).toBe('correct');
  });
  it('separates tone errors from wrong answers', () => {
    expect(checkYale('saam sahp baat', ['sāam sahp baat'])).toBe('tone');
    expect(checkYale('sāam sap baat', ['sāam sahp baat'])).toBe('tone');
    expect(checkYale('sei sahp baat', ['sāam sahp baat'])).toBe('wrong');
  });
  it('parses digits', () => {
    expect(parseDigits('$3.20')).toBe(32);
    expect(parseDigits('3.2')).toBe(32);
    expect(parseDigits('1,500')).toBe(15000);
    expect(parseDigits('abc')).toBeNull();
  });
});

describe('tone buttons', () => {
  it.each([
    ['saam', 1, 'sāam'],
    ['gau', 2, 'gáu'],
    ['sei', 3, 'sei'],
    ['yau', 4, 'yàuh'],
    ['ng', 5, 'ńgh'],
    ['luk', 6, 'luhk'],
    ['leung', 5, 'léuhng'],
    ['m', 4, 'm̀h'],
    ['sāam sap', 6, 'sāam sahp'],
    ['yàuh', 1, 'yāu'],
  ])('%s + tone %i → %s', (text, tone, out) => expect(applyTone(text, tone)).toBe(out.normalize('NFC')));
});
