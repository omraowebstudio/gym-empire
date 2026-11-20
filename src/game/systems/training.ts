import { ECONOMY, exerciseXpForLevel, techniqueCost } from '../config/economy';
import { EXERCISE_MAP } from '../config/exercises';
import type { ActionContext, ChallengeKind, ExerciseId, GameState } from '../types';
import { currentEnergy, grantCash, grantXp, spendCash, spendEnergy, track } from './core';
import { isExerciseUnlocked, trainingMultiplier } from './stats';

const T = ECONOMY.training;

export interface ChallengeOutcome {
  challenge: ChallengeKind;
  reps: number;
  perfects: number;
  goods: number;
  misses: number;
  /** 0..1 overall quality */
  score: number;
}

export type Grade = 'S' | 'A' | 'B' | 'C';

export function gradeFor(score: number): Grade {
  if (score >= 0.9) return 'S';
  if (score >= 0.72) return 'A';
  if (score >= 0.5) return 'B';
  return 'C';
}

export interface TrainingReward {
  xp: number;
  cash: number;
  exerciseXp: number;
  grade: Grade;
  scoreMult: number;
  multiplier: number;
}

/** Sanitises a challenge outcome so the reward logic never trusts raw UI values. */
export function sanitizeOutcome(o: ChallengeOutcome): ChallengeOutcome {
  const reps = Math.max(1, Math.min(10, Math.floor(o.reps || 1)));
  const perfects = Math.max(0, Math.min(reps, Math.floor(o.perfects || 0)));
  const goods = Math.max(0, Math.min(reps - perfects, Math.floor(o.goods || 0)));
  const misses = reps - perfects - goods;
  const score = Math.max(0, Math.min(1, Number.isFinite(o.score) ? o.score : 0));
  return { challenge: o.challenge, reps, perfects, goods, misses, score };
}

export function computeTrainingReward(state: GameState, id: ExerciseId, outcome: ChallengeOutcome): TrainingReward {
  const o = sanitizeOutcome(outcome);
  const p = state.exercises[id];
  const scoreMult = 0.5 + o.score; // 0.5 .. 1.5
  const mult = trainingMultiplier(state, id).total;
  const xp = Math.round(T.baseXp * (1 + p.level * T.xpPerExerciseLevel * 0.5) * scoreMult * mult);
  const cash = Math.round(T.baseCash * (1 + (p.level - 1) * T.cashPerExerciseLevel) * scoreMult * (1 + p.technique * 0.1));
  const exerciseXp = Math.round(T.exerciseXpPerSession * scoreMult * mult);
  return { xp, cash, exerciseXp, grade: gradeFor(o.score), scoreMult, multiplier: mult };
}

export function canTrain(state: GameState, id: ExerciseId, now: number): string | null {
  if (!EXERCISE_MAP[id]) return 'Unknown exercise';
  if (!isExerciseUnlocked(state, id)) return `Unlocks at level ${EXERCISE_MAP[id].unlockLevel}`;
  if (currentEnergy(state, now) < ECONOMY.energy.trainingCost) return 'Not enough energy';
  return null;
}

export function completeTraining(
  state: GameState,
  ctx: ActionContext,
  id: ExerciseId,
  outcome: ChallengeOutcome,
): string | void {
  const err = canTrain(state, id, ctx.now);
  if (err) return err;
  const o = sanitizeOutcome(outcome);
  const reward = computeTrainingReward(state, id, o);
  if (!spendEnergy(state, ctx.now, ECONOMY.energy.trainingCost)) return 'Not enough energy';

  const p = state.exercises[id];
  p.sessions += 1;
  p.bestScore = Math.max(p.bestScore, Math.round(o.score * 100));
  p.xp += reward.exerciseXp;
  while (p.level < T.maxExerciseLevel && p.xp >= exerciseXpForLevel(p.level)) {
    p.xp -= exerciseXpForLevel(p.level);
    p.level += 1;
    ctx.effects.push({ type: 'exerciseLevel', exercise: id, level: p.level });
  }

  state.counters.trainings += 1;
  state.counters.perfectReps += o.perfects;
  if (reward.grade === 'S') state.counters.sGrades += 1;

  track(state, ctx, { type: 'train', exercise: id });
  if (o.perfects > 0) track(state, ctx, { type: 'perfect_rep', amount: o.perfects, exercise: id });
  if (reward.grade === 'S') track(state, ctx, { type: 's_grade', exercise: id });

  grantCash(state, ctx, reward.cash);
  grantXp(state, ctx, reward.xp);
  ctx.effects.push({ type: 'reward', cash: reward.cash, xp: reward.xp, gems: 0, label: `${EXERCISE_MAP[id].name} · Grade ${reward.grade}` });
}

export function upgradeTechnique(state: GameState, ctx: ActionContext, id: ExerciseId): string | void {
  const p = state.exercises[id];
  if (!p) return 'Unknown exercise';
  if (!isExerciseUnlocked(state, id)) return 'Exercise locked';
  if (p.technique >= T.maxTechnique) return 'Technique maxed';
  const cost = techniqueCost(p.technique);
  if (!spendCash(state, cost)) return 'Not enough cash';
  p.technique += 1;
  state.counters.techniqueUpgrades += 1;
  track(state, ctx, { type: 'upgrade_technique', exercise: id });
  grantXp(state, ctx, 10 + p.technique * 5);
}

/** Challenge rotation: pick the next variation based on sessions so it never repeats back-to-back. */
export function nextChallenge(state: GameState, id: ExerciseId): ChallengeKind {
  const list = EXERCISE_MAP[id].challenges;
  return list[state.exercises[id].sessions % list.length];
}

/** Difficulty 0..1 grows with the exercise level so the minigame stays interesting. */
export function challengeDifficulty(state: GameState, id: ExerciseId): number {
  return Math.min(1, (state.exercises[id].level - 1) / 40);
}
