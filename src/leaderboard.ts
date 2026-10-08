// Leaderboard via Supabase's REST API (PostgREST). Table + policies: supabase/scores.sql.
import type { Mode } from './state';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface Entry {
  name: string;
  score: number;
}

export const leaderboardEnabled = Boolean(URL && KEY);

const headers = () => ({ apikey: KEY!, 'Content-Type': 'application/json' });

export async function topScores(mode: Mode, level: number, limit = 8): Promise<Entry[]> {
  if (!leaderboardEnabled) return [];
  const q = `mode=eq.${mode}&level=eq.${level}&select=name,score&order=score.desc,created_at.asc&limit=${limit}`;
  const res = await fetch(`${URL}/rest/v1/scores?${q}`, { headers: headers() });
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  return res.json();
}

export async function postScore(name: string, mode: Mode, level: number, score: number, correct: number): Promise<void> {
  if (!leaderboardEnabled) return;
  const res = await fetch(`${URL}/rest/v1/scores`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify({ name, mode, level, score, correct }),
  });
  if (!res.ok) throw new Error(`leaderboard ${res.status}: ${await res.text()}`);
}

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 16);
}
