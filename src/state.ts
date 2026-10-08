// Settings and bests shared across scenes, persisted to localStorage when possible.

export type Mode = 'listen' | 'read';

interface Saved {
  mode: Mode;
  level: number;
  toneButtons: boolean;
  best: Record<string, number>; // "listen-3" → score
}

const KEY = 'canto-numbers-v1';

function load(): Saved {
  const fallback: Saved = { mode: 'read', level: 1, toneButtons: true, best: {} };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
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

/** Records a score; returns true if it beat the previous best. */
export function recordBest(score: number): boolean {
  const k = `${state.mode}-${state.level}`;
  if (score <= (state.best[k] ?? 0)) return false;
  state.best[k] = score;
  save();
  return true;
}

export const COLORS = [0xff2e88, 0x22e6ff, 0xb6ff3b, 0xffd60a, 0x9b5cff, 0xff7a1a];
export const HEX = { ink: '#f4f4ff', hot: '#ff2e88', cyan: '#22e6ff', lime: '#b6ff3b', yellow: '#ffd60a', dim: '#7a78b0' };
