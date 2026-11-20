// Shared, pure leaderboard validation rules. The same rules run server-side in
// supabase/functions/submit-score so clients cannot submit arbitrary values.
import { EXERCISES } from '../../game/config/exercises';
import { ECONOMY } from '../../game/config/economy';
import { ACHIEVEMENTS } from '../../game/config/achievements';

export type LeaderboardCategory = 'level' | 'gym' | 'members' | 'strength' | 'achievements' | 'weekly';

export interface ScoreSubmission {
  category: LeaderboardCategory;
  value: number;
  submittedAt: number;
  /** evidence used to recompute derived values server-side */
  evidence?: {
    exercises?: Record<string, { level: number; technique: number }>;
  };
}

export interface PreviousScore {
  value: number;
  submittedAt: number;
}

export const CATEGORY_LIMITS: Record<LeaderboardCategory, { max: number; maxGainPerHour: number }> = {
  level: { max: ECONOMY.levels.maxLevel, maxGainPerHour: 6 },
  gym: { max: 1_000_000, maxGainPerHour: 5_000 },
  members: { max: 5_000, maxGainPerHour: 400 },
  strength: { max: 20_000, maxGainPerHour: 250 },
  achievements: { max: ACHIEVEMENTS.length, maxGainPerHour: 10 },
  weekly: { max: 100_000, maxGainPerHour: 2_000 },
};

export function recomputeStrength(ex: Record<string, { level: number; technique: number }>): number {
  let total = 0;
  for (const e of EXERCISES) {
    const p = ex[e.id];
    if (!p) return -1;
    if (p.level < 1 || p.level > ECONOMY.training.maxExerciseLevel) return -1;
    if (p.technique < 0 || p.technique > ECONOMY.training.maxTechnique) return -1;
    total += (e.basePower + (p.level - 1) * e.powerPerLevel + p.technique * ECONOMY.training.techniquePowerBonus) * e.overallWeight;
  }
  return Math.round(total);
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function validateSubmission(sub: ScoreSubmission, prev: PreviousScore | null, serverNow: number): ValidationResult {
  const lim = CATEGORY_LIMITS[sub.category];
  if (!lim) return { ok: false, reason: 'unknown_category' };
  if (!Number.isFinite(sub.value) || sub.value < 0 || !Number.isInteger(sub.value)) return { ok: false, reason: 'invalid_value' };
  if (sub.value > lim.max) return { ok: false, reason: 'exceeds_max' };
  if (Math.abs(sub.submittedAt - serverNow) > 10 * 60 * 1000) return { ok: false, reason: 'clock_skew' };
  if (sub.category === 'strength') {
    const ex = sub.evidence?.exercises;
    if (!ex || recomputeStrength(ex) !== sub.value) return { ok: false, reason: 'strength_mismatch' };
  }
  if (prev && sub.category !== 'weekly') {
    const hours = Math.max(0, (serverNow - prev.submittedAt) / 3_600_000);
    const allowed = lim.maxGainPerHour * Math.max(hours, 1 / 60) + 1;
    if (sub.value - prev.value > allowed) return { ok: false, reason: 'implausible_gain' };
  }
  return { ok: true };
}
