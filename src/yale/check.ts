// Answer checking and tone-button editing for Yale input.

/** Lowercase, NFC, and drop spaces / hyphens / apostrophes. */
export function normalizeYale(s: string): string {
  return s.normalize('NFC').toLowerCase().replace(/[\s\-'’]/g, '');
}

/**
 * Strip tone information: diacritics and every "h". Both sides get the same
 * transform, so this only answers "same syllables, ignoring tones?".
 */
function toneless(s: string): string {
  return normalizeYale(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/h/g, '');
}

export type YaleVerdict = 'correct' | 'tone' | 'wrong';

export function checkYale(input: string, accepted: string[]): YaleVerdict {
  const n = normalizeYale(input);
  if (!n) return 'wrong';
  if (accepted.some((a) => normalizeYale(a) === n)) return 'correct';
  if (accepted.some((a) => toneless(a) === toneless(input))) return 'tone';
  return 'wrong';
}

/** Digits answer for Listen mode. Accepts "3.2", "3.20", "$3.20", "1,500". Value in hòuh. */
export function parseDigits(input: string): number | null {
  const s = input.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 10);
}

// ---------------------------------------------------------------------------
// Tone buttons. Yale marks the first vowel of the syllable; low tones (4–6) add
// an "h" after the vowel cluster: sāam, gáu, sei, yàuh, ńgh, luhk.

const MARKS: Record<number, string> = { 1: '̄', 2: '́', 3: '', 4: '̀', 5: '́', 6: '' };
const VOWELS = 'aeiou';

/** Apply tone 1–6 to the last syllable of `text` (syllables split on space/hyphen). */
export function applyTone(text: string, tone: number): string {
  const m = text.match(/^(.*[\s\-])?([^\s\-]*)$/s);
  const prefix = m?.[1] ?? '';
  const syllable = m?.[2] ?? '';
  if (!syllable) return text;

  // Work on bare letters: strip existing marks, and the tone "h" after the vowels.
  let bare = syllable.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const firstVowel = [...bare].findIndex((c) => VOWELS.includes(c));
  let markAt: number;
  let hAt: number;
  if (firstVowel === -1) {
    // Syllabic nasal: m, ng (m̀h, ńgh). Mark the first letter, h at the end.
    bare = bare.replace(/h$/, '');
    markAt = 0;
    hAt = bare.length;
  } else {
    let end = firstVowel;
    while (end < bare.length && VOWELS.includes(bare[end])) end++;
    if (bare[end] === 'h' && end > 0) bare = bare.slice(0, end) + bare.slice(end + 1);
    markAt = firstVowel;
    hAt = end;
  }
  const low = tone >= 4;
  let out = '';
  for (let i = 0; i <= bare.length; i++) {
    if (i === hAt && low) out += 'h';
    if (i < bare.length) out += bare[i] + (i === markAt ? MARKS[tone] : '');
  }
  return (prefix + out).normalize('NFC');
}
