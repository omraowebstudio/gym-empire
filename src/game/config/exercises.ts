import type { ChallengeKind, ExerciseId } from '../types';

export interface ExerciseDef {
  id: ExerciseId;
  name: string;
  short: string;
  muscle: string;
  unlockLevel: number;
  basePower: number;
  powerPerLevel: number;
  /** weight of this lift in Overall Strength */
  overallWeight: number;
  color: string;
  challenges: ChallengeKind[];
  tip: string;
}

export const EXERCISES: ExerciseDef[] = [
  {
    id: 'bench',
    name: 'Bench Press',
    short: 'Bench',
    muscle: 'Chest',
    unlockLevel: 1,
    basePower: 45,
    powerPerLevel: 5,
    overallWeight: 1,
    color: '#3D7BFF',
    challenges: ['timing', 'tempo', 'power'],
    tip: 'Tap when the marker hits the gold zone!',
  },
  {
    id: 'squat',
    name: 'Squat',
    short: 'Squat',
    muscle: 'Legs',
    unlockLevel: 1,
    basePower: 60,
    powerPerLevel: 7,
    overallWeight: 1,
    color: '#8B5CFF',
    challenges: ['timing', 'power', 'tempo'],
    tip: 'Drive up with perfect timing for bonus gains.',
  },
  {
    id: 'curl',
    name: 'Dumbbell Curl',
    short: 'Curl',
    muscle: 'Biceps',
    unlockLevel: 1,
    basePower: 15,
    powerPerLevel: 2,
    overallWeight: 0.5,
    color: '#FF8A3D',
    challenges: ['tempo', 'timing', 'power'],
    tip: 'Slow and steady: hold and release in the zone.',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    short: 'Deadlift',
    muscle: 'Back',
    unlockLevel: 2,
    basePower: 70,
    powerPerLevel: 8,
    overallWeight: 1,
    color: '#FF4D6D',
    challenges: ['power', 'timing', 'tempo'],
    tip: 'Tap fast to grind the bar past your knees!',
  },
  {
    id: 'ohp',
    name: 'Overhead Press',
    short: 'OHP',
    muscle: 'Shoulders',
    unlockLevel: 3,
    basePower: 30,
    powerPerLevel: 3,
    overallWeight: 0.5,
    color: '#00C2A8',
    challenges: ['timing', 'tempo', 'power'],
    tip: 'Lock it out at the top of the bar.',
  },
  {
    id: 'pulldown',
    name: 'Lat Pulldown',
    short: 'Pulldown',
    muscle: 'Lats',
    unlockLevel: 4,
    basePower: 40,
    powerPerLevel: 4,
    overallWeight: 0.5,
    color: '#FFC83D',
    challenges: ['tempo', 'power', 'timing'],
    tip: 'Control the negative for a perfect rep.',
  },
  {
    id: 'legpress',
    name: 'Leg Press',
    short: 'Leg Press',
    muscle: 'Quads',
    unlockLevel: 5,
    basePower: 90,
    powerPerLevel: 10,
    overallWeight: 0.5,
    color: '#5AD25A',
    challenges: ['power', 'tempo', 'timing'],
    tip: 'Pump those legs: tap tap tap!',
  },
  {
    id: 'lateral',
    name: 'Lateral Raise',
    short: 'Laterals',
    muscle: 'Delts',
    unlockLevel: 6,
    basePower: 8,
    powerPerLevel: 1,
    overallWeight: 0.5,
    color: '#FF5CC8',
    challenges: ['tempo', 'timing', 'power'],
    tip: 'Small weight, big precision.',
  },
];

export const EXERCISE_MAP: Record<ExerciseId, ExerciseDef> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
) as Record<ExerciseId, ExerciseDef>;

export const CHALLENGE_INFO: Record<ChallengeKind, { name: string; howTo: string }> = {
  timing: { name: 'Perfect Timing', howTo: 'Tap when the marker is inside the gold zone. 5 reps.' },
  power: { name: 'Power Grind', howTo: 'Tap as fast as you can to fill the meter before time runs out. 3 reps.' },
  tempo: { name: 'Tempo Control', howTo: 'Press and HOLD to charge, release inside the zone. 4 reps.' },
};

/** Physique stages, unlocked by Overall Strength. */
export const PHYSIQUE_STAGES = [
  { name: 'Beginner', minStrength: 0 },
  { name: 'Developing', minStrength: 400 },
  { name: 'Athletic', minStrength: 650 },
  { name: 'Muscular', minStrength: 1000 },
  { name: 'Advanced', minStrength: 1500 },
  { name: 'Elite', minStrength: 2200 },
] as const;
