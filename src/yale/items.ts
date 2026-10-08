// Question generation per level. Pools are deterministic so the Azure audio
// script and the game agree on which clips exist.
import {
  contractedForms, formatMoney, fullForms, moneyContracted, moneyFull, type Reading,
} from './numbers';

export type Form = 'full' | 'contracted';

export interface Item {
  id: string;           // also the audio clip filename
  display: string;      // "38" or "$3.20"
  value: number;        // the number, or hòuh for money
  money: boolean;
  form: Form;
  answers: string[];    // accepted Yale, canonical first
  tts: string;          // Chinese text for Azure
}

export const LEVELS = [
  { level: 1, name: '0–99', hint: 'full forms' },
  { level: 2, name: 'Contracted', hint: 'yah yāt, sā-ah baat' },
  { level: 3, name: 'Dollars & 100s', hint: 'léuhng mān, baak yih' },
  { level: 4, name: 'Dollars & cents', hint: 'sāam go yih' },
  { level: 5, name: 'Everything', hint: 'maahn, 1.3× speed' },
] as const;

function make(value: number, money: boolean, form: Form): Item | null {
  const readings: Reading[] = money
    ? form === 'full' ? moneyFull(value) : moneyContracted(value)
    : form === 'full' ? fullForms(value) : contractedForms(value);
  if (!readings.length) return null;
  return {
    id: `${money ? 'm' : 'n'}${value}-${form === 'full' ? 'f' : 'c'}`,
    display: money ? formatMoney(value) : value.toLocaleString('en-US'),
    value,
    money,
    form,
    answers: readings.map((r) => r.yale),
    tts: readings[0].zh,
  };
}

/** Small seeded PRNG so pools are identical on every machine. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function pick<T>(r: () => number, xs: T[]): T {
  return xs[Math.floor(r() * xs.length)];
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** Candidate generators per level; each call returns one item (or null to retry). */
const GEN: Record<number, (r: () => number) => Item | null> = {
  1: (r) => make(pick(r, range(0, 99)), false, 'full'),
  2: (r) => make(pick(r, range(21, 99)), false, 'contracted'),
  3: (r) => {
    const roll = r();
    if (roll < 0.4) {
      const d = pick(r, range(1, 99));
      return make(d * 10, true, r() < 0.5 ? 'contracted' : 'full');
    }
    // Hundreds/thousands, biased toward contractable round numbers.
    const n = r() < 0.5
      ? pick(r, range(1, 9)) * pick(r, [100, 1000]) + pick(r, range(1, 9)) * pick(r, [10, 100])
      : pick(r, range(100, 9999));
    return make(n, false, r() < 0.5 ? 'contracted' : 'full');
  },
  4: (r) => {
    const hauh = pick(r, range(1, 99)) * 10 + pick(r, range(1, 9));
    return make(hauh, true, r() < 0.6 ? 'contracted' : 'full');
  },
  5: (r) => {
    if (r() < 0.3) {
      const n = pick(r, range(1, 9)) * 10000 + pick(r, range(0, 9)) * 1000;
      return make(r() < 0.5 ? n : pick(r, range(11, 99)) * 10000, false, r() < 0.5 ? 'contracted' : 'full');
    }
    return GEN[pick(r, [2, 3, 4])](r);
  },
};

/** Fixed pool of items per level, used for audio clips (Listen mode). */
export function pool(level: number, size = 60): Item[] {
  const r = rng(level * 7919);
  const seen = new Map<string, Item>();
  for (let tries = 0; seen.size < size && tries < size * 50; tries++) {
    const it = GEN[level](r);
    if (it && !seen.has(it.id)) seen.set(it.id, it);
  }
  return [...seen.values()];
}

/** Random item for Read mode, which has no audio and so no pool limit. */
export function randomItem(level: number): Item {
  for (;;) {
    const it = GEN[level](Math.random);
    if (it) return it;
  }
}
