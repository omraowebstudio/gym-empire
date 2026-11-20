export type MetricKey =
  | 'trainings'
  | 'perfectReps'
  | 'sGrades'
  | 'competitions'
  | 'competitionWins'
  | 'legendWins'
  | 'cashEarned'
  | 'equipmentOwned'
  | 'maxEquipmentLevel'
  | 'equipmentUpgrades'
  | 'membersRecruited'
  | 'totalMembers'
  | 'incomePerMin'
  | 'locationsOwned'
  | 'staffCount'
  | 'itemsOwned'
  | 'missionsCompleted'
  | 'dailyClaims'
  | 'level'
  | 'overallStrength'
  | 'onboarded'
  | 'techniqueUpgrades';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  metric: MetricKey;
  target: number;
  gems: number;
  cash: number;
  xp: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_gym', name: 'First Gym', description: 'Open your very first gym.', icon: '🏠', metric: 'onboarded', target: 1, gems: 5, cash: 100, xp: 20 },
  { id: 'first_rep', name: 'First Rep', description: 'Complete your first training session.', icon: '💪', metric: 'trainings', target: 1, gems: 5, cash: 100, xp: 20 },
  { id: 'gym_rat', name: 'Gym Rat', description: 'Complete 25 training sessions.', icon: '🐀', metric: 'trainings', target: 25, gems: 10, cash: 1000, xp: 150 },
  { id: 'dedicated', name: 'Dedicated', description: 'Complete 100 training sessions.', icon: '🔥', metric: 'trainings', target: 100, gems: 20, cash: 10000, xp: 500 },
  { id: 'iron_addict', name: 'Iron Addict', description: 'Complete 500 training sessions.', icon: '⚙️', metric: 'trainings', target: 500, gems: 50, cash: 250000, xp: 3000 },
  { id: 'sharpshooter', name: 'Sharpshooter', description: 'Land 25 PERFECT reps.', icon: '🎯', metric: 'perfectReps', target: 25, gems: 10, cash: 800, xp: 120 },
  { id: 'precision', name: 'Precision Machine', description: 'Land 250 PERFECT reps.', icon: '🤖', metric: 'perfectReps', target: 250, gems: 25, cash: 20000, xp: 800 },
  { id: 's_rank', name: 'S-Rank Lifter', description: 'Earn 10 S grades in training.', icon: '⭐', metric: 'sGrades', target: 10, gems: 15, cash: 3000, xp: 300 },
  { id: 'first_member', name: 'First Member', description: 'Recruit your first gym member.', icon: '🙋', metric: 'membersRecruited', target: 1, gems: 5, cash: 150, xp: 30 },
  { id: 'community', name: 'Community', description: 'Have 25 members across your gyms.', icon: '👥', metric: 'totalMembers', target: 25, gems: 15, cash: 5000, xp: 300 },
  { id: 'packed_house', name: 'Packed House', description: 'Have 100 members across your gyms.', icon: '🏟️', metric: 'totalMembers', target: 100, gems: 30, cash: 100000, xp: 1200 },
  { id: 'iron_owner', name: 'Iron Owner', description: 'Own 10 pieces of equipment.', icon: '🏋️', metric: 'equipmentOwned', target: 10, gems: 15, cash: 3000, xp: 250 },
  { id: 'gear_head', name: 'Gear Head', description: 'Own 30 pieces of equipment.', icon: '🔧', metric: 'equipmentOwned', target: 30, gems: 30, cash: 200000, xp: 1500 },
  { id: 'maxed_out', name: 'Maxed Out', description: 'Upgrade any equipment to level 10.', icon: '🔟', metric: 'maxEquipmentLevel', target: 10, gems: 20, cash: 10000, xp: 600 },
  { id: 'tinkerer', name: 'Tinkerer', description: 'Upgrade equipment 50 times.', icon: '🛠️', metric: 'equipmentUpgrades', target: 50, gems: 20, cash: 30000, xp: 800 },
  { id: 'business_owner', name: 'Business Owner', description: 'Reach $100/min gym income.', icon: '💼', metric: 'incomePerMin', target: 100, gems: 10, cash: 2000, xp: 200 },
  { id: 'mogul', name: 'Mogul', description: 'Reach $2,500/min gym income.', icon: '💎', metric: 'incomePerMin', target: 2500, gems: 25, cash: 50000, xp: 1000 },
  { id: 'tycoon_income', name: 'Cash Machine', description: 'Reach $50,000/min gym income.', icon: '🏦', metric: 'incomePerMin', target: 50000, gems: 50, cash: 1000000, xp: 4000 },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn $1,000,000 in total.', icon: '🤑', metric: 'cashEarned', target: 1000000, gems: 30, cash: 0, xp: 1500 },
  { id: 'powerhouse', name: 'Powerhouse', description: 'Reach 500 Overall Strength.', icon: '⚡', metric: 'overallStrength', target: 500, gems: 15, cash: 3000, xp: 300 },
  { id: 'colossus', name: 'Colossus', description: 'Reach 1,500 Overall Strength.', icon: '🗿', metric: 'overallStrength', target: 1500, gems: 40, cash: 200000, xp: 2500 },
  { id: 'level_5', name: 'Rising Star', description: 'Reach player level 5.', icon: '🌟', metric: 'level', target: 5, gems: 10, cash: 1000, xp: 0 },
  { id: 'level_15', name: 'Veteran', description: 'Reach player level 15.', icon: '🎖️', metric: 'level', target: 15, gems: 20, cash: 30000, xp: 0 },
  { id: 'level_30', name: 'Icon', description: 'Reach player level 30.', icon: '👑', metric: 'level', target: 30, gems: 40, cash: 2000000, xp: 0 },
  { id: 'second_gym', name: 'Expansion', description: 'Own 2 gym locations.', icon: '🏢', metric: 'locationsOwned', target: 2, gems: 15, cash: 5000, xp: 400 },
  { id: 'gym_tycoon', name: 'Gym Tycoon', description: 'Unlock your third gym.', icon: '🏙️', metric: 'locationsOwned', target: 3, gems: 25, cash: 50000, xp: 1000 },
  { id: 'empire_builder', name: 'Empire Builder', description: 'Own 5 gym locations.', icon: '🌍', metric: 'locationsOwned', target: 5, gems: 50, cash: 5000000, xp: 4000 },
  { id: 'first_competition', name: 'Game Day', description: 'Enter your first competition.', icon: '🎟️', metric: 'competitions', target: 1, gems: 5, cash: 200, xp: 40 },
  { id: 'first_win', name: 'Champion', description: 'Win a competition.', icon: '🥇', metric: 'competitionWins', target: 1, gems: 10, cash: 500, xp: 100 },
  { id: 'serial_winner', name: 'Serial Winner', description: 'Win 25 competitions.', icon: '🏅', metric: 'competitionWins', target: 25, gems: 30, cash: 50000, xp: 1500 },
  { id: 'legend', name: 'Living Legend', description: 'Win a Legends Invitational.', icon: '🐐', metric: 'legendWins', target: 1, gems: 100, cash: 5000000, xp: 5000 },
  { id: 'first_staff', name: 'Boss Mode', description: 'Hire your first employee.', icon: '🧑‍💼', metric: 'staffCount', target: 1, gems: 10, cash: 500, xp: 100 },
  { id: 'full_team', name: 'Dream Team', description: 'Employ 8 staff members.', icon: '🤝', metric: 'staffCount', target: 8, gems: 25, cash: 100000, xp: 1200 },
  { id: 'collector', name: 'Collector', description: 'Own 15 collectible items.', icon: '📦', metric: 'itemsOwned', target: 15, gems: 15, cash: 2000, xp: 200 },
  { id: 'curator', name: 'Curator', description: 'Own 40 collectible items.', icon: '🖼️', metric: 'itemsOwned', target: 40, gems: 40, cash: 200000, xp: 1500 },
  { id: 'mission_10', name: 'On a Mission', description: 'Complete 10 daily missions.', icon: '📋', metric: 'missionsCompleted', target: 10, gems: 10, cash: 2000, xp: 200 },
  { id: 'mission_100', name: 'Mission Master', description: 'Complete 100 daily missions.', icon: '🗂️', metric: 'missionsCompleted', target: 100, gems: 40, cash: 300000, xp: 2000 },
  { id: 'loyal', name: 'Loyal Lifter', description: 'Claim 7 daily login rewards.', icon: '📅', metric: 'dailyClaims', target: 7, gems: 15, cash: 3000, xp: 200 },
  { id: 'technician', name: 'Technician', description: 'Upgrade lift technique 10 times.', icon: '📐', metric: 'techniqueUpgrades', target: 10, gems: 15, cash: 5000, xp: 400 },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
