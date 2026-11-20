// End-to-end user journeys from a fresh install, exercising the engine like the UI does.
import {
  act,
  buyEquipment,
  claimDaily,
  claimMission,
  collectOffline,
  completeOnboarding,
  completeTraining,
  createInitialState,
  netIncomePerMin,
  playCompetitionRound,
  setAppearance,
  startCompetition,
  tick,
  upgradeEquipment,
  type GameState,
} from '../src/game';
import { SaveManager } from '../src/storage/saveManager';
import { MemoryStorageAdapter } from '../src/storage/storageAdapter';
import { HOUR, MIN, rng, T0 } from './helpers';

function step(s: GameState, now: number, fn: Parameters<typeof act>[2]) {
  const r = act(s, now, fn, { rng: rng(now % 1000) });
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

test('fresh install → onboard → train → build → compete → close → reopen → collect', async () => {
  const storage = new MemoryStorageAdapter();
  const saves = new SaveManager(storage);
  expect((await saves.load(T0)).status).toBe('empty');

  let s = createInitialState(T0);
  expect(s.profile.onboarded).toBe(false);
  s = step(s, T0, (d, ctx) => completeOnboarding(d, ctx, 'Journey', { ...d.profile.appearance, hair: 'mohawk', skin: 3 }));
  expect(s.profile.onboarded).toBe(true);
  expect(s.profile.appearance.hair).toBe('mohawk');

  // Claim daily reward and train a few times.
  s = step(s, T0 + 1000, (d, ctx) => claimDaily(d, ctx));
  let t = T0 + 2000;
  for (let i = 0; i < 4; i++) {
    t += 20_000;
    s = step(s, t, (d, ctx) => tick(d, ctx));
    s = step(s, t, (d, ctx) => completeTraining(d, ctx, 'bench', { challenge: 'timing', reps: 5, perfects: 4, goods: 1, misses: 0, score: 0.9 }));
  }
  expect(s.counters.trainings).toBe(4);
  expect(s.level).toBeGreaterThanOrEqual(2);

  // Claim the training mission.
  const trainMission = s.missions.missions.find((m) => m.defId === 'train')!;
  if (trainMission.progress >= trainMission.target) s = step(s, t, (d, ctx) => claimMission(d, ctx, trainMission.id));

  // Build the gym.
  const incomeBefore = netIncomePerMin(s, t);
  s = step(s, t, (d, ctx) => buyEquipment(d, ctx, 'garage', 's2', 'dumbbell_rack'));
  s = step(s, t, (d, ctx) => upgradeEquipment(d, ctx, 'garage', 's0'));
  // Let members join over a few minutes of live play.
  for (let i = 0; i < 40; i++) {
    t += 10_000;
    s = step(s, t, (d, ctx) => tick(d, ctx));
  }
  expect(netIncomePerMin(s, t)).toBeGreaterThan(incomeBefore);

  // Compete.
  s = step(s, t, (d, ctx) => startCompetition(d, ctx, 'bench', 0));
  while (s.competition.active) s = step(s, ++t, (d, ctx) => playCompetitionRound(d, ctx, 0.8));
  expect(s.competition.history).toHaveLength(1);

  // Customise with an unlocked item.
  s = step(s, t, (d, ctx) => setAppearance(d, ctx, { shirt: 'shirt_tee_red' }));

  // Close the app (save), reopen 45 minutes later.
  await saves.save(s, t);
  const reopenAt = t + 45 * MIN;
  const loaded = await saves.load(reopenAt);
  if (loaded.status !== 'loaded') throw new Error('load failed');
  expect(loaded.state).toEqual(s);
  const perMin = netIncomePerMin(loaded.state, t);
  let r = step(loaded.state, reopenAt, (d, ctx) => tick(d, ctx));
  expect(r.pendingOffline!.total).toBe(Math.floor(perMin * 45));
  const cash = r.cash;
  r = step(r, reopenAt, (d, ctx) => collectOffline(d, ctx, 'normal'));
  expect(r.cash).toBe(cash + Math.floor(perMin * 45));

  // Reopening again immediately must not re-award.
  await saves.save(r, reopenAt);
  const again = await saves.load(reopenAt + 1000);
  if (again.status !== 'loaded') throw new Error('load failed');
  const r2 = step(again.state, reopenAt + 1000, (d, ctx) => tick(d, ctx));
  expect(r2.pendingOffline).toBeNull();
});

test('a player who ignores ads entirely can still progress to the second gym', () => {
  let s = createInitialState(T0);
  s = step(s, T0, (d, ctx) => completeOnboarding(d, ctx, 'NoAds', d.profile.appearance));
  let t = T0;
  // Simulate 3 days of light play: train 8x and collect offline each session (4 sessions/day).
  for (let session = 0; session < 12; session++) {
    t += 3 * HOUR;
    s = step(s, t, (d, ctx) => tick(d, ctx));
    if (s.pendingOffline) s = step(s, t, (d, ctx) => collectOffline(d, ctx, 'normal'));
    try { s = step(s, t, (d, ctx) => claimDaily(d, ctx)); } catch { /* already claimed */ }
    for (let i = 0; i < 8; i++) {
      t += 15_000;
      s = step(s, t, (d, ctx) => tick(d, ctx));
      try {
        s = step(s, t, (d, ctx) => completeTraining(d, ctx, i % 2 ? 'squat' : 'bench', { challenge: 'timing', reps: 5, perfects: 3, goods: 2, misses: 0, score: 0.8 }));
      } catch { /* out of energy */ }
    }
    for (const m of s.missions.missions) {
      if (!m.claimed && m.progress >= m.target) s = step(s, t, (d, ctx) => claimMission(d, ctx, m.id));
    }
    // Spend: fill empty slots, then upgrade cheapest equipment.
    const g = s.locations.garage!;
    for (const slot of Object.keys(g.slots)) {
      if (!s.locations.garage!.slots[slot]) {
        try { s = step(s, t, (d, ctx) => buyEquipment(d, ctx, 'garage', slot, 'treadmill')); } catch { /* cash */ }
      }
    }
    for (const slot of Object.keys(g.slots)) {
      try { s = step(s, t, (d, ctx) => upgradeEquipment(d, ctx, 'garage', slot)); } catch { /* cash */ }
    }
  }
  expect(s.level).toBeGreaterThanOrEqual(5);
  expect(netIncomePerMin(s, t)).toBeGreaterThan(50);
});
