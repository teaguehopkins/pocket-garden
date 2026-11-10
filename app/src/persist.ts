// Saves: the run after every action, and the profile. Versioned; unreadable saves are dropped.
import { emptyProfile, type Profile } from './core/profile';
import type { RunState } from './core/run';

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const RUN_KEY = 'pg3-run';
const PROFILE_KEY = 'pg3-profile';
const OLD_PROFILE_KEY = 'pg2-profile';

function read<T>(kv: KV, k: string): T | null {
  try {
    const raw = kv.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(kv: KV, k: string, v: unknown) {
  try {
    kv.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full or blocked: play continues unsaved */
  }
}

export function saveRun(kv: KV, s: RunState | null) {
  if (!s) {
    try { kv.removeItem(RUN_KEY); } catch { /* ignore */ }
    return;
  }
  write(kv, RUN_KEY, { v: 1, state: s });
}

export function loadRun(kv: KV): RunState | null {
  const d = read<{ v: number; state: RunState }>(kv, RUN_KEY);
  if (!d || d.v !== 1 || !d.state || d.state.v !== 1 || !Array.isArray(d.state.grid)) return null;
  return d.state;
}

export function loadProfile(kv: KV): Profile {
  const p = read<Profile>(kv, PROFILE_KEY);
  if (p && p.v === 1) {
    // Older saves predate the Lane and Almanac; anyone who has played skips the teaching garden.
    const merged = { ...emptyProfile(), ...p };
    if (p.tutorialDone === undefined) merged.tutorialDone = (p.runs ?? 0) > 0;
    return merged;
  }
  // One-time migration from the v5 prototype.
  const old = read<{ runs?: number; years?: number; best?: number; rank?: number; stars?: number }>(kv, OLD_PROFILE_KEY);
  const fresh = emptyProfile();
  if (old) {
    fresh.tutorialDone = (old.runs ?? 0) > 0;
    fresh.runs = old.runs ?? 0;
    fresh.years = old.years ?? 0;
    fresh.best = old.best ?? 0;
    fresh.rank = old.rank ?? 1;
    fresh.stars = old.stars ?? 0;
  }
  write(kv, PROFILE_KEY, fresh);
  return fresh;
}

export const saveProfile = (kv: KV, p: Profile) => write(kv, PROFILE_KEY, p);

/** Ask the browser not to evict our storage. Best effort. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* unsupported */
  }
}
