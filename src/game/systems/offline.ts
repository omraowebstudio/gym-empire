// Time-based simulation: live income ticks and offline earnings.
import { ECONOMY } from '../config/economy';
import type { ActionContext, GameState, OfflineReport } from '../types';
import { createMember, grantCash, spendGems, track } from './core';
import { incomeBreakdown, locationCapacity, offlineCapSeconds, ownedLocations, recruitRatePerMin } from './gym';

const O = ECONOMY.offline;

function recruitOverTime(state: GameState, ctx: ActionContext, seconds: number, emitEffects: boolean): number {
  let joined = 0;
  for (const loc of ownedLocations(state)) {
    const cap = locationCapacity(loc);
    if (loc.members.length >= cap) {
      loc.recruitProgress = 0;
      continue;
    }
    loc.recruitProgress += (recruitRatePerMin(state, loc) * seconds) / 60;
    while (loc.recruitProgress >= 1 && loc.members.length < cap) {
      loc.recruitProgress -= 1;
      const m = createMember(state, loc, ctx);
      if (!m) break;
      joined++;
      if (emitEffects) ctx.effects.push({ type: 'memberJoined', name: m.name, locationId: loc.id });
    }
    if (loc.members.length >= cap) loc.recruitProgress = 0;
  }
  return joined;
}

/**
 * Computes the offline earnings for `elapsedSeconds` starting at `state.lastTickAt`.
 * Pure with respect to cash: it only builds the report.
 */
export function computeOfflineEarnings(state: GameState, elapsedSeconds: number): Omit<OfflineReport, 'membersJoined' | 'createdAt' | 'doubled'> {
  const capSeconds = offlineCapSeconds(state);
  const alreadyCredited = state.pendingOffline?.seconds ?? 0;
  const allowed = Math.max(0, capSeconds - alreadyCredited);
  const seconds = Math.max(0, Math.min(elapsedSeconds, allowed));
  const b = incomeBreakdown(state, state.lastTickAt, true);
  const minutes = seconds / 60;
  const gross = b.gross * minutes;
  const managerBonus = b.managerBonus * minutes;
  const salaries = b.salaries * minutes;
  let boostBonus = 0;
  for (const boost of state.boosts) {
    const overlap = Math.max(0, Math.min(seconds, (boost.until - state.lastTickAt) / 1000));
    if (overlap <= 0) continue;
    boostBonus = Math.max(boostBonus, (b.gross + b.managerBonus) * (boost.multiplier - 1) * (overlap / 60));
  }
  const total = Math.max(0, Math.floor(gross + managerBonus + boostBonus - salaries));
  return { seconds, rawSeconds: elapsedSeconds, capSeconds, gross, salaries, managerBonus, boostBonus, total };
}

export function tick(state: GameState, ctx: ActionContext): void {
  const now = ctx.now;
  if (now < state.lastTickAt) {
    // Device clock moved backwards: never award time we cannot verify.
    state.lastTickAt = now;
    return;
  }
  const elapsed = (now - state.lastTickAt) / 1000;
  if (elapsed <= 0) return;

  if (elapsed >= O.minSecondsForReport) {
    const r = computeOfflineEarnings(state, elapsed);
    const joined = recruitOverTime(state, ctx, r.seconds, false);
    const prev = state.pendingOffline;
    state.pendingOffline = {
      seconds: (prev?.seconds ?? 0) + r.seconds,
      rawSeconds: (prev?.rawSeconds ?? 0) + r.rawSeconds,
      capSeconds: r.capSeconds,
      gross: (prev?.gross ?? 0) + r.gross,
      salaries: (prev?.salaries ?? 0) + r.salaries,
      managerBonus: (prev?.managerBonus ?? 0) + r.managerBonus,
      boostBonus: (prev?.boostBonus ?? 0) + r.boostBonus,
      total: (prev?.total ?? 0) + r.total,
      membersJoined: (prev?.membersJoined ?? 0) + joined,
      createdAt: now,
      doubled: false,
    };
    if (state.pendingOffline.total <= 0 && state.pendingOffline.membersJoined === 0) state.pendingOffline = null;
  } else {
    const b = incomeBreakdown(state, now);
    const earned = (b.net * elapsed) / 60;
    grantCash(state, ctx, earned);
    const tipCap = b.net * ECONOMY.gym.tipJarCapMinutes;
    state.tipJar = Math.min(tipCap, state.tipJar + earned * ECONOMY.gym.tipShare);
    recruitOverTime(state, ctx, elapsed, true);
  }
  state.lastTickAt = now;
  state.boosts = state.boosts.filter((b) => b.until > now);
}

export function collectOffline(state: GameState, ctx: ActionContext, mode: 'normal' | 'ad' | 'gems'): string | void {
  const p = state.pendingOffline;
  if (!p) return 'Nothing to collect';
  let mult = 1;
  if (mode === 'gems') {
    if (!spendGems(state, 10)) return 'Not enough gems';
    mult = O.adMultiplier;
  } else if (mode === 'ad') {
    mult = O.adMultiplier;
  }
  const amount = Math.floor(p.total * mult);
  state.pendingOffline = null;
  grantCash(state, ctx, amount);
  state.counters.incomeCollections += 1;
  track(state, ctx, { type: 'collect_income' });
  ctx.effects.push({ type: 'reward', cash: amount, xp: 0, gems: 0, label: mult > 1 ? 'Offline earnings ×2' : 'Offline earnings' });
}
