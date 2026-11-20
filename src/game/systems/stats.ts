import { ECONOMY } from '../config/economy';
import { EQUIPMENT_MAP, EQUIPMENT_TRAINING_BONUS_CAP, EQUIPMENT_TRAINING_BONUS_PER_LEVEL } from '../config/equipment';
import { EXERCISES, EXERCISE_MAP, PHYSIQUE_STAGES } from '../config/exercises';
import { STAFF_MAP } from '../config/staff';
import type { ExerciseId, GameState } from '../types';

/** Fictional "power" score for a lift. Not a real-world weight or recommendation. */
export function exercisePower(state: GameState, id: ExerciseId): number {
  const def = EXERCISE_MAP[id];
  const p = state.exercises[id];
  return Math.round(
    def.basePower + (p.level - 1) * def.powerPerLevel + p.technique * ECONOMY.training.techniquePowerBonus,
  );
}

export function overallStrength(state: GameState): number {
  let total = 0;
  for (const e of EXERCISES) total += exercisePower(state, e.id) * e.overallWeight;
  return Math.round(total);
}

export function physiqueStage(strength: number): number {
  let stage = 0;
  PHYSIQUE_STAGES.forEach((s, i) => {
    if (strength >= s.minStrength) stage = i;
  });
  return stage;
}

export function physiqueProgress(strength: number): { stage: number; progress: number; next: number | null } {
  const stage = physiqueStage(strength);
  const cur = PHYSIQUE_STAGES[stage].minStrength;
  const next = stage + 1 < PHYSIQUE_STAGES.length ? PHYSIQUE_STAGES[stage + 1].minStrength : null;
  const progress = next === null ? 1 : (strength - cur) / (next - cur);
  return { stage, progress: Math.max(0, Math.min(1, progress)), next };
}

/** Bonus (fraction) from owned equipment that trains this exercise, across all gyms. */
export function equipmentTrainingBonus(state: GameState, id: ExerciseId): number {
  let bonus = 0;
  for (const loc of Object.values(state.locations)) {
    if (!loc) continue;
    for (const placed of Object.values(loc.slots)) {
      if (placed && EQUIPMENT_MAP[placed.itemId].trainsExercise === id) {
        bonus += EQUIPMENT_TRAINING_BONUS_PER_LEVEL * placed.level;
      }
    }
  }
  return Math.min(EQUIPMENT_TRAINING_BONUS_CAP, bonus);
}

export function trainerXpBonus(state: GameState): number {
  return state.staff
    .filter((s) => s.type === 'trainer')
    .reduce((sum, s) => sum + s.level * STAFF_MAP.trainer.trainingXpPerLevel, 0);
}

export interface TrainingMultiplier {
  technique: number;
  equipment: number;
  trainers: number;
  total: number;
}

export function trainingMultiplier(state: GameState, id: ExerciseId): TrainingMultiplier {
  const technique = state.exercises[id].technique * ECONOMY.training.techniqueXpBonus;
  const equipment = equipmentTrainingBonus(state, id);
  const trainers = trainerXpBonus(state);
  return { technique, equipment, trainers, total: 1 + technique + equipment + trainers };
}

export function isExerciseUnlocked(state: GameState, id: ExerciseId): boolean {
  return state.level >= EXERCISE_MAP[id].unlockLevel;
}
