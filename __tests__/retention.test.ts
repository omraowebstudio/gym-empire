import {
  claimAchievement,
  claimDaily,
  claimDailyAdBonus,
  claimEventMilestone,
  claimMission,
  claimMissionBonus,
  completeTraining,
  ECONOMY,
  tick,
  type ChallengeOutcome,
} from '../src/game';
import { act } from '../src/game/engine';
import { DAILY_REWARDS, EVENT_MAP } from '../src/game/config/rewards';
import { dateKey } from '../src/game/utils/time';
import { DAY, HOUR, must, newPlayer, rng, run, T0 } from './helpers';

const good: ChallengeOutcome = { challenge: 'timing', reps: 5, perfects: 3, goods: 2, misses: 0, score: 0.85 };

describe('daily missions', () => {
  test('a fresh player gets the configured number of missions for today', () => {
    const s = newPlayer();
    expect(s.missions.dateKey).toBe(dateKey(T0));
    expect(s.missions.missions).toHaveLength(ECONOMY.missions.perDay);
    expect(s.missions.missions[0].defId).toBe('train');
  });

  test('progress is tracked and persists across ticks on the same day', () => {
    let s = newPlayer();
    s = must(s, T0 + 1000, (d, ctx) => completeTraining(d, ctx, 'bench', good));
    const m = s.missions.missions.find((x) => x.defId === 'train')!;
    expect(m.progress).toBe(1);
    s = must(s, T0 + 2 * HOUR, (d, ctx) => tick(d, ctx));
    expect(s.missions.missions.find((x) => x.defId === 'train')!.progress).toBe(1);
  });

  test('missions refresh at the next local day and old progress is replaced', () => {
    let s = newPlayer();
    s = must(s, T0 + 1000, (d, ctx) => completeTraining(d, ctx, 'bench', good));
    const next = must(s, T0 + DAY, (d, ctx) => tick(d, ctx));
    expect(next.missions.dateKey).toBe(dateKey(T0 + DAY));
    expect(next.missions.missions.every((m) => m.progress === 0)).toBe(true);
  });

  test('missions are deterministic for the same day (reopening the app does not reroll)', () => {
    const a = newPlayer();
    const b = must(a, T0 + 5000, (d, ctx) => tick(d, ctx));
    expect(b.missions.missions.map((m) => m.defId)).toEqual(a.missions.missions.map((m) => m.defId));
  });

  test('completed missions can be claimed exactly once', () => {
    let s = newPlayer();
    const target = s.missions.missions[0].target;
    for (let i = 0; i < target; i++) s = must(s, T0 + i * 1000, (d, ctx) => completeTraining(d, ctx, 'bench', good));
    const id = s.missions.missions[0].id;
    const reward = s.missions.missions[0].rewardCash;
    const before = s.cash;
    s = must(s, T0 + 10_000, (d, ctx) => claimMission(d, ctx, id));
    expect(s.cash).toBeGreaterThanOrEqual(before + reward);
    expect(s.counters.missionsCompleted).toBe(1);
    expect(run(s, T0 + 10_000, (d, ctx) => claimMission(d, ctx, id)).ok).toBe(false);
  });

  test('incomplete missions cannot be claimed and bonus needs all claimed', () => {
    const s = newPlayer();
    expect(run(s, T0, (d, ctx) => claimMission(d, ctx, s.missions.missions[1].id)).ok).toBe(false);
    expect(run(s, T0, (d, ctx) => claimMissionBonus(d, ctx)).ok).toBe(false);
  });

  test('bonus chest is claimable once after all missions are claimed', () => {
    let s = newPlayer();
    for (const m of s.missions.missions) m.progress = m.target;
    for (const m of s.missions.missions) s = must(s, T0, (d, ctx) => claimMission(d, ctx, m.id));
    const gems = s.gems;
    s = must(s, T0, (d, ctx) => claimMissionBonus(d, ctx));
    expect(s.gems).toBeGreaterThanOrEqual(gems + ECONOMY.missions.bonusGems);
    expect(run(s, T0, (d, ctx) => claimMissionBonus(d, ctx)).ok).toBe(false);
  });
});

describe('daily login rewards', () => {
  test('claimable once per day', () => {
    let s = newPlayer();
    s = must(s, T0, (d, ctx) => claimDaily(d, ctx));
    expect(s.dailyReward.nextDay).toBe(1);
    expect(run(s, T0 + HOUR, (d, ctx) => claimDaily(d, ctx)).ok).toBe(false);
    s = must(s, T0 + DAY, (d, ctx) => claimDaily(d, ctx));
    expect(s.dailyReward.nextDay).toBe(2);
  });

  test('missing days does not reset the calendar (no streak loss)', () => {
    let s = newPlayer();
    s = must(s, T0, (d, ctx) => claimDaily(d, ctx));
    s = must(s, T0 + 5 * DAY, (d, ctx) => claimDaily(d, ctx));
    expect(s.dailyReward.nextDay).toBe(2);
  });

  test('day 4 grants its decoration; a full cycle wraps and duplicate items become gems', () => {
    let s = newPlayer();
    for (let i = 0; i < 7; i++) s = must(s, T0 + i * DAY, (d, ctx) => claimDaily(d, ctx));
    expect(s.inventory.deco_plant).toBeDefined();
    expect(s.inventory.bar_gold).toBeDefined();
    expect(s.dailyReward.cycle).toBe(1);
    expect(s.dailyReward.nextDay).toBe(0);
    // cycle 2, day 4 again: item owned -> duplicate gems
    for (let i = 7; i < 10; i++) s = must(s, T0 + i * DAY, (d, ctx) => claimDaily(d, ctx));
    const gems = s.gems;
    s = must(s, T0 + 10 * DAY, (d, ctx) => claimDaily(d, ctx));
    expect(s.gems).toBe(gems + (DAILY_REWARDS[3].reward.duplicateGems ?? 0));
  });

  test('ad bonus requires a claim first and only works once a day', () => {
    let s = newPlayer();
    const opts = { rng: rng(), rewardedAd: true };
    expect(act(s, T0, (d, ctx) => claimDailyAdBonus(d, ctx), opts).ok).toBe(false);
    s = must(s, T0, (d, ctx) => claimDaily(d, ctx));
    const r = act(s, T0, (d, ctx) => claimDailyAdBonus(d, ctx), opts);
    expect(r.ok).toBe(true);
    expect(act(r.state, T0, (d, ctx) => claimDailyAdBonus(d, ctx), opts).ok).toBe(false);
  });
});

describe('achievements', () => {
  test('FIRST REP unlocks after training and its reward can be claimed only once', () => {
    let s = newPlayer();
    expect(s.achievements.first_gym).toBeDefined(); // onboarding
    expect(s.achievements.first_rep).toBeUndefined();
    s = must(s, T0, (d, ctx) => completeTraining(d, ctx, 'bench', good));
    expect(s.achievements.first_rep).toBeDefined();
    const gems = s.gems;
    s = must(s, T0, (d, ctx) => claimAchievement(d, ctx, 'first_rep'));
    expect(s.gems).toBe(gems + 5);
    expect(run(s, T0, (d, ctx) => claimAchievement(d, ctx, 'first_rep')).ok).toBe(false);
  });

  test('locked achievements cannot be claimed', () => {
    const s = newPlayer();
    expect(run(s, T0, (d, ctx) => claimAchievement(d, ctx, 'legend')).ok).toBe(false);
  });
});

describe('weekly events', () => {
  test('an event is active and earns tokens from matching actions', () => {
    let s = newPlayer();
    const ev = EVENT_MAP[s.event.eventId];
    expect(ev).toBeDefined();
    s.event.tokens = 0;
    s = must(s, T0, (d, ctx) => completeTraining(d, ctx, 'bench', good));
    const trainRule = ev.rules.find((r) => r.event === 'train' && (!r.exercise || r.exercise === 'bench'));
    if (trainRule) expect(s.event.tokens).toBeGreaterThan(0);
  });

  test('milestones claim once and require tokens', () => {
    let s = newPlayer();
    expect(run(s, T0, (d, ctx) => claimEventMilestone(d, ctx, 0)).ok).toBe(false);
    s.event.tokens = 30;
    s = must(s, T0, (d, ctx) => claimEventMilestone(d, ctx, 0));
    expect(run(s, T0, (d, ctx) => claimEventMilestone(d, ctx, 0)).ok).toBe(false);
  });

  test('a new week rotates to a fresh event state', () => {
    let s = newPlayer();
    s.event.tokens = 99;
    s = must(s, T0 + 7 * DAY, (d, ctx) => tick(d, ctx));
    expect(s.event.tokens).toBe(0);
  });
});
