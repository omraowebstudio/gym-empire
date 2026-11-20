import type { GameEventType } from '../types';

export interface MissionDef {
  id: string;
  event: GameEventType;
  title: string; // {n} replaced with target
  icon: string;
  minLevel: number;
  /** target = base + perLevel*level, rounded */
  targetBase: number;
  targetPerLevel: number;
  targetMax: number;
  /** cash reward expressed in minutes of current income (min floor below) */
  rewardIncomeMinutes: number;
  rewardCashFloor: number;
  rewardXp: number;
  rewardGems: number;
  /** if the target is a cash amount, scale it with income minutes instead */
  cashTargetMinutes?: number;
}

export const MISSIONS: MissionDef[] = [
  { id: 'train', event: 'train', title: 'Complete {n} training sessions', icon: '🏋️', minLevel: 1, targetBase: 3, targetPerLevel: 0.1, targetMax: 8, rewardIncomeMinutes: 6, rewardCashFloor: 150, rewardXp: 60, rewardGems: 0 },
  { id: 'perfect', event: 'perfect_rep', title: 'Land {n} PERFECT reps', icon: '🎯', minLevel: 1, targetBase: 8, targetPerLevel: 0.3, targetMax: 25, rewardIncomeMinutes: 6, rewardCashFloor: 150, rewardXp: 60, rewardGems: 0 },
  { id: 'sgrade', event: 's_grade', title: 'Earn an S grade {n} times', icon: '⭐', minLevel: 2, targetBase: 1, targetPerLevel: 0.05, targetMax: 4, rewardIncomeMinutes: 8, rewardCashFloor: 200, rewardXp: 80, rewardGems: 2 },
  { id: 'buy', event: 'buy_equipment', title: 'Buy {n} piece of equipment', icon: '🛒', minLevel: 1, targetBase: 1, targetPerLevel: 0, targetMax: 1, rewardIncomeMinutes: 8, rewardCashFloor: 200, rewardXp: 50, rewardGems: 0 },
  { id: 'upgrade', event: 'upgrade_equipment', title: 'Upgrade equipment {n} times', icon: '⬆️', minLevel: 1, targetBase: 1, targetPerLevel: 0.1, targetMax: 5, rewardIncomeMinutes: 8, rewardCashFloor: 200, rewardXp: 60, rewardGems: 0 },
  { id: 'collect', event: 'collect_income', title: 'Collect gym income {n} times', icon: '💰', minLevel: 1, targetBase: 2, targetPerLevel: 0.05, targetMax: 5, rewardIncomeMinutes: 5, rewardCashFloor: 120, rewardXp: 40, rewardGems: 0 },
  { id: 'recruit', event: 'recruit', title: 'Recruit {n} new gym members', icon: '🙋', minLevel: 1, targetBase: 2, targetPerLevel: 0.1, targetMax: 8, rewardIncomeMinutes: 7, rewardCashFloor: 180, rewardXp: 50, rewardGems: 0 },
  { id: 'compete', event: 'compete', title: 'Enter {n} competitions', icon: '🏆', minLevel: 1, targetBase: 1, targetPerLevel: 0.05, targetMax: 3, rewardIncomeMinutes: 8, rewardCashFloor: 200, rewardXp: 80, rewardGems: 0 },
  { id: 'win', event: 'compete_win', title: 'Win {n} competition', icon: '🥇', minLevel: 3, targetBase: 1, targetPerLevel: 0, targetMax: 1, rewardIncomeMinutes: 10, rewardCashFloor: 300, rewardXp: 100, rewardGems: 3 },
  { id: 'earn', event: 'earn_cash', title: 'Earn ${n} in cash', icon: '💵', minLevel: 1, targetBase: 0, targetPerLevel: 0, targetMax: Number.MAX_SAFE_INTEGER, rewardIncomeMinutes: 6, rewardCashFloor: 150, rewardXp: 60, rewardGems: 0, cashTargetMinutes: 25 },
  { id: 'technique', event: 'upgrade_technique', title: 'Upgrade a lift technique {n} time', icon: '📈', minLevel: 2, targetBase: 1, targetPerLevel: 0, targetMax: 1, rewardIncomeMinutes: 8, rewardCashFloor: 200, rewardXp: 70, rewardGems: 0 },
  { id: 'facility', event: 'upgrade_facility', title: 'Improve a gym facility {n} time', icon: '💡', minLevel: 2, targetBase: 1, targetPerLevel: 0, targetMax: 1, rewardIncomeMinutes: 8, rewardCashFloor: 200, rewardXp: 60, rewardGems: 0 },
  { id: 'staff', event: 'upgrade_staff', title: 'Hire or train staff {n} time', icon: '🧑‍💼', minLevel: 3, targetBase: 1, targetPerLevel: 0, targetMax: 1, rewardIncomeMinutes: 10, rewardCashFloor: 250, rewardXp: 80, rewardGems: 0 },
];

export const MISSION_MAP: Record<string, MissionDef> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
