// Shared state-mutating helpers used by all actions. These mutate a draft state.
import { ECONOMY, levelUpCash, levelUpGems, maxEnergy, xpForLevel } from '../config/economy';
import { EXERCISES } from '../config/exercises';
import { ITEM_MAP } from '../config/items';
import { MISSION_MAP } from '../config/missions';
import { EVENT_MAP, LEVEL_UNLOCKS, type RewardSpec } from '../config/rewards';
import { FIRST_NAMES, LAST_INITIALS } from '../config/names';
import { nextId } from '../state';
import { pick } from '../utils/rng';
import type { ActionContext, GameState, LocationState, Member, MembershipTier, TrackedEvent } from '../types';
import { baseIncomePerMin, bestSlotForMember, tierChances } from './gym';

// ---------- Energy ----------

export function currentEnergy(state: GameState, now: number): number {
  const max = maxEnergy(state.level);
  if (state.energy >= max) return state.energy;
  const regen = Math.floor(Math.max(0, now - state.energyUpdatedAt) / (ECONOMY.energy.regenSeconds * 1000));
  return Math.min(max, state.energy + regen);
}

/** Seconds until the next energy point regenerates (0 if full). */
export function energyRegenRemaining(state: GameState, now: number): number {
  const max = maxEnergy(state.level);
  if (currentEnergy(state, now) >= max) return 0;
  const period = ECONOMY.energy.regenSeconds * 1000;
  const elapsed = Math.max(0, now - state.energyUpdatedAt) % period;
  return Math.ceil((period - elapsed) / 1000);
}

export function settleEnergy(state: GameState, now: number): void {
  const max = maxEnergy(state.level);
  if (state.energy >= max) {
    state.energyUpdatedAt = now;
    return;
  }
  const period = ECONOMY.energy.regenSeconds * 1000;
  const elapsed = Math.max(0, now - state.energyUpdatedAt);
  const regen = Math.floor(elapsed / period);
  const newEnergy = Math.min(max, state.energy + regen);
  state.energyUpdatedAt = newEnergy >= max ? now : state.energyUpdatedAt + regen * period;
  state.energy = newEnergy;
}

export function spendEnergy(state: GameState, now: number, amount: number): boolean {
  settleEnergy(state, now);
  if (state.energy < amount) return false;
  const max = maxEnergy(state.level);
  const wasFull = state.energy >= max;
  state.energy -= amount;
  if (wasFull) state.energyUpdatedAt = now;
  return true;
}

export function addEnergy(state: GameState, now: number, amount: number): void {
  settleEnergy(state, now);
  state.energy += amount;
}

// ---------- Tracking (missions + events) ----------

export function track(state: GameState, ctx: ActionContext, ev: TrackedEvent): void {
  const amount = ev.amount ?? 1;
  // Daily missions
  for (const m of state.missions.missions) {
    const def = MISSION_MAP[m.defId];
    if (!def || def.event !== ev.type || m.progress >= m.target) continue;
    m.progress = Math.min(m.target, m.progress + amount);
    if (m.progress >= m.target) ctx.effects.push({ type: 'missionComplete', missionId: m.id });
  }
  // Weekly event
  const evDef = EVENT_MAP[state.event.eventId];
  if (evDef) {
    for (const rule of evDef.rules) {
      if (rule.event !== ev.type) continue;
      if (rule.exercise && rule.exercise !== ev.exercise) continue;
      if (rule.compType && rule.compType !== ev.compType) continue;
      const gained = rule.tokens * (ev.type === 'earn_cash' ? 1 : amount);
      state.event.tokens += gained;
      const key = `${rule.event}:${rule.exercise ?? rule.compType ?? '*'}`;
      state.event.progress[key] = (state.event.progress[key] ?? 0) + amount;
    }
  }
}

// ---------- Currency ----------

export function grantCash(state: GameState, ctx: ActionContext, amount: number): void {
  if (!(amount > 0)) return;
  state.cash += amount;
  state.counters.cashEarned += amount;
  track(state, ctx, { type: 'earn_cash', amount });
}

export function spendCash(state: GameState, amount: number): boolean {
  if (amount < 0 || state.cash + 1e-9 < amount) return false;
  state.cash = Math.max(0, state.cash - amount);
  return true;
}

export function spendGems(state: GameState, amount: number): boolean {
  if (amount < 0 || state.gems < amount) return false;
  state.gems -= amount;
  return true;
}

export function grantXp(state: GameState, ctx: ActionContext, amount: number): void {
  if (!(amount > 0)) return;
  state.xp += Math.round(amount);
  while (state.level < ECONOMY.levels.maxLevel && state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level += 1;
    const cash = levelUpCash(state.level);
    const gems = levelUpGems(state.level);
    state.cash += cash;
    state.counters.cashEarned += cash;
    state.gems += gems;
    // Level-up refills energy to at least max.
    settleEnergy(state, ctx.now);
    state.energy = Math.max(state.energy, maxEnergy(state.level));
    state.energyUpdatedAt = ctx.now;
    const unlocks: string[] = [];
    for (const u of LEVEL_UNLOCKS) if (u.level === state.level) unlocks.push(u.label);
    for (const e of EXERCISES) if (e.unlockLevel === state.level) unlocks.push(`${e.name} unlocked`);
    ctx.effects.push({ type: 'levelUp', level: state.level, cash, gems, unlocks });
  }
  if (state.level >= ECONOMY.levels.maxLevel) state.xp = Math.min(state.xp, xpForLevel(state.level));
}

// ---------- Items ----------

export function ownsItem(state: GameState, itemId: string): boolean {
  return state.inventory[itemId] !== undefined;
}

/** Grants an item. Returns false if it was already owned. */
export function grantItem(state: GameState, ctx: ActionContext, itemId: string): boolean {
  if (!ITEM_MAP[itemId] || ownsItem(state, itemId)) return false;
  state.inventory[itemId] = ctx.now;
  state.counters.itemsCollected += 1;
  ctx.effects.push({ type: 'item', itemId });
  track(state, ctx, { type: 'item_acquired' });
  return true;
}

// ---------- Rewards ----------

export interface ResolvedReward {
  cash: number;
  xp: number;
  gems: number;
  energy: number;
  itemId: string | null;
  duplicate: boolean;
}

export function resolveReward(state: GameState, spec: RewardSpec, multiplier = 1): ResolvedReward {
  const income = baseIncomePerMin(state);
  const cash = spec.cashFloor !== undefined || spec.cashMinutes !== undefined
    ? Math.round(Math.max(spec.cashFloor ?? 0, income * (spec.cashMinutes ?? 0)) * multiplier)
    : 0;
  const xp = Math.round(((spec.xp ?? 0) + (spec.xpPerLevel ?? 0) * state.level) * multiplier);
  const duplicate = !!spec.itemId && ownsItem(state, spec.itemId);
  const gems = Math.round(((spec.gems ?? 0) + (duplicate ? spec.duplicateGems ?? 0 : 0)) * multiplier);
  return { cash, xp, gems, energy: spec.energy ?? 0, itemId: spec.itemId && !duplicate ? spec.itemId : null, duplicate };
}

export function grantReward(
  state: GameState,
  ctx: ActionContext,
  spec: RewardSpec,
  label: string,
  multiplier = 1,
): ResolvedReward {
  const r = resolveReward(state, spec, multiplier);
  grantCash(state, ctx, r.cash);
  state.gems += r.gems;
  if (r.energy) addEnergy(state, ctx.now, r.energy);
  if (r.itemId) grantItem(state, ctx, r.itemId);
  grantXp(state, ctx, r.xp);
  ctx.effects.push({ type: 'reward', cash: r.cash, xp: r.xp, gems: r.gems, label });
  return r;
}

// ---------- Members ----------

export function rollTier(state: GameState, loc: LocationState, rng: () => number): MembershipTier {
  const c = tierChances(state, loc);
  const r = rng();
  if (r < c.vip) return 'vip';
  if (r < c.vip + c.plus) return 'plus';
  return 'basic';
}

export function createMember(state: GameState, loc: LocationState, ctx: ActionContext, tier?: MembershipTier): Member | null {
  const slotId = bestSlotForMember(loc);
  if (!slotId) return null;
  const rng = ctx.rng;
  const member: Member = {
    id: nextId(state, 'm'),
    name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_INITIALS)}.`,
    seed: Math.floor(rng() * 1e9),
    tier: tier ?? rollTier(state, loc, rng),
    satisfactionOffset: Math.round(rng() * 16 - 8),
    slotId,
    joinedAt: ctx.now,
  };
  loc.members.push(member);
  state.counters.membersRecruited += 1;
  track(state, ctx, { type: 'recruit' });
  return member;
}
