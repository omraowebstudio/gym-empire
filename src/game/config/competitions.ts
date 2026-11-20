import type { CompetitionType } from '../types';

export interface CompetitionTypeDef {
  type: CompetitionType;
  name: string;
  description: string;
  color: string;
  icon: string;
  /** multiplier applied to tier base power to get opponent strength */
  powerScale: number;
  weekly?: boolean;
}

export const COMPETITION_TYPES: CompetitionTypeDef[] = [
  { type: 'bench', name: 'Bench Press Battle', description: 'Pure pressing power.', color: '#3D7BFF', icon: '🏋️', powerScale: 1 },
  { type: 'squat', name: 'Squat Showdown', description: 'Who has the strongest legs in town?', color: '#8B5CFF', icon: '🦵', powerScale: 1.3 },
  { type: 'deadlift', name: 'Deadlift Duel', description: 'Rip it off the floor.', color: '#FF4D6D', icon: '💀', powerScale: 1.5 },
  { type: 'total', name: 'Total Strength Meet', description: 'Bench + Squat + Deadlift combined.', color: '#FFC83D', icon: '🏆', powerScale: 3.8 },
  { type: 'weekly', name: 'Weekly Gym Championship', description: 'Your total strength PLUS your gym reputation. Once per week, free entry.', color: '#00C2A8', icon: '👑', powerScale: 4.6, weekly: true },
];

export const COMPETITION_TYPE_MAP: Record<CompetitionType, CompetitionTypeDef> = Object.fromEntries(
  COMPETITION_TYPES.map((c) => [c.type, c]),
) as Record<CompetitionType, CompetitionTypeDef>;

export interface CompetitionTierDef {
  tier: number;
  name: string;
  unlockLevel: number;
  basePower: number; // bench-equivalent opponent power
  cash: number;
  xp: number;
  firstWinGems: number;
  leagueMult: number;
  color: string;
}

export const COMPETITION_TIERS: CompetitionTierDef[] = [
  { tier: 0, name: 'Local Meet', unlockLevel: 1, basePower: 52, cash: 120, xp: 40, firstWinGems: 5, leagueMult: 1, color: '#9AA4BF' },
  { tier: 1, name: 'Regional Open', unlockLevel: 5, basePower: 85, cash: 900, xp: 110, firstWinGems: 10, leagueMult: 2, color: '#5AD25A' },
  { tier: 2, name: 'National Championship', unlockLevel: 12, basePower: 150, cash: 9000, xp: 280, firstWinGems: 20, leagueMult: 4, color: '#3D7BFF' },
  { tier: 3, name: 'World Games', unlockLevel: 22, basePower: 240, cash: 120000, xp: 700, firstWinGems: 35, leagueMult: 8, color: '#8B5CFF' },
  { tier: 4, name: 'Legends Invitational', unlockLevel: 35, basePower: 380, cash: 2500000, xp: 1800, firstWinGems: 60, leagueMult: 16, color: '#FFC83D' },
];

/** Reward multiplier by final placement. */
export const PLACEMENT_REWARD: Record<number, number> = { 1: 1, 2: 0.6, 3: 0.4, 5: 0.2 };
export const PLACEMENT_LEAGUE_POINTS: Record<number, number> = { 1: 10, 2: 6, 3: 3, 5: 1 };

export const ROUND_NAMES = ['Quarter-final', 'Semi-final', 'Final'];

/** Gym reputation contribution to weekly championship power, per $/min of income (log-scaled). */
export const WEEKLY_GYM_POWER_FACTOR = 40;
