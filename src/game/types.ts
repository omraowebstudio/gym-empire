// Core game types. Everything in GameState must be JSON-serialisable.

export type ExerciseId =
  | 'bench'
  | 'squat'
  | 'deadlift'
  | 'ohp'
  | 'curl'
  | 'pulldown'
  | 'legpress'
  | 'lateral';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type LocationId =
  | 'garage'
  | 'neighborhood'
  | 'commercial'
  | 'hardcore'
  | 'premium'
  | 'pro'
  | 'elite';

export type EquipmentId =
  | 'flat_bench'
  | 'dumbbell_rack'
  | 'barbell_station'
  | 'squat_rack'
  | 'treadmill'
  | 'cable_machine'
  | 'leg_press'
  | 'lat_pulldown'
  | 'plate_tree'
  | 'power_platform'
  | 'smith_machine'
  | 'rowing_machine'
  | 'hack_squat'
  | 'cryo_pod';

export type FacilityId = 'flooring' | 'lighting' | 'mirrors' | 'reception';

export type StaffType = 'trainer' | 'receptionist' | 'cleaner' | 'manager';

export type MembershipTier = 'basic' | 'plus' | 'vip';

export type CompetitionType = 'bench' | 'squat' | 'deadlift' | 'total' | 'weekly';

export type ChallengeKind = 'timing' | 'power' | 'tempo';

export type ItemCategory =
  | 'shirt'
  | 'shorts'
  | 'shoes'
  | 'accessory'
  | 'barbell'
  | 'dumbbell'
  | 'decoration'
  | 'theme'
  | 'trophy';

export interface Appearance {
  skin: number; // index into SKIN_TONES
  hair: string; // hairstyle id
  hairColor: number; // index into HAIR_COLORS
  shirt: string; // item id
  shorts: string; // item id
  shoes: string; // item id
  accessory: string; // item id ('acc_none' for none)
}

export interface ExerciseProgress {
  level: number;
  xp: number;
  technique: number;
  sessions: number;
  bestScore: number;
}

export interface PlacedEquipment {
  itemId: EquipmentId;
  level: number;
}

export interface Member {
  id: string;
  name: string;
  seed: number;
  tier: MembershipTier;
  satisfactionOffset: number;
  slotId: string | null;
  joinedAt: number;
}

export interface LocationState {
  id: LocationId;
  slots: Record<string, PlacedEquipment | null>;
  facilities: Record<FacilityId, number>;
  members: Member[];
  recruitProgress: number; // fractional member progress for auto recruitment
  decorations: (string | null)[];
  theme: string | null; // item id of theme or null for default
}

export interface Staff {
  id: string;
  type: StaffType;
  name: string;
  level: number;
  seed: number;
  hiredAt: number;
}

export interface OfflineReport {
  seconds: number; // effective (capped) seconds credited
  rawSeconds: number; // real elapsed seconds
  capSeconds: number;
  gross: number;
  salaries: number;
  managerBonus: number;
  boostBonus: number;
  total: number;
  membersJoined: number;
  createdAt: number;
  doubled: boolean;
}

export interface MissionInstance {
  id: string; // unique per day
  defId: string;
  target: number;
  progress: number;
  claimed: boolean;
  rewardCash: number;
  rewardXp: number;
  rewardGems: number;
  adDoubled: boolean;
}

export interface DailyMissionsState {
  dateKey: string;
  missions: MissionInstance[];
  bonusClaimed: boolean;
}

export interface DailyRewardState {
  lastClaimDate: string | null;
  nextDay: number; // 0..6
  cycle: number; // completed cycles
  totalClaims: number;
  adBonusDate: string | null;
}

export interface AchievementProgress {
  unlockedAt: number;
  claimed: boolean;
}

export interface CompetitionOpponent {
  id: string;
  name: string;
  seed: number;
  power: number;
  country: string;
}

export interface CompetitionMatch {
  round: number; // 0 = quarter, 1 = semi, 2 = final
  a: string; // opponent id or 'player'
  b: string;
  aLift: number;
  bLift: number;
  winner: string;
}

export interface CompetitionResult {
  id: string;
  type: CompetitionType;
  tier: number;
  place: number; // 1,2,3,5
  playerBest: number;
  matches: CompetitionMatch[];
  opponents: CompetitionOpponent[];
  rewardCash: number;
  rewardXp: number;
  rewardGems: number;
  trophyId: string | null;
  newRecord: boolean;
  at: number;
}

/** A competition currently being played round by round. */
export interface ActiveCompetition {
  id: string;
  type: CompetitionType;
  tier: number;
  opponents: CompetitionOpponent[]; // 7 opponents, bracket order with player at index 0
  matches: CompetitionMatch[];
  round: number; // next round to play
  eliminated: boolean;
  startedAt: number;
}

export interface CompetitionState {
  records: Record<CompetitionType, number>;
  history: CompetitionResult[];
  wins: Record<string, number>; // `${type}:${tier}` -> wins
  weekKey: string;
  weeklyChampionshipDone: boolean;
  leaguePoints: number;
  active: ActiveCompetition | null;
}

export interface EventState {
  eventId: string;
  weekKey: string;
  tokens: number;
  claimed: number[]; // milestone indexes claimed
  progress: Record<string, number>;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  personalizedAds: boolean;
  consentAsked: boolean;
}

export interface MonetizationState {
  removeAds: boolean;
  processedTransactions: string[];
  entitlements: string[];
  rewardedAdsDate: string | null;
  rewardedAdsCount: number;
}

export interface Boost {
  id: string;
  multiplier: number;
  until: number;
  source: 'ad' | 'gems' | 'reward';
}

export type CounterKey =
  | 'trainings'
  | 'perfectReps'
  | 'competitions'
  | 'competitionWins'
  | 'cashEarned'
  | 'equipmentBought'
  | 'equipmentUpgrades'
  | 'facilityUpgrades'
  | 'membersRecruited'
  | 'staffHired'
  | 'staffUpgrades'
  | 'incomeCollections'
  | 'missionsCompleted'
  | 'dailyClaims'
  | 'techniqueUpgrades'
  | 'locationsUnlocked'
  | 'itemsCollected'
  | 'sGrades';

export interface GameState {
  version: number;
  createdAt: number;
  lastTickAt: number;
  profile: {
    name: string;
    appearance: Appearance;
    onboarded: boolean;
  };
  level: number;
  xp: number;
  cash: number;
  gems: number;
  energy: number;
  energyUpdatedAt: number;
  exercises: Record<ExerciseId, ExerciseProgress>;
  currentLocation: LocationId;
  locations: Partial<Record<LocationId, LocationState>>;
  staff: Staff[];
  pendingOffline: OfflineReport | null;
  tipJar: number;
  boosts: Boost[];
  counters: Record<CounterKey, number>;
  missions: DailyMissionsState;
  dailyReward: DailyRewardState;
  achievements: Record<string, AchievementProgress>;
  inventory: Record<string, number>; // itemId -> acquiredAt
  skins: { barbell: string; dumbbell: string };
  competition: CompetitionState;
  event: EventState;
  settings: Settings;
  monetization: MonetizationState;
  idCounter: number;
}

// ---- Effects emitted by actions for the UI layer ----
export type GameEffect =
  | { type: 'levelUp'; level: number; cash: number; gems: number; unlocks: string[] }
  | { type: 'achievement'; id: string }
  | { type: 'item'; itemId: string }
  | { type: 'missionComplete'; missionId: string }
  | { type: 'memberJoined'; name: string; locationId: LocationId }
  | { type: 'exerciseLevel'; exercise: ExerciseId; level: number }
  | { type: 'physique'; stage: number }
  | { type: 'reward'; cash: number; xp: number; gems: number; tokens?: number; label: string };

export type GameEventType =
  | 'train'
  | 'perfect_rep'
  | 's_grade'
  | 'compete'
  | 'compete_win'
  | 'buy_equipment'
  | 'upgrade_equipment'
  | 'upgrade_facility'
  | 'recruit'
  | 'collect_income'
  | 'earn_cash'
  | 'hire_staff'
  | 'upgrade_staff'
  | 'upgrade_technique'
  | 'unlock_location'
  | 'item_acquired';

export interface TrackedEvent {
  type: GameEventType;
  amount?: number;
  exercise?: ExerciseId;
  compType?: CompetitionType;
}

export interface ActionContext {
  now: number;
  rng: () => number;
  effects: GameEffect[];
}

export type ActionResult =
  | { ok: true; state: GameState; effects: GameEffect[] }
  | { ok: false; reason: string; state: GameState; effects: GameEffect[] };
