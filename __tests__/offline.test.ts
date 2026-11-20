import { baseIncomePerMin, collectOffline, computeOfflineEarnings, ECONOMY, netIncomePerMin, offlineCapSeconds, tick, adIncomeBoost } from '../src/game';
import { act } from '../src/game/engine';
import { HOUR, MIN, must, newPlayer, rng, run, T0 } from './helpers';

describe('offline earnings', () => {
  test('30 minutes away at a known rate yields rate × 30 (spec example)', () => {
    const s = newPlayer();
    const perMin = netIncomePerMin(s, T0);
    const r = must(s, T0 + 30 * MIN, (d, ctx) => tick(d, ctx));
    expect(r.pendingOffline).not.toBeNull();
    expect(r.pendingOffline!.total).toBe(Math.floor(perMin * 30));
    expect(r.pendingOffline!.seconds).toBe(1800);
    // Cash is not added until collected.
    expect(r.cash).toBe(s.cash);
  });

  test('earnings are capped at the configured maximum period', () => {
    const s = newPlayer();
    const perMin = netIncomePerMin(s, T0);
    const r = must(s, T0 + 48 * HOUR, (d, ctx) => tick(d, ctx));
    const cap = ECONOMY.offline.baseCapHours * 3600;
    expect(offlineCapSeconds(s)).toBe(cap);
    expect(r.pendingOffline!.seconds).toBe(cap);
    expect(r.pendingOffline!.total).toBe(Math.floor((perMin * cap) / 60));
  });

  test('repeated ticks never double count the same time span', () => {
    const s = newPlayer();
    const a = must(s, T0 + 30 * MIN, (d, ctx) => tick(d, ctx));
    const b = must(a, T0 + 30 * MIN, (d, ctx) => tick(d, ctx)); // same timestamp again
    expect(b.pendingOffline!.total).toBe(a.pendingOffline!.total);
    // a later uncollected absence adds only the new span, still within the cap
    const c = must(b, T0 + 60 * MIN, (d, ctx) => tick(d, ctx));
    expect(c.pendingOffline!.seconds).toBe(3600);
  });

  test('multiple uncollected absences cannot exceed the cap in total', () => {
    let s = newPlayer();
    s = must(s, T0 + 90 * MIN, (d, ctx) => tick(d, ctx));
    s = must(s, T0 + 180 * MIN, (d, ctx) => tick(d, ctx));
    expect(s.pendingOffline!.seconds).toBe(offlineCapSeconds(s));
  });

  test('collecting adds cash once and clears the report', () => {
    const s = must(newPlayer(), T0 + 30 * MIN, (d, ctx) => tick(d, ctx));
    const total = s.pendingOffline!.total;
    const r = must(s, T0 + 30 * MIN, (d, ctx) => collectOffline(d, ctx, 'normal'));
    expect(r.cash).toBe(s.cash + total);
    expect(r.pendingOffline).toBeNull();
    expect(run(r, T0 + 30 * MIN, (d, ctx) => collectOffline(d, ctx, 'normal')).ok).toBe(false);
  });

  test('rewarded-ad collection doubles the payout', () => {
    const s = must(newPlayer(), T0 + 30 * MIN, (d, ctx) => tick(d, ctx));
    const total = s.pendingOffline!.total;
    const r = act(s, T0 + 30 * MIN, (d, ctx) => collectOffline(d, ctx, 'ad'), { rng: rng(), rewardedAd: true });
    expect(r.ok).toBe(true);
    expect(r.state.cash).toBe(s.cash + total * 2);
    expect(r.state.monetization.rewardedAdsCount).toBe(1);
  });

  test('a clock moved backwards awards nothing', () => {
    const s = newPlayer();
    const r = must(s, T0 - 5 * HOUR, (d, ctx) => tick(d, ctx));
    expect(r.pendingOffline).toBeNull();
    expect(r.cash).toBe(s.cash);
    expect(r.lastTickAt).toBe(T0 - 5 * HOUR);
  });

  test('breakdown includes boost bonus only for the boosted overlap', () => {
    let s = newPlayer();
    s = act(s, T0, (d, ctx) => adIncomeBoost(d, ctx), { rng: rng(), rewardedAd: true }).state; // 30 min 2x
    const r = computeOfflineEarnings(s, 3600);
    const base = baseIncomePerMin(s);
    expect(r.boostBonus).toBeCloseTo(base * 30, 0);
    expect(r.total).toBe(Math.floor(r.gross + r.managerBonus + r.boostBonus - r.salaries));
  });
});
