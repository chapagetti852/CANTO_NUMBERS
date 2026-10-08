// Number → Yale (with tone marks) and → Chinese text for Azure TTS.
// Every rule here is a claim about Cantonese: verify against CLA materials, and
// add a test in numbers.test.ts whenever a rule changes.

const YALE_DIGITS = ['lìhng', 'yāt', 'yih', 'sāam', 'sei', 'ńgh', 'luhk', 'chāt', 'baat', 'gáu'];
const ZH_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

// Contracted tens (21–99): 廿 yah, then "N-ah" for 30–90. 三 loses its -m: sā-ah.
const YALE_TENS_CONTRACTED: Record<number, string> = {
  2: 'yah', 3: 'sā-ah', 4: 'sei-ah', 5: 'ńgh-ah', 6: 'luhk-ah', 7: 'chāt-ah', 8: 'baat-ah', 9: 'gáu-ah',
};
// TTS spelling of the same, chosen by ear from Azure test clips (npm run tts:test).
// Round 1: 卅 good (三呀 came out "mah"), 四呀 good (卌 bad), 九呀 came out "lah".
// 60–90 pending round 2. This table is the one place to change.
const ZH_TENS_CONTRACTED: Record<number, string> = {
  2: '廿', 3: '卅', 4: '四呀', 5: '五呀', 6: '六呀', 7: '七呀', 8: '八呀', 9: '九呀',
};

export interface Reading {
  yale: string;
  zh: string;
}

/** léuhng (兩) instead of yih before baak / chīn / maahn and measure words. */
function twoWord(d: number): Reading {
  return d === 2 ? { yale: 'léuhng', zh: '兩' } : { yale: YALE_DIGITS[d], zh: ZH_DIGITS[d] };
}

/** Full reading of 0 ≤ n ≤ 9999. `leading` = this is the start of the whole number. */
function fullSection(n: number, leading: boolean): Reading {
  if (n === 0) return { yale: YALE_DIGITS[0], zh: ZH_DIGITS[0] };
  const places = [
    { d: Math.floor(n / 1000), y: 'chīn', z: '千' },
    { d: Math.floor(n / 100) % 10, y: 'baak', z: '百' },
    { d: Math.floor(n / 10) % 10, y: 'sahp', z: '十' },
    { d: n % 10, y: '', z: '' },
  ];
  const yale: string[] = [];
  let zh = '';
  let started = false;
  let pendingZero = false;
  places.forEach((p, i) => {
    if (p.d === 0) {
      if (started) pendingZero = true;
      return;
    }
    if (pendingZero) {
      yale.push(YALE_DIGITS[0]);
      zh += ZH_DIGITS[0];
      pendingZero = false;
    }
    if (i === 2 && p.d === 1 && !started && leading) {
      // 10–19 at the very start: "sahp X", not "yāt sahp X".
      yale.push('sahp');
      zh += '十';
    } else if (i < 2) {
      const w = twoWord(p.d);
      yale.push(w.yale, p.y);
      zh += w.zh + p.z;
    } else {
      yale.push(YALE_DIGITS[p.d]);
      zh += ZH_DIGITS[p.d];
      if (p.y) {
        yale.push(p.y);
        zh += p.z;
      }
    }
    started = true;
  });
  return { yale: yale.join(' '), zh };
}

/** Full form, 0 ≤ n ≤ 99,999,999. */
export function fullForm(n: number): Reading {
  if (n < 10000) return fullSection(n, true);
  const high = Math.floor(n / 10000);
  const low = n % 10000;
  const h = high === 2 ? twoWord(2) : fullSection(high, true);
  let yale = `${h.yale} maahn`;
  let zh = `${h.zh}萬`;
  if (low > 0) {
    const l = fullSection(low, false);
    const gap = low < 1000;
    yale += (gap ? ` ${YALE_DIGITS[0]} ` : ' ') + l.yale;
    zh += (gap ? ZH_DIGITS[0] : '') + l.zh;
  }
  return { yale, zh };
}

/**
 * Contracted forms, or [] if this number has none.
 * - 21–99 with a non-zero unit: yah yāt, sā-ah baat
 * - X·100 + Y·10 (Y≠0): (yāt) baak Y, léuhng baak ńgh
 * - X·1000 + Y·100: (yāt) chīn Y
 * - X·10000 + Y·1000: (yāt) maahn Y
 * The first entry is the canonical answer; others are accepted variants.
 */
export function contractedForms(n: number): Reading[] {
  if (n >= 21 && n <= 99 && n % 10 !== 0) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return [{ yale: `${YALE_TENS_CONTRACTED[t]} ${YALE_DIGITS[u]}`, zh: ZH_TENS_CONTRACTED[t] + ZH_DIGITS[u] }];
  }
  const units = [
    { size: 100, y: 'baak', z: '百' },
    { size: 1000, y: 'chīn', z: '千' },
    { size: 10000, y: 'maahn', z: '萬' },
  ];
  for (const u of units) {
    const head = Math.floor(n / u.size);
    const next = (n % u.size) / (u.size / 10);
    if (head >= 1 && head <= 9 && Number.isInteger(next) && next >= 1 && next <= 9) {
      const tail = { yale: YALE_DIGITS[next], zh: ZH_DIGITS[next] };
      if (head === 1) {
        return [
          { yale: `${u.y} ${tail.yale}`, zh: u.z + tail.zh },
          { yale: `yāt ${u.y} ${tail.yale}`, zh: '一' + u.z + tail.zh },
        ];
      }
      const h = twoWord(head);
      return [{ yale: `${h.yale} ${u.y} ${tail.yale}`, zh: h.zh + u.z + tail.zh }];
    }
  }
  return [];
}

/** Accepted full-form variants (yih in place of léuhng before baak/chīn is heard too). */
export function fullForms(n: number): Reading[] {
  const canonical = fullForm(n);
  const out = [canonical];
  if (/^léuhng (baak|chīn)/.test(canonical.yale)) {
    out.push({ yale: canonical.yale.replace(/^léuhng/, 'yih'), zh: canonical.zh.replace(/^兩/, '二') });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Money. Amounts are in hòuh (毫, 10 cents), so $3.20 = 32.

/** Dollar part read as a number + mān, e.g. "léuhng mān", "sā-ah baat mān". */
function dollarReadings(dollars: number, contracted: boolean): Reading[] {
  const nums = contracted && contractedForms(dollars).length ? contractedForms(dollars) : fullForms(dollars);
  return nums.map((r) => (dollars === 2 ? { yale: 'léuhng', zh: '兩' } : r));
}

export function moneyFull(hauh: number): Reading[] {
  const d = Math.floor(hauh / 10);
  const h = hauh % 10;
  const hauhPart = h ? twoWord(h) : null;
  if (d === 0) return hauhPart ? [{ yale: `${hauhPart.yale} hòuh`, zh: `${hauhPart.zh}毫` }] : [];
  return dollarReadings(d, false).map((r) => ({
    yale: `${r.yale} mān` + (hauhPart ? ` ${hauhPart.yale} hòuh` : ''),
    zh: `${r.zh}蚊` + (hauhPart ? `${hauhPart.zh}毫` : ''),
  }));
}

/** Contracted money, or [] if nothing contracts. $3.20 → sāam go yih, $1.50 → yāt go bun. */
export function moneyContracted(hauh: number): Reading[] {
  const d = Math.floor(hauh / 10);
  const h = hauh % 10;
  if (d === 0) return [];
  if (h === 0) {
    if (!contractedForms(d).length) return [];
    return dollarReadings(d, true).map((r) => ({ yale: `${r.yale} mān`, zh: `${r.zh}蚊` }));
  }
  const out: Reading[] = [];
  for (const r of [...dollarReadings(d, true), ...dollarReadings(d, false)]) {
    if (h === 5) {
      out.push({ yale: `${r.yale} go bun`, zh: `${r.zh}個半` });
      out.push({ yale: `${r.yale} mān bun`, zh: `${r.zh}蚊半` });
    } else {
      out.push({ yale: `${r.yale} go ${YALE_DIGITS[h]}`, zh: `${r.zh}個${ZH_DIGITS[h]}` });
    }
  }
  // Dedupe while keeping the canonical first.
  return out.filter((r, i) => out.findIndex((o) => o.yale === r.yale) === i);
}

export function formatMoney(hauh: number): string {
  const d = Math.floor(hauh / 10);
  const h = hauh % 10;
  return h ? `$${d}.${h}0` : `$${d.toLocaleString('en-US')}`;
}
