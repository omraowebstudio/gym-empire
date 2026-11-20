import { validateSubmission, recomputeStrength } from '../src/services/leaderboard/validation';
import { LocalLeaderboardService } from '../src/services/leaderboard/leaderboardService';
import { overallStrength } from '../src/game';
import { newPlayer, T0, HOUR } from './helpers';

describe('leaderboard validation', () => {
  test('strength must match server recomputation from evidence', () => {
    const s = newPlayer();
    const ex = Object.fromEntries(Object.entries(s.exercises).map(([k, v]) => [k, { level: v.level, technique: v.technique }]));
    expect(recomputeStrength(ex)).toBe(overallStrength(s));
    expect(validateSubmission({ category: 'strength', value: overallStrength(s), submittedAt: T0, evidence: { exercises: ex } }, null, T0).ok).toBe(true);
    expect(validateSubmission({ category: 'strength', value: 99999, submittedAt: T0, evidence: { exercises: ex } }, null, T0).ok).toBe(false);
  });

  test('rejects implausible jumps, out-of-range values and skewed clocks', () => {
    expect(validateSubmission({ category: 'level', value: 50, submittedAt: T0 }, { value: 5, submittedAt: T0 - HOUR }, T0).ok).toBe(false);
    expect(validateSubmission({ category: 'level', value: 8, submittedAt: T0 }, { value: 5, submittedAt: T0 - HOUR }, T0).ok).toBe(true);
    expect(validateSubmission({ category: 'level', value: 101, submittedAt: T0 }, null, T0).ok).toBe(false);
    expect(validateSubmission({ category: 'members', value: -1, submittedAt: T0 }, null, T0).ok).toBe(false);
    expect(validateSubmission({ category: 'members', value: 10, submittedAt: T0 + 3 * HOUR }, null, T0).ok).toBe(false);
  });

  test('local boards rank the player honestly among a fixed rival field', async () => {
    const svc = new LocalLeaderboardService();
    const s = newPlayer();
    const a = await svc.getBoard('level', s, T0);
    expect(a).toHaveLength(50);
    const rivalsA = a.filter((e) => !e.isPlayer).map((e) => e.value);
    s.level = 60;
    const b = await svc.getBoard('level', s, T0);
    const rivalsB = b.filter((e) => !e.isPlayer).map((e) => e.value);
    expect(rivalsB).toEqual(rivalsA); // rivals don't scale to the player
    expect(b.find((e) => e.isPlayer)!.rank).toBeLessThan(a.find((e) => e.isPlayer)!.rank);
  });
});
