import type { StaffType } from '../types';

export interface StaffDef {
  type: StaffType;
  name: string;
  plural: string;
  description: string;
  baseHireCost: number;
  baseSalaryPerMin: number;
  color: string;
  // per-level effects
  satisfactionPerLevel: number;
  trainingXpPerLevel: number;
  recruitPerLevel: number;
  incomePerLevel: number;
  offlineHoursPerLevel: number;
  premiumChancePerLevel: number;
}

export const STAFF: StaffDef[] = [
  {
    type: 'trainer', name: 'Personal Trainer', plural: 'Trainers',
    description: 'Raises member satisfaction and boosts YOUR training XP.',
    baseHireCost: 800, baseSalaryPerMin: 0.6, color: '#3D7BFF',
    satisfactionPerLevel: 4, trainingXpPerLevel: 0.05, recruitPerLevel: 0, incomePerLevel: 0, offlineHoursPerLevel: 0, premiumChancePerLevel: 0,
  },
  {
    type: 'receptionist', name: 'Receptionist', plural: 'Receptionists',
    description: 'Members sign up faster, and more pick Plus & VIP plans.',
    baseHireCost: 700, baseSalaryPerMin: 0.5, color: '#FF5CC8',
    satisfactionPerLevel: 0, trainingXpPerLevel: 0, recruitPerLevel: 0.2, incomePerLevel: 0, offlineHoursPerLevel: 0, premiumChancePerLevel: 0.02,
  },
  {
    type: 'cleaner', name: 'Cleaning Staff', plural: 'Cleaners',
    description: 'A spotless gym keeps members happy.',
    baseHireCost: 500, baseSalaryPerMin: 0.4, color: '#00C2A8',
    satisfactionPerLevel: 5, trainingXpPerLevel: 0, recruitPerLevel: 0, incomePerLevel: 0, offlineHoursPerLevel: 0, premiumChancePerLevel: 0,
  },
  {
    type: 'manager', name: 'Gym Manager', plural: 'Managers',
    description: 'Boosts all income and lets your gym earn longer while you are away.',
    baseHireCost: 2500, baseSalaryPerMin: 1.2, color: '#FFC83D',
    satisfactionPerLevel: 0, trainingXpPerLevel: 0, recruitPerLevel: 0, incomePerLevel: 0.06, offlineHoursPerLevel: 0.5, premiumChancePerLevel: 0,
  },
];

export const STAFF_MAP: Record<StaffType, StaffDef> = Object.fromEntries(
  STAFF.map((s) => [s.type, s]),
) as Record<StaffType, StaffDef>;
