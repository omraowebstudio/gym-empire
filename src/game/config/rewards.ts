import type { GameEventType } from '../types';

/** A reward descriptor; cash scales with the player's current income so rewards stay meaningful. */
export interface RewardSpec {
  cashFloor?: number;
  cashMinutes?: number; // minutes of current net income
  xp?: number;
  xpPerLevel?: number;
  gems?: number;
  energy?: number;
  itemId?: string;
  /** gems granted instead if the item is already owned */
  duplicateGems?: number;
}

export interface DailyRewardDay {
  day: number; // 1..7
  label: string;
  reward: RewardSpec;
}

export const DAILY_REWARDS: DailyRewardDay[] = [
  { day: 1, label: 'Cash', reward: { cashFloor: 250, cashMinutes: 20 } },
  { day: 2, label: 'XP Boost', reward: { xp: 80, xpPerLevel: 15 } },
  { day: 3, label: 'Cash', reward: { cashFloor: 500, cashMinutes: 35, energy: 10 } },
  { day: 4, label: 'Decoration', reward: { itemId: 'deco_plant', duplicateGems: 10, cashFloor: 300, cashMinutes: 15 } },
  { day: 5, label: 'Gems', reward: { gems: 20 } },
  { day: 6, label: 'Clothing', reward: { itemId: 'shirt_stringer_gold', duplicateGems: 15, xp: 100, xpPerLevel: 10 } },
  { day: 7, label: 'Premium', reward: { itemId: 'bar_gold', duplicateGems: 20, gems: 25, cashFloor: 1000, cashMinutes: 60 } },
];

// ---- Weekly events ----

export interface EventTokenRule {
  event: GameEventType;
  tokens: number;
  exercise?: string;
  compType?: string;
  label: string;
}

export interface EventMilestone {
  tokens: number;
  reward: RewardSpec;
}

export interface EventDef {
  id: string;
  name: string;
  tagline: string;
  color: string;
  color2: string;
  icon: string;
  rules: EventTokenRule[];
  milestones: EventMilestone[];
}

export const EVENTS: EventDef[] = [
  {
    id: 'bench_week', name: 'Bench Week', tagline: 'Press your way to glory!', color: '#3D7BFF', color2: '#1B2C7A', icon: '🏋️',
    rules: [
      { event: 'train', exercise: 'bench', tokens: 5, label: 'Bench Press session' },
      { event: 's_grade', tokens: 3, label: 'S grade in any training' },
      { event: 'compete', compType: 'bench', tokens: 15, label: 'Enter a Bench competition' },
      { event: 'compete_win', compType: 'bench', tokens: 15, label: 'Win a Bench competition' },
    ],
    milestones: [
      { tokens: 25, reward: { cashFloor: 500, cashMinutes: 20 } },
      { tokens: 60, reward: { gems: 10 } },
      { tokens: 110, reward: { itemId: 'shirt_bench_week', duplicateGems: 20 } },
      { tokens: 180, reward: { xp: 200, xpPerLevel: 20, cashFloor: 2000, cashMinutes: 60 } },
      { tokens: 260, reward: { itemId: 'bar_neon', duplicateGems: 30, gems: 15 } },
    ],
  },
  {
    id: 'squat_championship', name: 'Squat Championship', tagline: 'Deep squats. Big rewards.', color: '#8B5CFF', color2: '#3A1B7A', icon: '🦵',
    rules: [
      { event: 'train', exercise: 'squat', tokens: 5, label: 'Squat session' },
      { event: 'train', exercise: 'legpress', tokens: 4, label: 'Leg Press session' },
      { event: 'compete', compType: 'squat', tokens: 15, label: 'Enter a Squat competition' },
      { event: 'compete_win', compType: 'squat', tokens: 15, label: 'Win a Squat competition' },
    ],
    milestones: [
      { tokens: 25, reward: { cashFloor: 500, cashMinutes: 20 } },
      { tokens: 60, reward: { gems: 10 } },
      { tokens: 110, reward: { itemId: 'shorts_purple', duplicateGems: 20 } },
      { tokens: 180, reward: { xp: 200, xpPerLevel: 20, cashFloor: 2000, cashMinutes: 60 } },
      { tokens: 260, reward: { gems: 40 } },
    ],
  },
  {
    id: 'deadlift_challenge', name: 'Deadlift Challenge', tagline: 'Pick it up. Put it down. Repeat.', color: '#FF4D6D', color2: '#6E1022', icon: '💀',
    rules: [
      { event: 'train', exercise: 'deadlift', tokens: 5, label: 'Deadlift session' },
      { event: 'perfect_rep', tokens: 1, label: 'PERFECT rep' },
      { event: 'compete', compType: 'deadlift', tokens: 15, label: 'Enter a Deadlift competition' },
      { event: 'compete_win', compType: 'deadlift', tokens: 15, label: 'Win a Deadlift competition' },
    ],
    milestones: [
      { tokens: 25, reward: { cashFloor: 500, cashMinutes: 20 } },
      { tokens: 60, reward: { gems: 10 } },
      { tokens: 110, reward: { itemId: 'shirt_deadlift', duplicateGems: 20 } },
      { tokens: 180, reward: { xp: 200, xpPerLevel: 20, cashFloor: 2000, cashMinutes: 60 } },
      { tokens: 260, reward: { itemId: 'theme_lava', duplicateGems: 40 } },
    ],
  },
  {
    id: 'gym_expansion', name: 'Gym Expansion Week', tagline: 'Build bigger. Build better.', color: '#FFC83D', color2: '#7A5A10', icon: '🏗️',
    rules: [
      { event: 'buy_equipment', tokens: 12, label: 'Buy equipment' },
      { event: 'upgrade_equipment', tokens: 6, label: 'Upgrade equipment' },
      { event: 'upgrade_facility', tokens: 8, label: 'Upgrade a facility' },
      { event: 'recruit', tokens: 2, label: 'New member joins' },
    ],
    milestones: [
      { tokens: 25, reward: { cashFloor: 500, cashMinutes: 20 } },
      { tokens: 60, reward: { gems: 10 } },
      { tokens: 110, reward: { itemId: 'deco_boombox', duplicateGems: 20 } },
      { tokens: 180, reward: { cashFloor: 4000, cashMinutes: 90 } },
      { tokens: 260, reward: { itemId: 'db_purple', duplicateGems: 30, gems: 15 } },
    ],
  },
  {
    id: 'equipment_collection', name: 'Equipment Collection Event', tagline: 'Gear up and show off your collection.', color: '#00C2A8', color2: '#0B4F47', icon: '🎒',
    rules: [
      { event: 'buy_equipment', tokens: 10, label: 'Buy equipment' },
      { event: 'item_acquired', tokens: 10, label: 'Collect a new item' },
      { event: 'collect_income', tokens: 3, label: 'Collect gym income' },
      { event: 'train', tokens: 2, label: 'Any training session' },
    ],
    milestones: [
      { tokens: 25, reward: { cashFloor: 500, cashMinutes: 20 } },
      { tokens: 60, reward: { gems: 10 } },
      { tokens: 110, reward: { itemId: 'acc_headphones', duplicateGems: 20 } },
      { tokens: 180, reward: { xp: 200, xpPerLevel: 20, energy: 20 } },
      { tokens: 260, reward: { gems: 40 } },
    ],
  },
];

export const EVENT_MAP: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

/** Level milestones shown on the progression roadmap (features unlocked by level). */
export const LEVEL_UNLOCKS: { level: number; label: string; icon: string }[] = [
  { level: 2, label: 'Deadlift unlocked', icon: '💀' },
  { level: 3, label: 'Hire Staff + Overhead Press', icon: '🧑‍💼' },
  { level: 4, label: 'Lat Pulldown', icon: '🦅' },
  { level: 5, label: 'Neighborhood Gym + Leg Press + Regional Open', icon: '🏘️' },
  { level: 6, label: 'Lateral Raise', icon: '🪽' },
  { level: 10, label: 'Commercial Gym', icon: '🏢' },
  { level: 12, label: 'National Championship', icon: '🇺🇸' },
  { level: 16, label: 'Hardcore Gym', icon: '🔥' },
  { level: 22, label: 'Premium Club + World Games', icon: '🌍' },
  { level: 30, label: 'Pro Training Center', icon: '🏟️' },
  { level: 35, label: 'Legends Invitational', icon: '🐐' },
  { level: 40, label: 'Elite Fitness Empire', icon: '👑' },
];
