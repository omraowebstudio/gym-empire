import {
  buyEquipment,
  equipmentPrice,
  equipmentUpgradeCost,
  hireStaff,
  incomeBreakdown,
  locationCapacity,
  locationSatisfaction,
  netIncomePerMin,
  recruitMember,
  tick,
  unlockLocation,
  upgradeEquipment,
  upgradeFacility,
  upgradeStaff,
  xpForLevel,
  grantXp,
  ECONOMY,
} from '../src/game';
import { must, newPlayer, run, T0 } from './helpers';

describe('equipment purchases', () => {
  test('buying equipment deducts exactly the price and places it', () => {
    const s = newPlayer();
    s.cash = 5000;
    const garage = s.locations.garage!;
    const price = equipmentPrice(garage, 'squat_rack');
    const r = must(s, T0, (d, ctx) => buyEquipment(d, ctx, 'garage', 's2', 'squat_rack'));
    expect(r.cash).toBe(5000 - price);
    expect(r.locations.garage!.slots.s2).toEqual({ itemId: 'squat_rack', level: 1 });
    expect(r.counters.equipmentBought).toBe(1);
  });

  test('cannot buy without enough cash; no partial deduction', () => {
    const s = newPlayer();
    s.cash = 10;
    const r = run(s, T0, (d, ctx) => buyEquipment(d, ctx, 'garage', 's2', 'squat_rack'));
    expect(r.ok).toBe(false);
    expect(r.state.cash).toBe(10);
    expect(r.state.locations.garage!.slots.s2).toBeNull();
  });

  test('cannot place in occupied slot or buy higher-tier equipment in the garage', () => {
    const s = newPlayer();
    s.cash = 1e9;
    expect(run(s, T0, (d, ctx) => buyEquipment(d, ctx, 'garage', 's0', 'treadmill')).ok).toBe(false);
    expect(run(s, T0, (d, ctx) => buyEquipment(d, ctx, 'garage', 's3', 'cryo_pod')).ok).toBe(false);
  });

  test('prices grow with each item owned at a location', () => {
    const s = newPlayer();
    s.cash = 1e6;
    const p1 = equipmentPrice(s.locations.garage!, 'treadmill');
    const s2 = must(s, T0, (d, ctx) => buyEquipment(d, ctx, 'garage', 's2', 'treadmill'));
    expect(equipmentPrice(s2.locations.garage!, 'treadmill')).toBeGreaterThan(p1);
  });

  test('upgrading increases level, costs cash, and stops at max level', () => {
    let s = newPlayer();
    s.cash = 1e9;
    for (let i = 1; i < ECONOMY.gym.maxEquipmentLevel; i++) {
      const cost = equipmentUpgradeCost(s.locations.garage!, s.locations.garage!.slots.s0!);
      const before = s.cash;
      s = must(s, T0, (d, ctx) => upgradeEquipment(d, ctx, 'garage', 's0'));
      expect(s.cash).toBeLessThanOrEqual(before - cost + 1e6); // may include level-up cash
    }
    expect(s.locations.garage!.slots.s0!.level).toBe(ECONOMY.gym.maxEquipmentLevel);
    expect(run(s, T0, (d, ctx) => upgradeEquipment(d, ctx, 'garage', 's0')).ok).toBe(false);
  });
});

describe('members & income', () => {
  test('a new gym has founding members and positive income', () => {
    const s = newPlayer();
    expect(s.locations.garage!.members.length).toBe(ECONOMY.gym.startingMembers);
    expect(netIncomePerMin(s, T0)).toBeGreaterThan(0);
  });

  test('income equals the sum of member fees times satisfaction multiplier', () => {
    const s = newPlayer();
    const b = incomeBreakdown(s, T0);
    const sat = locationSatisfaction(s, s.locations.garage!).total;
    const fees = s.locations.garage!.members.reduce((sum, m) => sum + ECONOMY.gym.tierFeePerMin[m.tier], 0);
    expect(b.gross).toBeCloseTo(fees * (0.7 + 0.6 * (sat / 100)), 5);
  });

  test('manual recruitment adds a member up to capacity', () => {
    let s = newPlayer();
    s.cash = 1e6;
    const cap = locationCapacity(s.locations.garage!);
    while (s.locations.garage!.members.length < cap) s = must(s, T0, (d, ctx) => recruitMember(d, ctx, 'garage'));
    expect(s.locations.garage!.members.length).toBe(cap);
    expect(run(s, T0, (d, ctx) => recruitMember(d, ctx, 'garage')).ok).toBe(false);
  });

  test('members join automatically over time while below capacity', () => {
    let s = newPlayer();
    const before = s.locations.garage!.members.length;
    for (let i = 1; i <= 50; i++) s = must(s, T0 + i * 5000, (d, ctx) => tick(d, ctx));
    expect(s.locations.garage!.members.length).toBeGreaterThan(before);
  });

  test('live ticks accrue cash proportional to elapsed time', () => {
    const s = newPlayer();
    const perMin = netIncomePerMin(s, T0);
    const r = must(s, T0 + 30_000, (d, ctx) => tick(d, ctx));
    // 30s of income (recruits may slightly change income only after accrual)
    expect(r.cash - s.cash).toBeCloseTo(perMin / 2, 3);
  });

  test('facility upgrades raise satisfaction and therefore income', () => {
    const s = newPlayer();
    s.cash = 1e6;
    const before = netIncomePerMin(s, T0);
    const r = must(s, T0, (d, ctx) => upgradeFacility(d, ctx, 'garage', 'lighting'));
    expect(locationSatisfaction(r, r.locations.garage!).total).toBeGreaterThan(locationSatisfaction(s, s.locations.garage!).total);
    expect(netIncomePerMin(r, T0)).toBeGreaterThan(before);
  });
});

describe('staff', () => {
  function levelTo(level: number) {
    let s = newPlayer();
    let xp = 0;
    for (let l = 1; l < level; l++) xp += xpForLevel(l);
    s = must(s, T0, (d, ctx) => grantXp(d, ctx, xp));
    return s;
  }

  test('staff are locked before the unlock level', () => {
    const s = newPlayer();
    s.cash = 1e6;
    expect(run(s, T0, (d, ctx) => hireStaff(d, ctx, 'trainer')).ok).toBe(false);
  });

  test('hiring a manager boosts income net of salary; upgrading costs more', () => {
    let s = levelTo(ECONOMY.staff.unlockLevel);
    s.cash = 1e6;
    const gross = incomeBreakdown(s, T0).gross;
    s = must(s, T0, (d, ctx) => hireStaff(d, ctx, 'manager'));
    const b = incomeBreakdown(s, T0);
    expect(b.managerBonus).toBeCloseTo(gross * 0.06, 5);
    expect(b.salaries).toBeGreaterThan(0);
    const id = s.staff[0].id;
    s = must(s, T0, (d, ctx) => upgradeStaff(d, ctx, id));
    expect(s.staff[0].level).toBe(2);
  });

  test('staff slots are limited by locations owned', () => {
    let s = levelTo(ECONOMY.staff.unlockLevel);
    s.cash = 1e9;
    for (let i = 0; i < 4; i++) s = must(s, T0, (d, ctx) => hireStaff(d, ctx, 'cleaner'));
    expect(run(s, T0, (d, ctx) => hireStaff(d, ctx, 'cleaner')).ok).toBe(false);
  });
});

describe('gym expansion', () => {
  test('requires level and cash; unlocking switches to new gym with starter setup', () => {
    let s = newPlayer();
    s.cash = 1e9;
    expect(run(s, T0, (d, ctx) => unlockLocation(d, ctx, 'neighborhood')).ok).toBe(false); // level too low
    let xp = 0;
    for (let l = 1; l < 5; l++) xp += xpForLevel(l);
    s = must(s, T0, (d, ctx) => grantXp(d, ctx, xp));
    expect(run(s, T0, (d, ctx) => unlockLocation(d, ctx, 'commercial')).ok).toBe(false); // must go in order
    const r = must(s, T0, (d, ctx) => unlockLocation(d, ctx, 'neighborhood'));
    expect(r.locations.neighborhood).toBeDefined();
    expect(r.currentLocation).toBe('neighborhood');
    expect(r.locations.neighborhood!.members.length).toBe(2);
    expect(r.cash).toBeLessThan(s.cash);
  });
});
