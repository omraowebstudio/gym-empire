// The game engine: a thin transactional wrapper around pure system functions.
// Every action runs on a cloned draft; on failure the original state is returned
// untouched, so partial mutations can never leak into the saved game.
import type { ActionContext, ActionResult, GameState } from './types';
import { overallStrength, physiqueStage } from './systems/stats';
import { checkAchievements, checkAutoUnlocks, refreshEvent, refreshMissions, refreshWeeklyCompetition } from './systems/retention';
import { consumeRewardedAd } from './systems/shop';

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export type ActionFn = (draft: GameState, ctx: ActionContext) => string | void;

export interface ActOptions {
  rng?: () => number;
  /** marks an action as the reward for a completed rewarded ad; enforces the daily cap */
  rewardedAd?: boolean;
}

/** Keeps date-driven systems current. Safe to run any number of times. */
export function maintain(draft: GameState, ctx: ActionContext): void {
  refreshMissions(draft, ctx.now);
  refreshEvent(draft, ctx.now);
  refreshWeeklyCompetition(draft, ctx.now);
  checkAutoUnlocks(draft, ctx);
  checkAchievements(draft, ctx);
}

export function act(state: GameState, now: number, fn: ActionFn, opts: ActOptions = {}): ActionResult {
  const draft = cloneState(state);
  const ctx: ActionContext = { now, rng: opts.rng ?? Math.random, effects: [] };
  const stageBefore = physiqueStage(overallStrength(state));
  // Bring daily state current before the action so progress lands in today's missions.
  refreshMissions(draft, now);
  refreshEvent(draft, now);
  refreshWeeklyCompetition(draft, now);
  if (opts.rewardedAd && !consumeRewardedAd(draft, now)) {
    return { ok: false, reason: 'Daily ad limit reached', state, effects: [] };
  }
  const err = fn(draft, ctx);
  if (typeof err === 'string') return { ok: false, reason: err, state, effects: [] };
  // Run twice so achievements unlocked by auto-granted items are also caught.
  maintain(draft, ctx);
  maintain(draft, ctx);
  const stageAfter = physiqueStage(overallStrength(draft));
  if (stageAfter > stageBefore) ctx.effects.push({ type: 'physique', stage: stageAfter });
  return { ok: true, state: draft, effects: ctx.effects };
}
