// Settings and bests shared across scenes, persisted to localStorage when possible.

export type Mode = 'listen' | 'read';

interface Saved {
  mode: Mode;
  level: number;
  tiles: boolean;        // syllable tile keyboard in Read mode (else type)
  muted: boolean;        // music + sfx (number clips always play)
  name: string;
  best: Record<string, number>; // "listen-3" → score
  v?: number;                    // save format version
}

const KEY = 'canto-numbers-v1';

function load(): Saved {
  const fallback: Saved = { mode: 'read', level: 1, tiles: true, muted: false, name: '', best: {}, v: 2 };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<Saved>;
    // v1 → v2: "Mix it up" moved from level 5 to level 7 (Big numbers and Decimals are now 5 and 6).
    if (!saved.v) {
      for (const mode of ['listen', 'read']) {
        const old = saved.best?.[`${mode}-5`];
        if (old !== undefined && saved.best) {
          saved.best[`${mode}-7`] = old;
          delete saved.best[`${mode}-5`];
        }
      }
      if (saved.level === 5) saved.level = 7;
      saved.v = 2;
    }
    return { ...fallback, ...saved };
  } catch {
    return fallback;
  }
}

export const state = load();

export function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode etc.: settings just won't persist.
  }
}

/** Hasn't finished a round yet: steer them to Listen, level 1. */
export function isNewPlayer(): boolean {
  return Object.keys(state.best).length === 0;
}

/** Records a score; returns true if it beat the previous best. */
export function recordBest(score: number): boolean {
  const k = `${state.mode}-${state.level}`;
  if (score <= (state.best[k] ?? 0)) return false;
  state.best[k] = score;
  save();
  return true;
}

// Hong Kong flag red and bauhinia white, with neon-sign gold and bauhinia-flower pinks.
export const PAL = {
  bg: 0x14060a, track: 0x3d1219, red: 0xe8112d, deep: 0x9e0b1f,
  white: 0xfff4ef, gold: 0xffc23d, rose: 0xff6b93, coral: 0xff8a5c,
};
export const COLORS = [PAL.red, PAL.white, PAL.gold, PAL.rose, PAL.coral, PAL.deep];
export const HEX = { bg: '#14060a', ink: '#fff4ef', red: '#ff2a44', rose: '#ff6b93', gold: '#ffc23d', dim: '#b0848a' };
