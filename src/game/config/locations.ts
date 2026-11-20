import type { LocationId } from '../types';

export interface LocationTheme {
  wallTop: string;
  wallBottom: string;
  floorA: string;
  floorB: string;
  accent: string;
  trim: string;
  light: string;
}

export interface LocationDef {
  id: LocationId;
  tier: number;
  name: string;
  city: string;
  description: string;
  unlockLevel: number;
  unlockCost: number;
  incomeMult: number;
  priceMult: number;
  slotCount: number;
  decorationSlots: number;
  appealTarget: number;
  theme: LocationTheme;
}

export const LOCATIONS: LocationDef[] = [
  {
    id: 'garage', tier: 0, name: 'Garage Gym', city: 'Hometown', description: 'Where every legend starts: a cramped garage and big dreams.',
    unlockLevel: 1, unlockCost: 0, incomeMult: 1, priceMult: 1, slotCount: 6, decorationSlots: 2, appealTarget: 120,
    theme: { wallTop: '#5B6478', wallBottom: '#3A4152', floorA: '#6B7080', floorB: '#5F6474', accent: '#FFC83D', trim: '#2A2F3B', light: '#FFE7A8' },
  },
  {
    id: 'neighborhood', tier: 1, name: 'Neighborhood Gym', city: 'Maple Street', description: 'A cozy local spot. The neighbours are getting swole.',
    unlockLevel: 5, unlockCost: 15000, incomeMult: 3, priceMult: 3, slotCount: 8, decorationSlots: 3, appealTarget: 220,
    theme: { wallTop: '#8A5A3C', wallBottom: '#5E3B26', floorA: '#B07A4F', floorB: '#9E6B43', accent: '#FFC83D', trim: '#3B2416', light: '#FFE1A0' },
  },
  {
    id: 'commercial', tier: 2, name: 'Commercial Gym', city: 'Downtown', description: 'Bright, busy and buzzing with members.',
    unlockLevel: 10, unlockCost: 150000, incomeMult: 9, priceMult: 9, slotCount: 10, decorationSlots: 3, appealTarget: 380,
    theme: { wallTop: '#2F6BFF', wallBottom: '#1E3FA8', floorA: '#3A4A6B', floorB: '#33425F', accent: '#FFC83D', trim: '#14275E', light: '#D8E8FF' },
  },
  {
    id: 'hardcore', tier: 3, name: 'Hardcore Gym', city: 'Iron District', description: 'Chalk in the air, metal on the speakers. No excuses.',
    unlockLevel: 16, unlockCost: 1200000, incomeMult: 25, priceMult: 25, slotCount: 10, decorationSlots: 4, appealTarget: 600,
    theme: { wallTop: '#4A1B22', wallBottom: '#2A0E12', floorA: '#2E2E33', floorB: '#26262A', accent: '#FF4D4D', trim: '#140608', light: '#FFB3A0' },
  },
  {
    id: 'premium', tier: 4, name: 'Premium Fitness Club', city: 'Harbor Heights', description: 'Marble, gold trim and smoothie bars.',
    unlockLevel: 22, unlockCost: 9000000, incomeMult: 70, priceMult: 70, slotCount: 12, decorationSlots: 4, appealTarget: 900,
    theme: { wallTop: '#ECE6DA', wallBottom: '#C9BFA9', floorA: '#F5F1E8', floorB: '#E6DFD0', accent: '#D4A017', trim: '#8C7A4F', light: '#FFF6DA' },
  },
  {
    id: 'pro', tier: 5, name: 'Pro Training Center', city: 'Capital City', description: 'Where professional athletes come to train.',
    unlockLevel: 30, unlockCost: 60000000, incomeMult: 200, priceMult: 200, slotCount: 12, decorationSlots: 5, appealTarget: 1300,
    theme: { wallTop: '#0E1F4D', wallBottom: '#081333', floorA: '#16244A', floorB: '#12203F', accent: '#3DE0FF', trim: '#050B1F', light: '#A8F0FF' },
  },
  {
    id: 'elite', tier: 6, name: 'Elite Fitness Empire', city: 'Global HQ', description: 'The flagship of your worldwide fitness empire.',
    unlockLevel: 40, unlockCost: 450000000, incomeMult: 600, priceMult: 600, slotCount: 14, decorationSlots: 6, appealTarget: 1900,
    theme: { wallTop: '#3B1670', wallBottom: '#220C45', floorA: '#2A1450', floorB: '#241046', accent: '#FFD24D', trim: '#12062A', light: '#FFE9A8' },
  },
];

export const LOCATION_MAP: Record<LocationId, LocationDef> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
) as Record<LocationId, LocationDef>;

export const LOCATION_ORDER: LocationId[] = LOCATIONS.map((l) => l.id);

export function slotIds(locationId: LocationId): string[] {
  const count = LOCATION_MAP[locationId].slotCount;
  return Array.from({ length: count }, (_, i) => `s${i}`);
}

/** Normalised floor positions (0..1) for each slot, laid out in rows of up to 3-4. */
export function slotPosition(locationId: LocationId, slotId: string): { x: number; y: number } {
  const count = LOCATION_MAP[locationId].slotCount;
  const idx = Number(slotId.slice(1));
  const perRow = count <= 6 ? 3 : count <= 10 ? 4 : 5;
  const rows = Math.ceil(count / perRow);
  const row = Math.floor(idx / perRow);
  const inRow = idx % perRow;
  const rowCount = Math.min(perRow, count - row * perRow);
  const x = (inRow + 1) / (rowCount + 1);
  const y = rows === 1 ? 0.5 : 0.18 + (row / (rows - 1)) * 0.64;
  return { x, y };
}
