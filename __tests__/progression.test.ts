import { ECONOMY, levelUpCash, maxEnergy, xpForLevel, grantXp, currentEnergy } from '../src/game';
import { must, newPlayer, T0 } from './helpers';

describe('XP & leveling', () => {
  test('xp curve is increasing', () => {
    for (let l = 1; l < 50; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
  });

  test('granting exactly enough XP levels up once and carries remainder', () => {
    const s = newPlayer();
    const cashBefore = s.cash;
    const need = xpForLevel(1);
    const after = must(s, T0, (d, ctx) => grantXp(d, ctx, need + 5));
    expect(after.level).toBe(2);
    expect(after.xp).toBe(5);
    expect(after.cash).toBe(cashBefore + levelUpCash(2));
  });

  test('large XP grants roll over multiple levels and emit level-up effects', () => {
    const s = newPlayer();
    let total = 0;
    for (let l = 1; l < 6; l++) total += xpForLevel(l);
    const r = must(s, T0, (d, ctx) => {
      grantXp(d, ctx, total);
    });
    expect(r.level).toBe(6);
    expect(r.xp).toBe(0);
    // level 5 is a gem milestone
    expect(r.gems).toBeGreaterThanOrEqual(s.gems + ECONOMY.levels.gemsPerMilestone);
  });

  test('level up refills energy to the new max', () => {
    const s = newPlayer();
    s.energy = 0;
    s.energyUpdatedAt = T0;
    const r = must(s, T0, (d, ctx) => grantXp(d, ctx, xpForLevel(1)));
    expect(currentEnergy(r, T0)).toBe(maxEnergy(2));
  });

  test('level-unlocked cosmetic items are granted automatically', () => {
    const s = newPlayer();
    expect(s.inventory.shirt_tee_red).toBeUndefined();
    const r = must(s, T0, (d, ctx) => grantXp(d, ctx, xpForLevel(1)));
    expect(r.inventory.shirt_tee_red).toBeDefined(); // level 2 item
  });
});
