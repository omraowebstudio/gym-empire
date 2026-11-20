// Daily missions, daily login rewards, weekly events, achievements and auto-unlocks.
import { ACHIEVEMENTS, ACHIEVEMENT_MAP, type MetricKey } from '../config/achievements';
import { ECONOMY } from '../config/economy';
import { ITEMS, ITEM_MAP } from '../config/items';
import { MISSIONS, MISSION_MAP, type MissionDef } from '../config/missions';
import { DAILY_REWARDS, EVENTS, EVENT_MAP } from '../config/rewards';
import { hashString, mulberry32, shuffle } from '../utils/rng';
import { dateKey, weekIndex, weekKey } from '../utils/time';
import type { ActionContext, GameState, MissionInstance } from '../types';
import { grantCash, grantItem, grantReward, grantXp, ownsItem, spendGems } from './core';
import { baseIncomePerMin, maxEquipmentLevel, netIncomePerMin, ownedLocations, totalEquipment, totalMembers } from './gym';
import { overallStrength } from './stats';

// ---------------- Daily missions ----------------

function niceRound(n: number): number {
  if (n < 100) return Math.ceil(n / 10) * 10;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.ceil(n / mag) * mag;
}

export function missionTarget(def: MissionDef, state: GameState): number {
  if (def.cashTargetMinutes) {
    return niceRound(Math.max(200, baseIncomePerMin(state) * def.cashTargetMinutes));
  }
  return Math.max(1, Math.min(def.targetMax, Math.round(def.targetBase + def.targetPerLevel * state.level)));
}

export function generateMissions(state: GameState, key: string): MissionInstance[] {
  const eligible = MISSIONS.filter((m) => state.level >= m.minLevel && m.id !== 'train');
  const rng = mulberry32(hashString(`${key}:${state.createdAt}`));
  const chosen = [MISSION_MAP.train, ...shuffle(rng, eligible).slice(0, ECONOMY.missions.perDay - 1)];
  const income = baseIncomePerMin(state);
  return chosen.map((def, i) => ({
    id: `${key}:${i}:${def.id}`,
    defId: def.id,
    target: missionTarget(def, state),
    progress: 0,
    claimed: false,
    rewardCash: Math.round(Math.max(def.rewardCashFloor, income * def.rewardIncomeMinutes)),
    rewardXp: Math.round(def.rewardXp * (1 + state.level * 0.08)),
    rewardGems: def.rewardGems,
    adDoubled: false,
  }));
}

/** Regenerates missions when the local calendar day changes. Progress within a day is preserved. */
export function refreshMissions(state: GameState, now: number): void {
  const key = dateKey(now);
  if (state.missions.dateKey === key) return;
  state.missions = { dateKey: key, missions: generateMissions(state, key), bonusClaimed: false };
}

export function claimMission(state: GameState, ctx: ActionContext, missionId: string, doubled = false): string | void {
  const m = state.missions.missions.find((x) => x.id === missionId);
  if (!m) return 'Mission not found';
  if (m.claimed) return 'Already claimed';
  if (m.progress < m.target) return 'Mission not complete';
  m.claimed = true;
  m.adDoubled = doubled;
  const mult = doubled ? 2 : 1;
  state.counters.missionsCompleted += 1;
  grantCash(state, ctx, m.rewardCash * mult);
  state.gems += m.rewardGems * mult;
  grantXp(state, ctx, m.rewardXp * mult);
  ctx.effects.push({ type: 'reward', cash: m.rewardCash * mult, xp: m.rewardXp * mult, gems: m.rewardGems * mult, label: 'Mission complete' });
}

export function missionBonusAvailable(state: GameState): boolean {
  return !state.missions.bonusClaimed && state.missions.missions.length > 0 && state.missions.missions.every((m) => m.claimed);
}

export function claimMissionBonus(state: GameState, ctx: ActionContext): string | void {
  if (state.missions.bonusClaimed) return 'Already claimed';
  if (!missionBonusAvailable(state)) return 'Complete all missions first';
  state.missions.bonusClaimed = true;
  grantReward(state, ctx, { gems: ECONOMY.missions.bonusGems, cashFloor: 500, cashMinutes: ECONOMY.missions.bonusCashMinutes }, 'Daily chest');
}

// ---------------- Daily login rewards ----------------

export function canClaimDaily(state: GameState, now: number): boolean {
  return state.dailyReward.lastClaimDate !== dateKey(now);
}

export function claimDaily(state: GameState, ctx: ActionContext): string | void {
  if (!canClaimDaily(state, ctx.now)) return 'Already claimed today';
  const d = state.dailyReward;
  const day = DAILY_REWARDS[d.nextDay];
  d.lastClaimDate = dateKey(ctx.now);
  d.totalClaims += 1;
  d.nextDay = (d.nextDay + 1) % DAILY_REWARDS.length;
  if (d.nextDay === 0) d.cycle += 1;
  state.counters.dailyClaims += 1;
  grantReward(state, ctx, day.reward, `Day ${day.day} reward`);
}

export function canClaimDailyAdBonus(state: GameState, now: number): boolean {
  const today = dateKey(now);
  return state.dailyReward.lastClaimDate === today && state.dailyReward.adBonusDate !== today;
}

/** Optional bonus after watching a rewarded ad (verified by the ad service before calling). */
export function claimDailyAdBonus(state: GameState, ctx: ActionContext): string | void {
  if (!canClaimDailyAdBonus(state, ctx.now)) return 'Bonus not available';
  state.dailyReward.adBonusDate = dateKey(ctx.now);
  grantReward(state, ctx, { cashFloor: 300, cashMinutes: 20, gems: 3 }, 'Daily bonus');
}

// ---------------- Weekly events ----------------

export function currentEventId(now: number): string {
  return EVENTS[((weekIndex(now) % EVENTS.length) + EVENTS.length) % EVENTS.length].id;
}

export function refreshEvent(state: GameState, now: number): void {
  const wk = weekKey(now);
  if (state.event.weekKey === wk && EVENT_MAP[state.event.eventId]) return;
  state.event = { eventId: currentEventId(now), weekKey: wk, tokens: 0, claimed: [], progress: {} };
}

export function claimEventMilestone(state: GameState, ctx: ActionContext, index: number): string | void {
  const def = EVENT_MAP[state.event.eventId];
  if (!def) return 'No active event';
  const ms = def.milestones[index];
  if (!ms) return 'Invalid milestone';
  if (state.event.claimed.includes(index)) return 'Already claimed';
  if (state.event.tokens < ms.tokens) return 'Not enough event tokens';
  state.event.claimed.push(index);
  grantReward(state, ctx, ms.reward, `${def.name} reward`);
}

// ---------------- Weekly competition reset ----------------

export function refreshWeeklyCompetition(state: GameState, now: number): void {
  const wk = weekKey(now);
  if (state.competition.weekKey === wk) return;
  state.competition.weekKey = wk;
  state.competition.weeklyChampionshipDone = false;
  state.competition.leaguePoints = 0;
}

// ---------------- Achievements ----------------

export function metricValue(state: GameState, metric: MetricKey, now: number): number {
  switch (metric) {
    case 'level': return state.level;
    case 'overallStrength': return overallStrength(state);
    case 'equipmentOwned': return totalEquipment(state);
    case 'maxEquipmentLevel': return maxEquipmentLevel(state);
    case 'totalMembers': return totalMembers(state);
    case 'incomePerMin': return Math.floor(netIncomePerMin(state, 0));
    case 'locationsOwned': return ownedLocations(state).length;
    case 'staffCount': return state.staff.length;
    case 'itemsOwned': return Object.keys(state.inventory).filter((id) => ITEM_MAP[id] && ITEM_MAP[id].unlock.kind !== 'default').length;
    case 'onboarded': return state.profile.onboarded ? 1 : 0;
    case 'legendWins': return Object.entries(state.competition.wins).filter(([k]) => k.endsWith(':4')).reduce((s, [, v]) => s + v, 0);
    default: {
      void now;
      return state.counters[metric] ?? 0;
    }
  }
}

export function checkAchievements(state: GameState, ctx: ActionContext): void {
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    if (metricValue(state, a.metric, ctx.now) >= a.target) {
      state.achievements[a.id] = { unlockedAt: ctx.now, claimed: false };
      ctx.effects.push({ type: 'achievement', id: a.id });
    }
  }
}

export function claimAchievement(state: GameState, ctx: ActionContext, id: string): string | void {
  const a = ACHIEVEMENT_MAP[id];
  const p = state.achievements[id];
  if (!a || !p) return 'Achievement locked';
  if (p.claimed) return 'Already claimed';
  p.claimed = true;
  grantReward(state, ctx, { gems: a.gems, cashFloor: a.cash, xp: a.xp }, a.name);
}

// ---------------- Collection auto-unlocks ----------------

/** Grants items whose unlock condition is a progression milestone the player has reached. */
export function checkAutoUnlocks(state: GameState, ctx: ActionContext): void {
  const strength = overallStrength(state);
  for (const item of ITEMS) {
    if (ownsItem(state, item.id)) continue;
    const u = item.unlock;
    if (
      (u.kind === 'level' && state.level >= u.level) ||
      (u.kind === 'missions' && state.counters.missionsCompleted >= u.count) ||
      (u.kind === 'strength' && strength >= u.value) ||
      (u.kind === 'achievement' && !!state.achievements[u.id]) ||
      (u.kind === 'default')
    ) {
      grantItem(state, ctx, item.id);
    }
  }
}

export function buyItemWithGems(state: GameState, ctx: ActionContext, itemId: string): string | void {
  const item = ITEM_MAP[itemId];
  if (!item) return 'Unknown item';
  if (ownsItem(state, itemId)) return 'Already owned';
  if (item.unlock.kind !== 'gems') return 'This item cannot be bought';
  if (!spendGems(state, item.unlock.cost)) return 'Not enough gems';
  grantItem(state, ctx, itemId);
}
