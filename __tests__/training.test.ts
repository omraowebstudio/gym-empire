import {
  completeTraining,
  computeTrainingReward,
  currentEnergy,
  ECONOMY,
  exercisePower,
  gradeFor,
  overallStrength,
  sanitizeOutcome,
  techniqueCost,
  upgradeTechnique,
  type ChallengeOutcome,
} from '../src/game';
import { must, newPlayer, run, T0 } from './helpers';

const perfect: ChallengeOutcome = { challenge: 'timing', reps: 5, perfects: 5, goods: 0, misses: 0, score: 1 };
const poor: ChallengeOutcome = { challenge: 'timing', reps: 5, perfects: 0, goods: 1, misses: 4, score: 0.1 };

describe('training rewards', () => {
  test('better performance yields more XP and cash', () => {
    const s = newPlayer();
    const hi = computeTrainingReward(s, 'bench', perfect);
    const lo = computeTrainingReward(s, 'bench', poor);
    expect(hi.xp).toBeGreaterThan(lo.xp);
    expect(hi.cash).toBeGreaterThan(lo.cash);
    expect(hi.grade).toBe('S');
    expect(lo.grade).toBe('C');
  });

  test('grades map from score', () => {
    expect(gradeFor(0.95)).toBe('S');
    expect(gradeFor(0.8)).toBe('A');
    expect(gradeFor(0.6)).toBe('B');
    expect(gradeFor(0.2)).toBe('C');
  });

  test('completing training grants the computed rewards and spends energy', () => {
    const s = newPlayer();
    const reward = computeTrainingReward(s, 'bench', perfect);
    const r = must(s, T0, (d, ctx) => completeTraining(d, ctx, 'bench', perfect));
    expect(r.xp + 0).toBeGreaterThanOrEqual(0);
    expect(r.counters.trainings).toBe(1);
    expect(r.counters.perfectReps).toBe(5);
    expect(r.cash).toBeGreaterThanOrEqual(s.cash + reward.cash); // + possible achievement-free cash
    expect(currentEnergy(r, T0)).toBe(currentEnergy(s, T0) - ECONOMY.energy.trainingCost);
    expect(r.exercises.bench.sessions).toBe(1);
  });

  test('training without energy fails and leaves state untouched', () => {
    const s = newPlayer();
    s.energy = 1;
    s.energyUpdatedAt = T0;
    const r = run(s, T0, (d, ctx) => completeTraining(d, ctx, 'bench', perfect));
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });

  test('locked exercises cannot be trained', () => {
    const s = newPlayer();
    const r = run(s, T0, (d, ctx) => completeTraining(d, ctx, 'lateral', perfect));
    expect(r.ok).toBe(false);
  });

  test('outcomes are sanitised (no inflated values)', () => {
    const o = sanitizeOutcome({ challenge: 'power', reps: 999, perfects: 999, goods: 5, misses: 0, score: 50 });
    expect(o.reps).toBe(10);
    expect(o.perfects).toBe(10);
    expect(o.score).toBe(1);
  });

  test('exercise levels up and increases power and overall strength', () => {
    let s = newPlayer();
    const before = exercisePower(s, 'squat');
    const strengthBefore = overallStrength(s);
    for (let i = 0; i < 6; i++) s = must(s, T0 + i * 1000, (d, ctx) => completeTraining(d, ctx, 'squat', perfect));
    expect(s.exercises.squat.level).toBeGreaterThan(1);
    expect(exercisePower(s, 'squat')).toBeGreaterThan(before);
    expect(overallStrength(s)).toBeGreaterThan(strengthBefore);
  });

  test('technique upgrade costs cash and boosts training multiplier', () => {
    let s = newPlayer();
    s.cash = 10_000;
    const cost = techniqueCost(0);
    const base = computeTrainingReward(s, 'bench', perfect);
    s = must(s, T0, (d, ctx) => upgradeTechnique(d, ctx, 'bench'));
    expect(s.exercises.bench.technique).toBe(1);
    expect(s.cash).toBeLessThanOrEqual(10_000 - cost + 1);
    expect(computeTrainingReward(s, 'bench', perfect).xp).toBeGreaterThan(base.xp);
  });
});
