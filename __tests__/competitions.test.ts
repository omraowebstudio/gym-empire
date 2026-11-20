import {
  playCompetitionRound,
  playerCompetitionPower,
  startCompetition,
  forfeitCompetition,
  ECONOMY,
  currentEnergy,
  type GameState,
} from '../src/game';
import { trophyId } from '../src/game/config/items';
import { DAY, must, newPlayer, run, T0 } from './helpers';

function strong(s: GameState) {
  for (const id of ['bench', 'squat', 'deadlift'] as const) s.exercises[id].level = 80;
  return s;
}

function playAll(s: GameState, quality = 1, seed = 3): GameState {
  let cur = s;
  let i = 0;
  while (cur.competition.active) cur = must(cur, T0 + ++i, (d, ctx) => playCompetitionRound(d, ctx, quality), seed + i);
  return cur;
}

describe('competitions', () => {
  test('entering costs energy and creates an 8-lifter bracket', () => {
    const s = newPlayer();
    const r = must(s, T0, (d, ctx) => startCompetition(d, ctx, 'bench', 0));
    expect(r.competition.active!.opponents).toHaveLength(7);
    expect(currentEnergy(r, T0)).toBe(currentEnergy(s, T0) - ECONOMY.energy.competitionCost);
  });

  test('a much stronger player wins, earns a trophy, gems and a record', () => {
    let s = strong(newPlayer());
    s = must(s, T0, (d, ctx) => startCompetition(d, ctx, 'bench', 0));
    const gems = s.gems;
    s = playAll(s);
    const res = s.competition.history[0];
    expect(res.place).toBe(1);
    expect(res.trophyId).toBe(trophyId('bench', 0));
    expect(s.inventory[trophyId('bench', 0)]).toBeDefined();
    expect(s.gems).toBeGreaterThanOrEqual(gems + res.rewardGems);
    expect(s.competition.records.bench).toBe(res.playerBest);
    expect(s.counters.competitionWins).toBe(1);
  });

  test('trophy gems are only awarded for the first win of a type/tier', () => {
    let s = strong(newPlayer());
    s = playAll(must(s, T0, (d, ctx) => startCompetition(d, ctx, 'bench', 0)));
    s = playAll(must(s, T0 + 10, (d, ctx) => startCompetition(d, ctx, 'bench', 0)));
    expect(s.competition.history[0].place).toBe(1);
    expect(s.competition.history[0].rewardGems).toBe(0);
    expect(s.competition.history[0].trophyId).toBeNull();
  });

  test('a far weaker player is eliminated in the first round', () => {
    let s = newPlayer();
    s.exercises.deadlift.level = 1;
    s = must(s, T0, (d, ctx) => startCompetition(d, ctx, 'deadlift', 0));
    // nerf the player artificially for the test by making opponents enormous
    s.competition.active!.opponents.forEach((o) => (o.power = 10_000));
    s = playAll(s, 0);
    expect(s.competition.history[0].place).toBe(5);
    expect(s.competition.active).toBeNull();
  });

  test('locked tiers and concurrent competitions are rejected', () => {
    const s = newPlayer();
    expect(run(s, T0, (d, ctx) => startCompetition(d, ctx, 'bench', 3)).ok).toBe(false);
    const r = must(s, T0, (d, ctx) => startCompetition(d, ctx, 'bench', 0));
    expect(run(r, T0, (d, ctx) => startCompetition(d, ctx, 'squat', 0)).ok).toBe(false);
  });

  test('weekly championship is free, once per week, and resets next week', () => {
    let s = strong(newPlayer());
    s.energy = 0;
    s.energyUpdatedAt = T0;
    s = must(s, T0, (d, ctx) => startCompetition(d, ctx, 'weekly', 0));
    s = playAll(s);
    expect(run(s, T0 + 100, (d, ctx) => startCompetition(d, ctx, 'weekly', 0)).ok).toBe(false);
    const nextWeek = must(s, T0 + 7 * DAY, (d, ctx) => startCompetition(d, ctx, 'weekly', 0));
    expect(nextWeek.competition.active).not.toBeNull();
  });

  test('total power is the sum of the three big lifts', () => {
    const s = newPlayer();
    expect(playerCompetitionPower(s, 'total')).toBe(
      playerCompetitionPower(s, 'bench') + playerCompetitionPower(s, 'squat') + playerCompetitionPower(s, 'deadlift'),
    );
  });

  test('forfeit finishes the competition with a placement', () => {
    let s = must(newPlayer(), T0, (d, ctx) => startCompetition(d, ctx, 'squat', 0));
    s = must(s, T0, (d, ctx) => forfeitCompetition(d, ctx));
    expect(s.competition.active).toBeNull();
    expect(s.competition.history[0].place).toBe(5);
  });
});
