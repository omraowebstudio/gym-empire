import { ECONOMY } from './config/economy';
import { EXERCISES } from './config/exercises';
import { DEFAULT_ITEM_IDS } from './config/items';
import { LOCATION_MAP, slotIds } from './config/locations';
import type { CounterKey, ExerciseId, ExerciseProgress, GameState, LocationId, LocationState } from './types';

export const COUNTER_KEYS: CounterKey[] = [
  'trainings', 'perfectReps', 'competitions', 'competitionWins', 'cashEarned', 'equipmentBought',
  'equipmentUpgrades', 'facilityUpgrades', 'membersRecruited', 'staffHired', 'staffUpgrades',
  'incomeCollections', 'missionsCompleted', 'dailyClaims', 'techniqueUpgrades', 'locationsUnlocked',
  'itemsCollected', 'sGrades',
];

export function createLocationState(id: LocationId): LocationState {
  const def = LOCATION_MAP[id];
  const slots: LocationState['slots'] = {};
  for (const s of slotIds(id)) slots[s] = null;
  return {
    id,
    slots,
    facilities: { flooring: 0, lighting: 0, mirrors: 0, reception: 0 },
    members: [],
    recruitProgress: 0,
    decorations: Array.from({ length: def.decorationSlots }, () => null),
    theme: null,
  };
}

export function createInitialState(now: number): GameState {
  const exercises = {} as Record<ExerciseId, ExerciseProgress>;
  for (const e of EXERCISES) {
    exercises[e.id] = { level: 1, xp: 0, technique: 0, sessions: 0, bestScore: 0 };
  }
  const counters = {} as Record<CounterKey, number>;
  for (const k of COUNTER_KEYS) counters[k] = 0;

  const garage = createLocationState('garage');
  garage.slots.s0 = { itemId: 'dumbbell_rack', level: 1 };
  garage.slots.s1 = { itemId: 'flat_bench', level: 1 };

  const inventory: Record<string, number> = {};
  for (const id of DEFAULT_ITEM_IDS) inventory[id] = now;

  return {
    version: ECONOMY.save.version,
    createdAt: now,
    lastTickAt: now,
    profile: {
      name: 'Rookie',
      appearance: {
        skin: 1,
        hair: 'short',
        hairColor: 0,
        shirt: 'shirt_tee_blue',
        shorts: 'shorts_navy',
        shoes: 'shoes_white',
        accessory: 'acc_none',
      },
      onboarded: false,
    },
    level: 1,
    xp: 0,
    cash: ECONOMY.start.cash,
    gems: ECONOMY.start.gems,
    energy: ECONOMY.start.energy,
    energyUpdatedAt: now,
    exercises,
    currentLocation: 'garage',
    locations: { garage },
    staff: [],
    pendingOffline: null,
    tipJar: 0,
    boosts: [],
    counters,
    missions: { dateKey: '', missions: [], bonusClaimed: false },
    dailyReward: { lastClaimDate: null, nextDay: 0, cycle: 0, totalClaims: 0, adBonusDate: null },
    achievements: {},
    inventory,
    skins: { barbell: 'bar_steel', dumbbell: 'db_chrome' },
    competition: {
      records: { bench: 0, squat: 0, deadlift: 0, total: 0, weekly: 0 },
      history: [],
      wins: {},
      weekKey: '',
      weeklyChampionshipDone: false,
      leaguePoints: 0,
      active: null,
    },
    event: { eventId: '', weekKey: '', tokens: 0, claimed: [], progress: {} },
    settings: {
      sound: true,
      music: true,
      haptics: true,
      reducedMotion: false,
      personalizedAds: false,
      consentAsked: false,
    },
    monetization: {
      removeAds: false,
      processedTransactions: [],
      entitlements: [],
      rewardedAdsDate: null,
      rewardedAdsCount: 0,
    },
    idCounter: 1,
  };
}

export function nextId(state: GameState, prefix: string): string {
  const id = `${prefix}${state.idCounter}`;
  state.idCounter += 1;
  return id;
}
