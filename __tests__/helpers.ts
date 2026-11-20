import { act, createInitialState, completeOnboarding, type ActionFn, type GameState } from '../src/game';
import { mulberry32 } from '../src/game/utils/rng';

export const T0 = new Date(2026, 10, 18, 10, 0, 0).getTime(); // Wed 18 Nov 2026, 10:00 local

export function rng(seed = 42) {
  return mulberry32(seed);
}

export function newPlayer(now = T0): GameState {
  const s = createInitialState(now);
  const r = act(s, now, (d, ctx) => completeOnboarding(d, ctx, 'Tester', d.profile.appearance), { rng: rng() });
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

export function run(state: GameState, now: number, fn: ActionFn, seed = 7) {
  return act(state, now, fn, { rng: rng(seed) });
}

export function must(state: GameState, now: number, fn: ActionFn, seed = 7): GameState {
  const r = run(state, now, fn, seed);
  if (!r.ok) throw new Error(`Action failed: ${r.reason}`);
  return r.state;
}

export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;
