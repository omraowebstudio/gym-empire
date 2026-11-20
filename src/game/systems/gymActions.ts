import { ECONOMY } from '../config/economy';
import { EQUIPMENT_MAP, FACILITY_MAP } from '../config/equipment';
import { ITEM_MAP } from '../config/items';
import { LOCATION_MAP, LOCATION_ORDER } from '../config/locations';
import { STAFF_MAP } from '../config/staff';
import { FIRST_NAMES, LAST_INITIALS } from '../config/names';
import { createLocationState, nextId } from '../state';
import { pick } from '../utils/rng';
import type { ActionContext, EquipmentId, FacilityId, GameState, LocationId, StaffType } from '../types';
import { createMember, grantCash, grantXp, ownsItem, spendCash, track } from './core';
import {
  equipmentPrice,
  equipmentUpgradeCost,
  facilityUpgradeCost,
  locationCapacity,
  manualRecruitCost,
  staffHireCost,
  staffSlots,
  staffUpgradeCost,
} from './gym';

const G = ECONOMY.gym;

function getLoc(state: GameState, id: LocationId) {
  return state.locations[id];
}

export function buyEquipment(
  state: GameState,
  ctx: ActionContext,
  locationId: LocationId,
  slotId: string,
  equipmentId: EquipmentId,
): string | void {
  const loc = getLoc(state, locationId);
  if (!loc) return 'Location not owned';
  if (!(slotId in loc.slots)) return 'Invalid slot';
  if (loc.slots[slotId]) return 'Slot already occupied';
  const def = EQUIPMENT_MAP[equipmentId];
  if (!def) return 'Unknown equipment';
  if (def.minLocationTier > LOCATION_MAP[locationId].tier) return `Requires a bigger gym`;
  const price = equipmentPrice(loc, equipmentId);
  if (!spendCash(state, price)) return 'Not enough cash';
  loc.slots[slotId] = { itemId: equipmentId, level: 1 };
  state.counters.equipmentBought += 1;
  track(state, ctx, { type: 'buy_equipment' });
  grantXp(state, ctx, Math.round(15 * (1 + LOCATION_MAP[locationId].tier)));
}

export function upgradeEquipment(state: GameState, ctx: ActionContext, locationId: LocationId, slotId: string): string | void {
  const loc = getLoc(state, locationId);
  if (!loc) return 'Location not owned';
  const placed = loc.slots[slotId];
  if (!placed) return 'No equipment in this slot';
  if (placed.level >= G.maxEquipmentLevel) return 'Already max level';
  const cost = equipmentUpgradeCost(loc, placed);
  if (!spendCash(state, cost)) return 'Not enough cash';
  placed.level += 1;
  state.counters.equipmentUpgrades += 1;
  track(state, ctx, { type: 'upgrade_equipment' });
  grantXp(state, ctx, Math.round(8 * (1 + LOCATION_MAP[locationId].tier) * Math.sqrt(placed.level)));
}

/** Swap the contents of two slots (moving equipment). Members follow their equipment. */
export function moveEquipment(state: GameState, _ctx: ActionContext, locationId: LocationId, from: string, to: string): string | void {
  const loc = getLoc(state, locationId);
  if (!loc) return 'Location not owned';
  if (!(from in loc.slots) || !(to in loc.slots) || from === to) return 'Invalid slots';
  if (!loc.slots[from]) return 'Nothing to move';
  const a = loc.slots[from];
  loc.slots[from] = loc.slots[to];
  loc.slots[to] = a;
  for (const m of loc.members) {
    if (m.slotId === from) m.slotId = to;
    else if (m.slotId === to) m.slotId = from;
  }
}

export function upgradeFacility(state: GameState, ctx: ActionContext, locationId: LocationId, facility: FacilityId): string | void {
  const loc = getLoc(state, locationId);
  if (!loc) return 'Location not owned';
  if (!FACILITY_MAP[facility]) return 'Unknown facility';
  if (loc.facilities[facility] >= G.facilityMaxLevel) return 'Already max level';
  const cost = facilityUpgradeCost(loc, facility);
  if (!spendCash(state, cost)) return 'Not enough cash';
  loc.facilities[facility] += 1;
  state.counters.facilityUpgrades += 1;
  track(state, ctx, { type: 'upgrade_facility' });
  grantXp(state, ctx, Math.round(10 * (1 + LOCATION_MAP[locationId].tier)));
}

export function recruitMember(state: GameState, ctx: ActionContext, locationId: LocationId): string | void {
  const loc = getLoc(state, locationId);
  if (!loc) return 'Location not owned';
  if (loc.members.length >= locationCapacity(loc)) return 'Gym is full: add equipment for more capacity';
  const cost = manualRecruitCost(loc);
  if (!spendCash(state, cost)) return 'Not enough cash';
  const m = createMember(state, loc, ctx);
  if (!m) return 'No free equipment';
  ctx.effects.push({ type: 'memberJoined', name: m.name, locationId });
}

export function canUnlockLocation(state: GameState, id: LocationId): string | null {
  const def = LOCATION_MAP[id];
  if (!def) return 'Unknown location';
  if (state.locations[id]) return 'Already owned';
  const idx = LOCATION_ORDER.indexOf(id);
  if (idx > 0 && !state.locations[LOCATION_ORDER[idx - 1]]) return `Unlock ${LOCATION_MAP[LOCATION_ORDER[idx - 1]].name} first`;
  if (state.level < def.unlockLevel) return `Requires level ${def.unlockLevel}`;
  if (state.cash < def.unlockCost) return 'Not enough cash';
  return null;
}

export function unlockLocation(state: GameState, ctx: ActionContext, id: LocationId): string | void {
  const err = canUnlockLocation(state, id);
  if (err) return err;
  const def = LOCATION_MAP[id];
  if (!spendCash(state, def.unlockCost)) return 'Not enough cash';
  const loc = createLocationState(id);
  // Every new gym opens with a free starter rack and a couple of founding members.
  loc.slots.s0 = { itemId: 'dumbbell_rack', level: 1 };
  state.locations[id] = loc;
  createMember(state, loc, ctx, 'basic');
  createMember(state, loc, ctx, 'plus');
  state.currentLocation = id;
  state.counters.locationsUnlocked += 1;
  track(state, ctx, { type: 'unlock_location' });
  grantXp(state, ctx, 150 * (def.tier + 1));
}

export function switchLocation(state: GameState, _ctx: ActionContext, id: LocationId): string | void {
  if (!state.locations[id]) return 'Location not owned';
  state.currentLocation = id;
}

export function setDecoration(
  state: GameState,
  _ctx: ActionContext,
  locationId: LocationId,
  index: number,
  itemId: string | null,
): string | void {
  const loc = getLoc(state, locationId);
  if (!loc) return 'Location not owned';
  if (index < 0 || index >= loc.decorations.length) return 'Invalid decoration spot';
  if (itemId !== null) {
    const def = ITEM_MAP[itemId];
    if (!def || def.category !== 'decoration') return 'Not a decoration';
    if (!ownsItem(state, itemId)) return 'Item not owned';
    // Each decoration can only be shown once per gym.
    loc.decorations = loc.decorations.map((d, i) => (d === itemId && i !== index ? null : d));
  }
  loc.decorations[index] = itemId;
}

export function setTheme(state: GameState, _ctx: ActionContext, locationId: LocationId, itemId: string | null): string | void {
  const loc = getLoc(state, locationId);
  if (!loc) return 'Location not owned';
  if (itemId !== null) {
    const def = ITEM_MAP[itemId];
    if (!def || def.category !== 'theme') return 'Not a theme';
    if (!ownsItem(state, itemId)) return 'Item not owned';
  }
  loc.theme = itemId;
}

// ---------- Tip jar ----------

export function collectTips(state: GameState, ctx: ActionContext): string | void {
  if (state.tipJar < 1) return 'Tip jar is empty';
  const amount = Math.floor(state.tipJar);
  state.tipJar = 0;
  grantCash(state, ctx, amount);
  state.counters.incomeCollections += 1;
  track(state, ctx, { type: 'collect_income' });
  ctx.effects.push({ type: 'reward', cash: amount, xp: 0, gems: 0, label: 'Tip jar' });
}

// ---------- Staff ----------

export function hireStaff(state: GameState, ctx: ActionContext, type: StaffType): string | void {
  if (!STAFF_MAP[type]) return 'Unknown staff type';
  if (state.level < ECONOMY.staff.unlockLevel) return `Staff unlock at level ${ECONOMY.staff.unlockLevel}`;
  if (state.staff.length >= staffSlots(state)) return 'No free staff slots: open another gym';
  const cost = staffHireCost(state, type);
  if (!spendCash(state, cost)) return 'Not enough cash';
  state.staff.push({
    id: nextId(state, 'st'),
    type,
    name: `${pick(ctx.rng, FIRST_NAMES)} ${pick(ctx.rng, LAST_INITIALS)}.`,
    level: 1,
    seed: Math.floor(ctx.rng() * 1e9),
    hiredAt: ctx.now,
  });
  state.counters.staffHired += 1;
  track(state, ctx, { type: 'hire_staff' });
  track(state, ctx, { type: 'upgrade_staff' });
  grantXp(state, ctx, 40);
}

export function upgradeStaff(state: GameState, ctx: ActionContext, staffId: string): string | void {
  const s = state.staff.find((x) => x.id === staffId);
  if (!s) return 'Staff not found';
  if (s.level >= ECONOMY.staff.maxLevel) return 'Already max level';
  const cost = staffUpgradeCost(state, s.type, s.level);
  if (!spendCash(state, cost)) return 'Not enough cash';
  s.level += 1;
  state.counters.staffUpgrades += 1;
  track(state, ctx, { type: 'upgrade_staff' });
  grantXp(state, ctx, 20 * s.level);
}

export function fireStaff(state: GameState, _ctx: ActionContext, staffId: string): string | void {
  const idx = state.staff.findIndex((x) => x.id === staffId);
  if (idx < 0) return 'Staff not found';
  state.staff.splice(idx, 1);
}
