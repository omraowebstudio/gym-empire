// Pure calculators for the gym tycoon side: capacity, satisfaction, income, prices.
import { ECONOMY } from '../config/economy';
import { EQUIPMENT_MAP, FACILITY_MAP } from '../config/equipment';
import { ITEM_MAP } from '../config/items';
import { LOCATION_MAP, LOCATION_ORDER } from '../config/locations';
import { STAFF_MAP } from '../config/staff';
import type {
  EquipmentId,
  FacilityId,
  GameState,
  LocationId,
  LocationState,
  Member,
  MembershipTier,
  PlacedEquipment,
  StaffType,
} from '../types';

const G = ECONOMY.gym;

export function ownedLocations(state: GameState): LocationState[] {
  return LOCATION_ORDER.map((id) => state.locations[id]).filter((l): l is LocationState => !!l);
}

export function empireScale(state: GameState): number {
  return ownedLocations(state).reduce((m, l) => Math.max(m, LOCATION_MAP[l.id].incomeMult), 1);
}

export function equipmentCapacity(placed: PlacedEquipment): number {
  return EQUIPMENT_MAP[placed.itemId].capacity + Math.floor((placed.level - 1) / G.capacityPerLevels);
}

export function locationCapacity(loc: LocationState): number {
  let cap = 0;
  for (const p of Object.values(loc.slots)) if (p) cap += equipmentCapacity(p);
  return cap;
}

export function locationAppeal(loc: LocationState): number {
  let appeal = 0;
  for (const p of Object.values(loc.slots)) {
    if (p) appeal += EQUIPMENT_MAP[p.itemId].appeal * (1 + 0.15 * (p.level - 1));
  }
  for (const f of Object.keys(loc.facilities) as FacilityId[]) {
    appeal += loc.facilities[f] * FACILITY_MAP[f].appealPerLevel;
  }
  return Math.round(appeal);
}

export function staffLevelSum(state: GameState, type: StaffType): number {
  return state.staff.filter((s) => s.type === type).reduce((sum, s) => sum + s.level, 0);
}

export function decorationSatisfaction(loc: LocationState): number {
  let total = 0;
  for (const d of loc.decorations) {
    if (d && ITEM_MAP[d]) total += G.decorationSatisfaction[ITEM_MAP[d].rarity];
  }
  if (loc.theme && ITEM_MAP[loc.theme]) total += G.decorationSatisfaction[ITEM_MAP[loc.theme].rarity];
  return total;
}

export interface SatisfactionBreakdown {
  base: number;
  facilities: number;
  staff: number;
  decorations: number;
  crowding: number;
  total: number;
}

export function locationSatisfaction(state: GameState, loc: LocationState): SatisfactionBreakdown {
  let facilities = 0;
  for (const f of Object.keys(loc.facilities) as FacilityId[]) {
    facilities += loc.facilities[f] * G.satisfactionPerFacilityLevel[f];
  }
  const staff =
    staffLevelSum(state, 'trainer') * STAFF_MAP.trainer.satisfactionPerLevel +
    staffLevelSum(state, 'cleaner') * STAFF_MAP.cleaner.satisfactionPerLevel;
  const decorations = decorationSatisfaction(loc);
  const cap = locationCapacity(loc);
  const crowding = cap > 0 && loc.members.length / cap > G.crowdingThreshold ? -G.crowdingPenalty : 0;
  const raw = G.baseSatisfaction + facilities + staff + decorations + crowding;
  return {
    base: G.baseSatisfaction,
    facilities,
    staff,
    decorations,
    crowding,
    total: Math.max(0, Math.min(100, Math.round(raw))),
  };
}

export function satisfactionMultiplier(sat: number): number {
  return G.satisfactionIncomeMin + G.satisfactionIncomeRange * (sat / 100);
}

export function memberFeePerMin(loc: LocationState, member: Member): number {
  const mult = LOCATION_MAP[loc.id].incomeMult;
  const placed = member.slotId ? loc.slots[member.slotId] : null;
  const quality = 1 + G.equipmentQualityPerLevel * ((placed?.level ?? 1) - 1);
  return G.tierFeePerMin[member.tier] * mult * quality;
}

export function memberSatisfaction(state: GameState, loc: LocationState, member: Member): number {
  return Math.max(0, Math.min(100, locationSatisfaction(state, loc).total + member.satisfactionOffset));
}

export function locationGrossPerMin(state: GameState, loc: LocationState): number {
  const sat = locationSatisfaction(state, loc).total;
  let sum = 0;
  for (const m of loc.members) sum += memberFeePerMin(loc, m);
  return sum * satisfactionMultiplier(sat);
}

export function managerIncomeBonus(state: GameState): number {
  return staffLevelSum(state, 'manager') * STAFF_MAP.manager.incomePerLevel;
}

export function staffSalaryPerMin(state: GameState): number {
  const scale = empireScale(state);
  return state.staff.reduce((sum, s) => sum + STAFF_MAP[s.type].baseSalaryPerMin * s.level * scale, 0);
}

export function activeBoostMultiplier(state: GameState, now: number): number {
  let m = 1;
  for (const b of state.boosts) if (b.until > now) m = Math.max(m, b.multiplier);
  return m;
}

export interface IncomeBreakdown {
  perLocation: { id: LocationId; gross: number }[];
  gross: number;
  managerBonus: number;
  boostBonus: number;
  salaries: number;
  net: number;
}

export function incomeBreakdown(state: GameState, now: number, ignoreBoost = false): IncomeBreakdown {
  const perLocation = ownedLocations(state).map((l) => ({ id: l.id, gross: locationGrossPerMin(state, l) }));
  const gross = perLocation.reduce((s, l) => s + l.gross, 0);
  const managerBonus = gross * managerIncomeBonus(state);
  const boostMult = ignoreBoost ? 1 : activeBoostMultiplier(state, now);
  const boostBonus = (gross + managerBonus) * (boostMult - 1);
  const salaries = staffSalaryPerMin(state);
  const net = Math.max(0, gross + managerBonus + boostBonus - salaries);
  return { perLocation, gross, managerBonus, boostBonus, salaries, net };
}

export function netIncomePerMin(state: GameState, now: number): number {
  return incomeBreakdown(state, now).net;
}

/** Income without temporary boosts, used to scale rewards fairly. */
export function baseIncomePerMin(state: GameState): number {
  return incomeBreakdown(state, 0, true).net;
}

export function offlineCapSeconds(state: GameState): number {
  const hours =
    ECONOMY.offline.baseCapHours + staffLevelSum(state, 'manager') * STAFF_MAP.manager.offlineHoursPerLevel;
  return Math.round(hours * 3600);
}

export function recruitRatePerMin(state: GameState, loc: LocationState): number {
  const sat = locationSatisfaction(state, loc).total;
  const recep = staffLevelSum(state, 'receptionist') * STAFF_MAP.receptionist.recruitPerLevel;
  return G.baseRecruitPerMin * (1 + recep) * (0.5 + sat / 100);
}

export function tierChances(state: GameState, loc: LocationState): Record<MembershipTier, number> {
  const score = Math.min(1, locationAppeal(loc) / LOCATION_MAP[loc.id].appealTarget);
  const recep = staffLevelSum(state, 'receptionist') * STAFF_MAP.receptionist.premiumChancePerLevel;
  const vip = Math.min(0.4, 0.03 + 0.17 * score + recep);
  const plus = Math.min(0.5, 0.2 + 0.3 * score + recep);
  return { vip, plus, basic: Math.max(0, 1 - vip - plus) };
}

// ---------- Prices ----------

export function countEquipmentAt(loc: LocationState): number {
  return Object.values(loc.slots).filter(Boolean).length;
}

export function equipmentPrice(loc: LocationState, id: EquipmentId): number {
  const def = EQUIPMENT_MAP[id];
  const mult = LOCATION_MAP[loc.id].priceMult;
  return Math.round(def.basePrice * mult * Math.pow(G.equipmentPriceGrowth, countEquipmentAt(loc)));
}

export function equipmentUpgradeCost(loc: LocationState, placed: PlacedEquipment): number {
  const def = EQUIPMENT_MAP[placed.itemId];
  const mult = LOCATION_MAP[loc.id].priceMult;
  return Math.round(def.basePrice * mult * G.upgradeCostFactor * Math.pow(G.upgradeCostGrowth, placed.level - 1));
}

export function facilityUpgradeCost(loc: LocationState, id: FacilityId): number {
  const mult = LOCATION_MAP[loc.id].priceMult;
  return Math.round(FACILITY_MAP[id].basePrice * mult * Math.pow(G.facilityCostGrowth, loc.facilities[id]));
}

export function manualRecruitCost(loc: LocationState): number {
  return Math.round(G.tierFeePerMin.basic * LOCATION_MAP[loc.id].incomeMult * G.manualRecruitFeeMinutes);
}

export function staffSlots(state: GameState): number {
  return ECONOMY.staff.baseSlots + ECONOMY.staff.slotsPerLocation * ownedLocations(state).length;
}

export function staffHireCost(state: GameState, type: StaffType): number {
  const count = state.staff.filter((s) => s.type === type).length;
  return Math.round(STAFF_MAP[type].baseHireCost * empireScale(state) * (1 + 0.5 * count));
}

export function staffUpgradeCost(state: GameState, type: StaffType, level: number): number {
  return Math.round(STAFF_MAP[type].baseHireCost * empireScale(state) * Math.pow(ECONOMY.staff.upgradeGrowth, level));
}

export function totalMembers(state: GameState): number {
  return ownedLocations(state).reduce((s, l) => s + l.members.length, 0);
}

export function totalEquipment(state: GameState): number {
  return ownedLocations(state).reduce((s, l) => s + countEquipmentAt(l), 0);
}

export function maxEquipmentLevel(state: GameState): number {
  let max = 0;
  for (const l of ownedLocations(state)) for (const p of Object.values(l.slots)) if (p) max = Math.max(max, p.level);
  return max;
}

/** Pick the slot with the most free capacity for a new member. */
export function bestSlotForMember(loc: LocationState): string | null {
  let best: string | null = null;
  let bestFree = 0;
  for (const [slotId, p] of Object.entries(loc.slots)) {
    if (!p) continue;
    const used = loc.members.filter((m) => m.slotId === slotId).length;
    const free = equipmentCapacity(p) - used;
    if (free > bestFree) {
      bestFree = free;
      best = slotId;
    }
  }
  return best;
}

/** Gym "reputation" score used by the weekly championship and leaderboards. */
export function gymScore(state: GameState): number {
  return ownedLocations(state).reduce((s, l) => s + locationAppeal(l) + l.members.length * 5, 0);
}
