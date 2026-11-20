import type { CompetitionType, ItemCategory, Rarity } from '../types';
import { COMPETITION_TIERS, COMPETITION_TYPES } from './competitions';

export type Unlock =
  | { kind: 'default' }
  | { kind: 'level'; level: number }
  | { kind: 'gems'; cost: number }
  | { kind: 'daily'; day: number }
  | { kind: 'achievement'; id: string }
  | { kind: 'competition'; compType: CompetitionType; tier: number }
  | { kind: 'event'; eventId: string }
  | { kind: 'iap'; productId: string }
  | { kind: 'missions'; count: number }
  | { kind: 'strength'; value: number };

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: Rarity;
  color: string;
  color2?: string;
  art?: string; // variant key for the renderer
  unlock: Unlock;
  description?: string;
}

export const RARITY_INFO: Record<Rarity, { label: string; color: string; glow: string; order: number }> = {
  common: { label: 'COMMON', color: '#9AA4BF', glow: '#C9D1E6', order: 0 },
  rare: { label: 'RARE', color: '#3D9BFF', glow: '#8CC8FF', order: 1 },
  epic: { label: 'EPIC', color: '#A35CFF', glow: '#D2A8FF', order: 2 },
  legendary: { label: 'LEGENDARY', color: '#FFC83D', glow: '#FFE7A0', order: 3 },
};

export const CATEGORY_INFO: Record<ItemCategory, { label: string; icon: string }> = {
  shirt: { label: 'Shirts', icon: '👕' },
  shorts: { label: 'Shorts', icon: '🩳' },
  shoes: { label: 'Shoes', icon: '👟' },
  accessory: { label: 'Accessories', icon: '🧢' },
  barbell: { label: 'Barbells', icon: '🏋️' },
  dumbbell: { label: 'Dumbbells', icon: '💪' },
  decoration: { label: 'Decorations', icon: '🪴' },
  theme: { label: 'Gym Themes', icon: '🎨' },
  trophy: { label: 'Trophies', icon: '🏆' },
};

const BASE_ITEMS: ItemDef[] = [
  // Shirts
  { id: 'shirt_tee_blue', name: 'Electric Tee', category: 'shirt', rarity: 'common', color: '#3D7BFF', art: 'tee', unlock: { kind: 'default' } },
  { id: 'shirt_tank_white', name: 'Classic Tank', category: 'shirt', rarity: 'common', color: '#F2F4FA', art: 'tank', unlock: { kind: 'default' } },
  { id: 'shirt_tee_red', name: 'Red Rush Tee', category: 'shirt', rarity: 'common', color: '#FF4D6D', art: 'tee', unlock: { kind: 'level', level: 2 } },
  { id: 'shirt_tank_black', name: 'Shadow Tank', category: 'shirt', rarity: 'common', color: '#2A2F3B', art: 'tank', unlock: { kind: 'level', level: 4 } },
  { id: 'shirt_comp_black', name: 'Compression Top', category: 'shirt', rarity: 'rare', color: '#1B1F2A', color2: '#3D7BFF', art: 'compression', unlock: { kind: 'level', level: 8 } },
  { id: 'shirt_tee_lime', name: 'Neon Lime Tee', category: 'shirt', rarity: 'rare', color: '#9CFF3D', art: 'tee', unlock: { kind: 'gems', cost: 25 } },
  { id: 'shirt_hoodie_purple', name: 'Purple Haze Hoodie', category: 'shirt', rarity: 'rare', color: '#8B5CFF', art: 'hoodie', unlock: { kind: 'gems', cost: 40 } },
  { id: 'shirt_stringer_gold', name: 'Golden Stringer', category: 'shirt', rarity: 'epic', color: '#FFC83D', art: 'stringer', unlock: { kind: 'daily', day: 6 } },
  { id: 'shirt_galaxy_tank', name: 'Galaxy Tank', category: 'shirt', rarity: 'epic', color: '#2B1A6B', color2: '#FF5CC8', art: 'tank', unlock: { kind: 'competition', compType: 'total', tier: 1 } },
  { id: 'shirt_champion', name: 'Champion Jersey', category: 'shirt', rarity: 'legendary', color: '#FFC83D', color2: '#8B5CFF', art: 'compression', unlock: { kind: 'competition', compType: 'weekly', tier: 2 } },
  { id: 'shirt_hoodie_gold', name: 'Royal Hoodie', category: 'shirt', rarity: 'legendary', color: '#FFD24D', color2: '#8B5CFF', art: 'hoodie', unlock: { kind: 'iap', productId: 'bundle_royal' } },
  { id: 'shirt_bench_week', name: 'Bench Week Tee', category: 'shirt', rarity: 'epic', color: '#3D7BFF', color2: '#FFC83D', art: 'tee', unlock: { kind: 'event', eventId: 'bench_week' } },
  { id: 'shirt_deadlift', name: 'Deadlift Dragon Tank', category: 'shirt', rarity: 'epic', color: '#B3122F', color2: '#FFC83D', art: 'tank', unlock: { kind: 'event', eventId: 'deadlift_challenge' } },

  // Shorts
  { id: 'shorts_navy', name: 'Navy Shorts', category: 'shorts', rarity: 'common', color: '#1E2A55', unlock: { kind: 'default' } },
  { id: 'shorts_gray', name: 'Gray Joggers', category: 'shorts', rarity: 'common', color: '#7A8296', unlock: { kind: 'default' } },
  { id: 'shorts_red', name: 'Sprint Shorts', category: 'shorts', rarity: 'common', color: '#E03A5A', unlock: { kind: 'level', level: 3 } },
  { id: 'shorts_camo', name: 'Camo Shorts', category: 'shorts', rarity: 'rare', color: '#55663A', color2: '#2F3A20', unlock: { kind: 'gems', cost: 30 } },
  { id: 'shorts_purple', name: 'Squat Champ Shorts', category: 'shorts', rarity: 'epic', color: '#6E3BFF', color2: '#FFC83D', unlock: { kind: 'event', eventId: 'squat_championship' } },
  { id: 'shorts_gold', name: 'Golden Shorts', category: 'shorts', rarity: 'legendary', color: '#FFC83D', unlock: { kind: 'level', level: 30 } },

  // Shoes
  { id: 'shoes_white', name: 'Fresh Sneakers', category: 'shoes', rarity: 'common', color: '#F2F4FA', unlock: { kind: 'default' } },
  { id: 'shoes_black', name: 'Stealth Trainers', category: 'shoes', rarity: 'common', color: '#22262F', unlock: { kind: 'default' } },
  { id: 'shoes_lifters', name: 'Red Lifters', category: 'shoes', rarity: 'rare', color: '#E03A5A', unlock: { kind: 'level', level: 4 } },
  { id: 'shoes_neon', name: 'Neon Runners', category: 'shoes', rarity: 'rare', color: '#3DFFB0', unlock: { kind: 'gems', cost: 35 } },
  { id: 'shoes_gold', name: 'Legend Kicks', category: 'shoes', rarity: 'legendary', color: '#FFC83D', unlock: { kind: 'achievement', id: 'legend' } },

  // Accessories
  { id: 'acc_none', name: 'No Accessory', category: 'accessory', rarity: 'common', color: '#9AA4BF', art: 'none', unlock: { kind: 'default' } },
  { id: 'acc_headband', name: 'Sweatband', category: 'accessory', rarity: 'common', color: '#FF4D6D', art: 'headband', unlock: { kind: 'level', level: 2 } },
  { id: 'acc_cap', name: 'Snapback Cap', category: 'accessory', rarity: 'common', color: '#3D7BFF', art: 'cap', unlock: { kind: 'gems', cost: 20 } },
  { id: 'acc_wristbands', name: 'Wrist Wraps', category: 'accessory', rarity: 'rare', color: '#FFC83D', art: 'wristbands', unlock: { kind: 'level', level: 6 } },
  { id: 'acc_belt', name: 'Lifting Belt', category: 'accessory', rarity: 'rare', color: '#7A4A2A', art: 'belt', unlock: { kind: 'achievement', id: 'powerhouse' } },
  { id: 'acc_headphones', name: 'Beat Headphones', category: 'accessory', rarity: 'epic', color: '#8B5CFF', art: 'headphones', unlock: { kind: 'event', eventId: 'equipment_collection' } },
  { id: 'acc_shades', name: 'Gym Shades', category: 'accessory', rarity: 'epic', color: '#111522', art: 'shades', unlock: { kind: 'gems', cost: 50 } },
  { id: 'acc_chain', name: 'Gold Chain', category: 'accessory', rarity: 'epic', color: '#FFC83D', art: 'chain', unlock: { kind: 'level', level: 15 } },
  { id: 'acc_crown', name: 'Empire Crown', category: 'accessory', rarity: 'legendary', color: '#FFD24D', art: 'crown', unlock: { kind: 'achievement', id: 'empire_builder' } },

  // Barbells
  { id: 'bar_steel', name: 'Steel Barbell', category: 'barbell', rarity: 'common', color: '#B8C0D4', unlock: { kind: 'default' } },
  { id: 'bar_black', name: 'Cerakote Black', category: 'barbell', rarity: 'common', color: '#2A2F3B', unlock: { kind: 'level', level: 7 } },
  { id: 'bar_blue', name: 'Electric Blue Bar', category: 'barbell', rarity: 'rare', color: '#3D7BFF', unlock: { kind: 'gems', cost: 40 } },
  { id: 'bar_neon', name: 'Neon Pulse Bar', category: 'barbell', rarity: 'epic', color: '#3DFFB0', unlock: { kind: 'event', eventId: 'bench_week' } },
  { id: 'bar_rainbow', name: 'Prism Bar', category: 'barbell', rarity: 'epic', color: '#FF5CC8', color2: '#3DE0FF', unlock: { kind: 'level', level: 25 } },
  { id: 'bar_gold', name: 'Golden Barbell', category: 'barbell', rarity: 'legendary', color: '#FFC83D', unlock: { kind: 'daily', day: 7 } },

  // Dumbbells
  { id: 'db_chrome', name: 'Chrome Dumbbells', category: 'dumbbell', rarity: 'common', color: '#C9D1E6', unlock: { kind: 'default' } },
  { id: 'db_hex', name: 'Hex Dumbbells', category: 'dumbbell', rarity: 'common', color: '#2A2F3B', unlock: { kind: 'level', level: 9 } },
  { id: 'db_pink', name: 'Bubblegum Bells', category: 'dumbbell', rarity: 'rare', color: '#FF7AC8', unlock: { kind: 'gems', cost: 30 } },
  { id: 'db_purple', name: 'Amethyst Bells', category: 'dumbbell', rarity: 'epic', color: '#8B5CFF', unlock: { kind: 'event', eventId: 'gym_expansion' } },
  { id: 'db_gold', name: 'Millionaire Bells', category: 'dumbbell', rarity: 'legendary', color: '#FFC83D', unlock: { kind: 'achievement', id: 'millionaire' } },

  // Decorations (placed on gym walls)
  { id: 'deco_poster', name: 'Motivation Poster', category: 'decoration', rarity: 'common', color: '#3D7BFF', art: 'poster', unlock: { kind: 'level', level: 2 } },
  { id: 'deco_plant', name: 'Lucky Plant', category: 'decoration', rarity: 'common', color: '#5AD25A', art: 'plant', unlock: { kind: 'daily', day: 4 } },
  { id: 'deco_chalk', name: 'Chalk Bowl', category: 'decoration', rarity: 'common', color: '#E8ECF5', art: 'chalk', unlock: { kind: 'level', level: 5 } },
  { id: 'deco_cooler', name: 'Water Cooler', category: 'decoration', rarity: 'common', color: '#7FD4FF', art: 'cooler', unlock: { kind: 'gems', cost: 15 } },
  { id: 'deco_bag', name: 'Punching Bag', category: 'decoration', rarity: 'rare', color: '#E03A5A', art: 'bag', unlock: { kind: 'level', level: 12 } },
  { id: 'deco_banner', name: 'Empire Banner', category: 'decoration', rarity: 'rare', color: '#8B5CFF', art: 'banner', unlock: { kind: 'missions', count: 25 } },
  { id: 'deco_trophy_shelf', name: 'Trophy Shelf', category: 'decoration', rarity: 'rare', color: '#FFC83D', art: 'shelf', unlock: { kind: 'achievement', id: 'first_win' } },
  { id: 'deco_neon', name: 'Neon "LIFT" Sign', category: 'decoration', rarity: 'epic', color: '#FF5CC8', art: 'neon', unlock: { kind: 'gems', cost: 60 } },
  { id: 'deco_boombox', name: 'Gym Boombox', category: 'decoration', rarity: 'epic', color: '#2A2F3B', color2: '#3DE0FF', art: 'boombox', unlock: { kind: 'event', eventId: 'gym_expansion' } },
  { id: 'deco_statue', name: 'Golden Lifter Statue', category: 'decoration', rarity: 'legendary', color: '#FFC83D', art: 'statue', unlock: { kind: 'level', level: 35 } },
  { id: 'deco_neon_crown', name: 'Neon Crown Sign', category: 'decoration', rarity: 'legendary', color: '#FFD24D', art: 'neon', unlock: { kind: 'iap', productId: 'bundle_royal' } },

  // Gym themes
  { id: 'theme_ocean', name: 'Ocean Blue', category: 'theme', rarity: 'rare', color: '#1E88E5', color2: '#0B3C6E', unlock: { kind: 'level', level: 18 } },
  { id: 'theme_jungle', name: 'Jungle Gym', category: 'theme', rarity: 'rare', color: '#2E9E5A', color2: '#164D2B', unlock: { kind: 'achievement', id: 'gym_tycoon' } },
  { id: 'theme_neon', name: 'Neon Night', category: 'theme', rarity: 'epic', color: '#FF3DCB', color2: '#2A0D4F', unlock: { kind: 'gems', cost: 150 } },
  { id: 'theme_lava', name: 'Lava Forge', category: 'theme', rarity: 'epic', color: '#FF5A1F', color2: '#3A0A05', unlock: { kind: 'event', eventId: 'deadlift_challenge' } },
  { id: 'theme_royal', name: 'Royal Gold', category: 'theme', rarity: 'legendary', color: '#FFD24D', color2: '#4A2A8A', unlock: { kind: 'iap', productId: 'theme_royal' } },
];

const TROPHY_RARITY: Rarity[] = ['common', 'common', 'rare', 'epic', 'legendary'];

const TROPHY_ITEMS: ItemDef[] = COMPETITION_TYPES.flatMap((c) =>
  COMPETITION_TIERS.map((t) => ({
    id: trophyId(c.type, t.tier),
    name: `${t.name} ${c.type === 'weekly' ? 'Champion' : c.name.split(' ')[0]} Trophy`,
    category: 'trophy' as const,
    rarity: TROPHY_RARITY[t.tier],
    color: t.color,
    color2: c.color,
    unlock: { kind: 'competition' as const, compType: c.type, tier: t.tier },
    description: `Win the ${t.name} ${c.name}.`,
  })),
);

export function trophyId(type: CompetitionType, tier: number): string {
  return `trophy_${type}_${tier}`;
}

export const ITEMS: ItemDef[] = [...BASE_ITEMS, ...TROPHY_ITEMS];

export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const DEFAULT_ITEM_IDS = ITEMS.filter((i) => i.unlock.kind === 'default').map((i) => i.id);

export const SKIN_TONES = ['#FFDCC2', '#F3C29B', '#D9A066', '#B97A48', '#8D5A34', '#5E3A22'];
export const HAIR_COLORS = ['#1E1A18', '#5A3A22', '#A8642E', '#E6C27A', '#D94A3D', '#7B5CFF', '#E8ECF5'];
export const HAIR_STYLES = [
  { id: 'short', name: 'Short' },
  { id: 'buzz', name: 'Buzz' },
  { id: 'spiky', name: 'Spiky' },
  { id: 'mohawk', name: 'Mohawk' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'bun', name: 'Top Bun' },
  { id: 'curly', name: 'Curly' },
  { id: 'bald', name: 'Bald' },
];
