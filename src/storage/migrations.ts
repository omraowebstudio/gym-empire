import { ECONOMY } from '../game/config/economy';
import { createInitialState } from '../game/state';
import type { GameState } from '../game/types';

export const CURRENT_SAVE_VERSION: number = ECONOMY.save.version;

type AnySave = Record<string, unknown>;

/**
 * Ordered migrations: MIGRATIONS[n] upgrades a save from version n to n + 1.
 * Add a new entry (and bump ECONOMY.save.version) whenever the save shape changes.
 */
export const MIGRATIONS: Record<number, (data: AnySave) => AnySave> = {
  // Version 0 = pre-release prototype saves that stored `money` instead of `cash`.
  0: (data) => {
    const next = { ...data };
    if (typeof next.money === 'number' && typeof next.cash !== 'number') next.cash = next.money;
    delete next.money;
    next.version = 1;
    return next;
  },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Fills any fields missing from `loaded` using `defaults`, recursively for plain objects. */
export function mergeDefaults<T>(defaults: T, loaded: unknown): T {
  if (loaded === undefined) return defaults;
  if (isPlainObject(defaults) && isPlainObject(loaded)) {
    const out: Record<string, unknown> = { ...loaded };
    for (const [k, dv] of Object.entries(defaults)) {
      out[k] = mergeDefaults(dv, loaded[k]);
    }
    return out as T;
  }
  if (defaults !== null && loaded !== null && typeof defaults !== typeof loaded) return defaults;
  return loaded as T;
}

export function migrateSave(data: AnySave, now: number): GameState {
  let current = { ...data };
  let version = typeof current.version === 'number' ? current.version : 0;
  if (version > CURRENT_SAVE_VERSION) {
    throw new Error(`Save version ${version} is newer than this app (${CURRENT_SAVE_VERSION})`);
  }
  while (version < CURRENT_SAVE_VERSION) {
    const m = MIGRATIONS[version];
    if (!m) throw new Error(`Missing migration from version ${version}`);
    current = m(current);
    version += 1;
    current.version = version;
  }
  const defaults = createInitialState(now);
  const merged = mergeDefaults(defaults, current);
  // Sanity-clamp numbers that must never be invalid.
  for (const k of ['cash', 'gems', 'xp', 'energy', 'tipJar'] as const) {
    if (!Number.isFinite(merged[k]) || merged[k] < 0) merged[k] = 0;
  }
  if (!Number.isFinite(merged.level) || merged.level < 1) merged.level = 1;
  return merged;
}
