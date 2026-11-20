import {
  COMPETITION_TIERS,
  COMPETITION_TYPE_MAP,
  PLACEMENT_LEAGUE_POINTS,
  PLACEMENT_REWARD,
  WEEKLY_GYM_POWER_FACTOR,
} from '../config/competitions';
import { ECONOMY } from '../config/economy';
import { trophyId } from '../config/items';
import { COUNTRIES, FIRST_NAMES, LIFTER_NICKNAMES } from '../config/names';
import { nextId } from '../state';
import { pick } from '../utils/rng';
import type {
  ActionContext,
  ActiveCompetition,
  CompetitionMatch,
  CompetitionOpponent,
  CompetitionResult,
  CompetitionType,
  GameState,
} from '../types';
import { currentEnergy, grantCash, grantItem, grantXp, spendEnergy, track } from './core';
import { baseIncomePerMin } from './gym';
import { exercisePower } from './stats';

export const PLAYER_ID = 'player';

/** The player's fictional competition power for a given competition type. */
export function playerCompetitionPower(state: GameState, type: CompetitionType): number {
  const bench = exercisePower(state, 'bench');
  const squat = exercisePower(state, 'squat');
  const dead = exercisePower(state, 'deadlift');
  switch (type) {
    case 'bench': return bench;
    case 'squat': return squat;
    case 'deadlift': return dead;
    case 'total': return bench + squat + dead;
    case 'weekly': return bench + squat + dead + gymReputationPower(state);
  }
}

export function gymReputationPower(state: GameState): number {
  return Math.round(Math.log10(baseIncomePerMin(state) + 1) * WEEKLY_GYM_POWER_FACTOR);
}

export function highestUnlockedTier(state: GameState): number {
  let t = 0;
  for (const tier of COMPETITION_TIERS) if (state.level >= tier.unlockLevel) t = tier.tier;
  return t;
}

export function opponentBasePower(type: CompetitionType, tier: number): number {
  return COMPETITION_TIERS[tier].basePower * COMPETITION_TYPE_MAP[type].powerScale;
}

export function generateOpponents(type: CompetitionType, tier: number, rng: () => number): CompetitionOpponent[] {
  const base = opponentBasePower(type, tier);
  const list: CompetitionOpponent[] = [];
  for (let i = 0; i < 7; i++) {
    // Seeds spread from easier (early bracket) to tougher opponents.
    const f = 0.8 + (i / 6) * 0.25 + rng() * 0.1;
    list.push({
      id: `o${i}`,
      name: `${pick(rng, FIRST_NAMES)} "${pick(rng, LIFTER_NICKNAMES)}"`,
      seed: Math.floor(rng() * 1e9),
      power: Math.round(base * f),
      country: pick(rng, COUNTRIES),
    });
  }
  return list;
}

/** Bracket: entrants [player, o0..o6]; quarter-final pairs (0,1)(2,3)(4,5)(6,7). */
function entrantIds(active: ActiveCompetition): string[] {
  return [PLAYER_ID, ...active.opponents.map((o) => o.id)];
}

function powerOf(state: GameState, active: ActiveCompetition, id: string): number {
  if (id === PLAYER_ID) return playerCompetitionPower(state, active.type);
  return active.opponents.find((o) => o.id === id)?.power ?? 0;
}

function roundPairs(active: ActiveCompetition, round: number): [string, string][] {
  if (round === 0) {
    const e = entrantIds(active);
    return [[e[0], e[1]], [e[2], e[3]], [e[4], e[5]], [e[6], e[7]]];
  }
  const prev = active.matches.filter((m) => m.round === round - 1).map((m) => m.winner);
  const pairs: [string, string][] = [];
  for (let i = 0; i < prev.length; i += 2) pairs.push([prev[i], prev[i + 1]]);
  return pairs;
}

/** Performance multiplier from the lift timing tap (0..1 quality). */
export function performanceMultiplier(quality: number): number {
  const q = Math.max(0, Math.min(1, quality));
  return 0.92 + q * 0.16; // 0.92 .. 1.08
}

export function canStartCompetition(state: GameState, type: CompetitionType, tier: number, now: number): string | null {
  const def = COMPETITION_TYPE_MAP[type];
  const tierDef = COMPETITION_TIERS[tier];
  if (!def || !tierDef) return 'Unknown competition';
  if (state.competition.active) return 'Finish your current competition first';
  if (state.level < tierDef.unlockLevel) return `Requires level ${tierDef.unlockLevel}`;
  if (def.weekly) {
    if (state.competition.weeklyChampionshipDone) return 'Already competed this week';
    if (tier !== highestUnlockedTier(state)) return 'Weekly championship uses your highest tier';
    return null;
  }
  if (currentEnergy(state, now) < ECONOMY.energy.competitionCost) return 'Not enough energy';
  return null;
}

export function startCompetition(state: GameState, ctx: ActionContext, type: CompetitionType, tier: number): string | void {
  const err = canStartCompetition(state, type, tier, ctx.now);
  if (err) return err;
  if (!COMPETITION_TYPE_MAP[type].weekly && !spendEnergy(state, ctx.now, ECONOMY.energy.competitionCost)) {
    return 'Not enough energy';
  }
  if (COMPETITION_TYPE_MAP[type].weekly) state.competition.weeklyChampionshipDone = true;
  state.competition.active = {
    id: nextId(state, 'c'),
    type,
    tier,
    opponents: generateOpponents(type, tier, ctx.rng),
    matches: [],
    round: 0,
    eliminated: false,
    startedAt: ctx.now,
  };
  state.counters.competitions += 1;
  track(state, ctx, { type: 'compete', compType: type });
}

/** Plays the next round. `quality` is the 0..1 result of the player's lift timing. */
export function playCompetitionRound(state: GameState, ctx: ActionContext, quality: number): string | void {
  const active = state.competition.active;
  if (!active) return 'No active competition';
  if (active.eliminated || active.round > 2) return 'Competition already finished';
  const perf = performanceMultiplier(quality);
  const rng = ctx.rng;
  for (const [a, b] of roundPairs(active, active.round)) {
    const lift = (id: string) => {
      const base = powerOf(state, active, id);
      const mult = id === PLAYER_ID ? perf * (0.97 + rng() * 0.06) : 0.94 + rng() * 0.12;
      return Math.round(base * mult);
    };
    const aLift = lift(a);
    let bLift = lift(b);
    if (aLift === bLift) bLift -= 1;
    const match: CompetitionMatch = { round: active.round, a, b, aLift, bLift, winner: aLift > bLift ? a : b };
    active.matches.push(match);
    if ((a === PLAYER_ID || b === PLAYER_ID) && match.winner !== PLAYER_ID) active.eliminated = true;
  }
  active.round += 1;
  if (active.eliminated || active.round > 2) finishCompetition(state, ctx);
}

export function placementFor(active: ActiveCompetition): number {
  const playerMatches = active.matches.filter((m) => m.a === PLAYER_ID || m.b === PLAYER_ID);
  const lost = playerMatches.find((m) => m.winner !== PLAYER_ID);
  if (!lost) return 1;
  return lost.round === 2 ? 2 : lost.round === 1 ? 3 : 5;
}

function finishCompetition(state: GameState, ctx: ActionContext): void {
  const active = state.competition.active;
  if (!active) return;
  const place = placementFor(active);
  const tierDef = COMPETITION_TIERS[active.tier];
  const typeDef = COMPETITION_TYPE_MAP[active.type];
  const placementMult = PLACEMENT_REWARD[place];
  const typeMult = typeDef.weekly ? 2 : 1;
  const rewardCash = Math.round(Math.max(tierDef.cash, baseIncomePerMin(state) * 10) * placementMult * typeMult);
  const rewardXp = Math.round(tierDef.xp * placementMult * typeMult);
  const winKey = `${active.type}:${active.tier}`;
  let rewardGems = 0;
  let trophy: string | null = null;
  if (place === 1) {
    const firstWin = !state.competition.wins[winKey];
    state.competition.wins[winKey] = (state.competition.wins[winKey] ?? 0) + 1;
    state.counters.competitionWins += 1;
    if (firstWin) {
      rewardGems = tierDef.firstWinGems;
      trophy = trophyId(active.type, active.tier);
      grantItem(state, ctx, trophy);
      // Some cosmetics are tied to specific competition wins.
      if (active.type === 'total' && active.tier >= 1) grantItem(state, ctx, 'shirt_galaxy_tank');
      if (active.type === 'weekly' && active.tier >= 2) grantItem(state, ctx, 'shirt_champion');
    }
    track(state, ctx, { type: 'compete_win', compType: active.type });
  }
  const playerBest = active.matches
    .filter((m) => m.a === PLAYER_ID || m.b === PLAYER_ID)
    .reduce((best, m) => Math.max(best, m.a === PLAYER_ID ? m.aLift : m.bLift), 0);
  const newRecord = playerBest > state.competition.records[active.type];
  if (newRecord) state.competition.records[active.type] = playerBest;
  state.competition.leaguePoints += PLACEMENT_LEAGUE_POINTS[place] * tierDef.leagueMult * typeMult;

  const result: CompetitionResult = {
    id: active.id,
    type: active.type,
    tier: active.tier,
    place,
    playerBest,
    matches: active.matches,
    opponents: active.opponents,
    rewardCash,
    rewardXp,
    rewardGems,
    trophyId: trophy,
    newRecord,
    at: ctx.now,
  };
  state.competition.history.unshift(result);
  state.competition.history = state.competition.history.slice(0, 30);
  state.competition.active = null;

  grantCash(state, ctx, rewardCash);
  state.gems += rewardGems;
  grantXp(state, ctx, rewardXp);
  ctx.effects.push({ type: 'reward', cash: rewardCash, xp: rewardXp, gems: rewardGems, label: `${typeDef.name}: #${place}` });
}

/** Forfeit an in-progress competition (counts as the current placement). */
export function forfeitCompetition(state: GameState, ctx: ActionContext): string | void {
  const active = state.competition.active;
  if (!active) return 'No active competition';
  // Fill remaining player match as a loss so the placement reflects the forfeit.
  if (!active.eliminated && active.round <= 2) {
    const pairs = roundPairs(active, active.round);
    for (const [a, b] of pairs) {
      const playerIn = a === PLAYER_ID || b === PLAYER_ID;
      const opp = a === PLAYER_ID ? b : a;
      active.matches.push({ round: active.round, a, b, aLift: 0, bLift: 0, winner: playerIn ? opp : a });
    }
    active.eliminated = true;
  }
  finishCompetition(state, ctx);
}
