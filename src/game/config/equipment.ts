import type { EquipmentId, ExerciseId, FacilityId } from '../types';

export interface EquipmentDef {
  id: EquipmentId;
  name: string;
  basePrice: number;
  capacity: number; // members supported at level 1
  appeal: number;
  minLocationTier: number; // 0 = garage
  trainsExercise: ExerciseId | null; // boosts training XP for this exercise
  color: string;
  description: string;
}

export const EQUIPMENT: EquipmentDef[] = [
  { id: 'dumbbell_rack', name: 'Dumbbell Rack', basePrice: 150, capacity: 2, appeal: 6, minLocationTier: 0, trainsExercise: 'curl', color: '#3D7BFF', description: 'A classic rack of dumbbells. Members love curls.' },
  { id: 'flat_bench', name: 'Flat Bench', basePrice: 200, capacity: 2, appeal: 7, minLocationTier: 0, trainsExercise: 'bench', color: '#8B5CFF', description: 'Sturdy padded bench for pressing.' },
  { id: 'barbell_station', name: 'Barbell & Plates', basePrice: 320, capacity: 2, appeal: 9, minLocationTier: 0, trainsExercise: 'deadlift', color: '#FFC83D', description: 'Olympic barbell with a stack of plates.' },
  { id: 'squat_rack', name: 'Squat Rack', basePrice: 550, capacity: 3, appeal: 12, minLocationTier: 0, trainsExercise: 'squat', color: '#FF4D6D', description: 'Steel power rack. The heart of every gym.' },
  { id: 'treadmill', name: 'Treadmill', basePrice: 450, capacity: 2, appeal: 10, minLocationTier: 0, trainsExercise: null, color: '#00C2A8', description: 'Cardio bunnies welcome. Attracts lots of members.' },
  { id: 'plate_tree', name: 'Plate Tree', basePrice: 260, capacity: 1, appeal: 8, minLocationTier: 0, trainsExercise: 'ohp', color: '#9AA4BF', description: 'Organised plates = happy members.' },
  { id: 'cable_machine', name: 'Cable Machine', basePrice: 1400, capacity: 3, appeal: 16, minLocationTier: 1, trainsExercise: 'lateral', color: '#FF8A3D', description: 'Versatile cable crossover station.' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', basePrice: 1600, capacity: 2, appeal: 15, minLocationTier: 1, trainsExercise: 'pulldown', color: '#5AD25A', description: 'Build those wings.' },
  { id: 'leg_press', name: 'Leg Press', basePrice: 2200, capacity: 2, appeal: 18, minLocationTier: 1, trainsExercise: 'legpress', color: '#FF5CC8', description: 'Heavy sled for massive quads.' },
  { id: 'smith_machine', name: 'Smith Machine', basePrice: 6000, capacity: 3, appeal: 22, minLocationTier: 2, trainsExercise: 'ohp', color: '#4DD4FF', description: 'Guided bar path for confident lifting.' },
  { id: 'rowing_machine', name: 'Rowing Machine', basePrice: 5000, capacity: 2, appeal: 20, minLocationTier: 2, trainsExercise: null, color: '#7C8BFF', description: 'Full-body cardio favourite.' },
  { id: 'power_platform', name: 'Power Platform', basePrice: 30000, capacity: 3, appeal: 30, minLocationTier: 3, trainsExercise: 'deadlift', color: '#C9A227', description: 'Competition-grade lifting platform.' },
  { id: 'hack_squat', name: 'Hack Squat', basePrice: 45000, capacity: 3, appeal: 34, minLocationTier: 3, trainsExercise: 'squat', color: '#E0457B', description: 'Brutal, beautiful leg machine.' },
  { id: 'cryo_pod', name: 'Recovery Pod', basePrice: 400000, capacity: 4, appeal: 60, minLocationTier: 4, trainsExercise: null, color: '#9EF0FF', description: 'Futuristic recovery tech for VIPs.' },
];

export const EQUIPMENT_MAP: Record<EquipmentId, EquipmentDef> = Object.fromEntries(
  EQUIPMENT.map((e) => [e.id, e]),
) as Record<EquipmentId, EquipmentDef>;

export interface FacilityDef {
  id: FacilityId;
  name: string;
  basePrice: number;
  description: string;
  appealPerLevel: number;
}

export const FACILITIES: FacilityDef[] = [
  { id: 'flooring', name: 'Rubber Flooring', basePrice: 180, description: 'Better floors raise satisfaction.', appealPerLevel: 4 },
  { id: 'lighting', name: 'Lighting', basePrice: 220, description: 'Bright, warm lighting with gold accents.', appealPerLevel: 4 },
  { id: 'mirrors', name: 'Mirrors', basePrice: 260, description: 'Every lifter needs a mirror.', appealPerLevel: 5 },
  { id: 'reception', name: 'Reception Desk', basePrice: 400, description: 'Professional front desk attracts premium members.', appealPerLevel: 6 },
];

export const FACILITY_MAP: Record<FacilityId, FacilityDef> = Object.fromEntries(
  FACILITIES.map((f) => [f.id, f]),
) as Record<FacilityId, FacilityDef>;

/** Training XP bonus per equipment level for the exercise it trains. */
export const EQUIPMENT_TRAINING_BONUS_PER_LEVEL = 0.02;
export const EQUIPMENT_TRAINING_BONUS_CAP = 1.0;
