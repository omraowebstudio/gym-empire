// Central, tunable economy configuration. Every price/reward formula in the
// game reads from here so the economy can be rebalanced without touching
// system code.

export const ECONOMY = {
  save: {
    version: 1,
  },
  start: {
    cash: 300,
    gems: 25,
    energy: 20,
  },
  levels: {
    maxLevel: 100,
    xpBase: 80,
    xpExponent: 1.6,
    cashPerLevel: 150, // * level
    cashLevelExponent: 1.35,
    gemsEveryNLevels: 5,
    gemsPerMilestone: 15,
  },
  energy: {
    baseMax: 20,
    maxPerFiveLevels: 1,
    regenSeconds: 90,
    trainingCost: 2,
    competitionCost: 4,
    refillGemCost: 10,
  },
  training: {
    baseXp: 22,
    xpPerExerciseLevel: 0.1,
    baseCash: 12,
    cashPerExerciseLevel: 0.15,
    exerciseXpBase: 20,
    exerciseXpExponent: 1.15,
    exerciseXpPerSession: 36,
    techniqueBaseCost: 120,
    techniqueCostGrowth: 1.65,
    techniqueXpBonus: 0.12,
    techniquePowerBonus: 3,
    maxTechnique: 20,
    maxExerciseLevel: 200,
  },
  gym: {
    tierFeePerMin: { basic: 3, plus: 6, vip: 12 },
    equipmentQualityPerLevel: 0.12,
    equipmentPriceGrowth: 1.15, // per item already owned at this location
    upgradeCostFactor: 0.55,
    upgradeCostGrowth: 1.45,
    maxEquipmentLevel: 10,
    capacityPerLevels: 3, // +1 capacity every N levels
    facilityMaxLevel: 10,
    facilityCostGrowth: 1.6,
    baseSatisfaction: 50,
    satisfactionPerFacilityLevel: { flooring: 2, lighting: 2, mirrors: 1.5, reception: 1.5 },
    decorationSatisfaction: { common: 1, rare: 2, epic: 3, legendary: 5 },
    crowdingThreshold: 0.9,
    crowdingPenalty: 8,
    satisfactionIncomeMin: 0.7,
    satisfactionIncomeRange: 0.6,
    baseRecruitPerMin: 0.6,
    manualRecruitFeeMinutes: 15, // manual recruit costs N minutes of that member's fee
    tipShare: 0.1, // share of income going to the tip jar
    tipJarCapMinutes: 15,
    startingMembers: 3,
  },
  staff: {
    unlockLevel: 3,
    baseSlots: 2,
    slotsPerLocation: 2,
    maxLevel: 10,
    upgradeGrowth: 1.6,
  },
  offline: {
    baseCapHours: 2,
    minSecondsForReport: 60,
    adMultiplier: 2,
  },
  boosts: {
    adIncomeMultiplier: 2,
    adBoostMinutes: 30,
    maxBoostMinutes: 240,
    gemBoostCost: 20,
    gemBoostMinutes: 60,
  },
  ads: {
    maxRewardedPerDay: 12,
  },
  missions: {
    perDay: 4,
    bonusGems: 10,
    bonusCashMinutes: 20,
  },
} as const;

export function xpForLevel(level: number): number {
  return Math.floor(ECONOMY.levels.xpBase * Math.pow(level, ECONOMY.levels.xpExponent));
}

export function levelUpCash(level: number): number {
  return Math.round(ECONOMY.levels.cashPerLevel * Math.pow(level, ECONOMY.levels.cashLevelExponent));
}

export function levelUpGems(level: number): number {
  return level % ECONOMY.levels.gemsEveryNLevels === 0 ? ECONOMY.levels.gemsPerMilestone : 0;
}

export function maxEnergy(level: number): number {
  return ECONOMY.energy.baseMax + Math.floor(level / 5) * ECONOMY.energy.maxPerFiveLevels;
}

export function exerciseXpForLevel(level: number): number {
  return Math.floor(
    ECONOMY.training.exerciseXpBase * Math.pow(level, ECONOMY.training.exerciseXpExponent),
  );
}

export function techniqueCost(technique: number): number {
  return Math.round(
    ECONOMY.training.techniqueBaseCost * Math.pow(ECONOMY.training.techniqueCostGrowth, technique),
  );
}
