// Gem/ad conveniences, verified purchase grants, and character customisation.
import { ECONOMY, maxEnergy } from '../config/economy';
import { HAIR_COLORS, HAIR_STYLES, ITEM_MAP, SKIN_TONES } from '../config/items';
import { PRODUCT_MAP } from '../config/products';
import { dateKey } from '../utils/time';
import type { ActionContext, Appearance, GameState, ItemCategory } from '../types';
import { addEnergy, createMember, currentEnergy, grantItem, grantReward, ownsItem, settleEnergy, spendGems } from './core';

// ---------------- Rewarded ads bookkeeping ----------------

export function rewardedAdsRemaining(state: GameState, now: number): number {
  const today = dateKey(now);
  const used = state.monetization.rewardedAdsDate === today ? state.monetization.rewardedAdsCount : 0;
  return Math.max(0, ECONOMY.ads.maxRewardedPerDay - used);
}

/** Must be called (inside the same action) whenever a rewarded ad reward is granted. */
export function consumeRewardedAd(state: GameState, now: number): boolean {
  if (rewardedAdsRemaining(state, now) <= 0) return false;
  const today = dateKey(now);
  if (state.monetization.rewardedAdsDate !== today) {
    state.monetization.rewardedAdsDate = today;
    state.monetization.rewardedAdsCount = 0;
  }
  state.monetization.rewardedAdsCount += 1;
  return true;
}

function addBoost(state: GameState, ctx: ActionContext, multiplier: number, minutes: number, source: 'ad' | 'gems'): void {
  const existing = state.boosts.find((b) => b.multiplier === multiplier && b.until > ctx.now);
  const cap = ctx.now + ECONOMY.boosts.maxBoostMinutes * 60000;
  if (existing) {
    existing.until = Math.min(cap, existing.until + minutes * 60000);
  } else {
    state.boosts.push({ id: `b${ctx.now}`, multiplier, until: Math.min(cap, ctx.now + minutes * 60000), source });
  }
}

// Ad reward actions below must be dispatched with `act(..., { rewardedAd: true })`,
// which enforces the daily cap. They are only invoked after the ad SDK reports a completed view.
export function adIncomeBoost(state: GameState, ctx: ActionContext): string | void {
  addBoost(state, ctx, ECONOMY.boosts.adIncomeMultiplier, ECONOMY.boosts.adBoostMinutes, 'ad');
}

export function gemIncomeBoost(state: GameState, ctx: ActionContext): string | void {
  if (!spendGems(state, ECONOMY.boosts.gemBoostCost)) return 'Not enough gems';
  addBoost(state, ctx, ECONOMY.boosts.adIncomeMultiplier, ECONOMY.boosts.gemBoostMinutes, 'gems');
}

export function refillEnergyWithGems(state: GameState, ctx: ActionContext): string | void {
  const max = maxEnergy(state.level);
  if (currentEnergy(state, ctx.now) >= max) return 'Energy already full';
  if (!spendGems(state, ECONOMY.energy.refillGemCost)) return 'Not enough gems';
  settleEnergy(state, ctx.now);
  state.energy = max;
  state.energyUpdatedAt = ctx.now;
}

export function adEnergyRefill(state: GameState, ctx: ActionContext): string | void {
  const max = maxEnergy(state.level);
  if (currentEnergy(state, ctx.now) >= max) return 'Energy already full';
  addEnergy(state, ctx.now, Math.ceil(max / 2));
}

export function adFreeGems(state: GameState, ctx: ActionContext): string | void {
  grantReward(state, ctx, { gems: 3 }, 'Free gems');
}

// ---------------- Verified purchases ----------------

export interface VerifiedPurchase {
  productId: string;
  transactionId: string;
}

/**
 * Applies a purchase ONLY after the purchase service has verified it.
 * Idempotent per transaction id so a replayed receipt never grants twice.
 */
export function applyVerifiedPurchase(state: GameState, ctx: ActionContext, p: VerifiedPurchase): string | void {
  const product = PRODUCT_MAP[p.productId];
  if (!product) return 'Unknown product';
  if (!p.transactionId) return 'Missing transaction';
  if (state.monetization.processedTransactions.includes(p.transactionId)) return 'Purchase already processed';
  if (product.kind === 'non_consumable' && state.monetization.entitlements.includes(product.id)) {
    state.monetization.processedTransactions.push(p.transactionId);
    return 'Already owned';
  }
  state.monetization.processedTransactions.push(p.transactionId);
  state.monetization.processedTransactions = state.monetization.processedTransactions.slice(-200);
  if (product.kind === 'non_consumable') state.monetization.entitlements.push(product.id);
  if (product.removeAds) state.monetization.removeAds = true;
  if (product.gems) state.gems += product.gems;
  for (const item of product.items ?? []) grantItem(state, ctx, item);
  ctx.effects.push({ type: 'reward', cash: 0, xp: 0, gems: product.gems ?? 0, label: product.name });
}

/** Restores non-consumable entitlements (e.g. after reinstall). Never grants consumables. */
export function restoreEntitlements(state: GameState, ctx: ActionContext, productIds: string[]): string | void {
  for (const id of productIds) {
    const product = PRODUCT_MAP[id];
    if (!product || product.kind !== 'non_consumable') continue;
    if (!state.monetization.entitlements.includes(id)) state.monetization.entitlements.push(id);
    if (product.removeAds) state.monetization.removeAds = true;
    for (const item of product.items ?? []) grantItem(state, ctx, item);
  }
}

// ---------------- Customisation ----------------

const SLOT_CATEGORY: Record<'shirt' | 'shorts' | 'shoes' | 'accessory', ItemCategory> = {
  shirt: 'shirt',
  shorts: 'shorts',
  shoes: 'shoes',
  accessory: 'accessory',
};

export function setAppearance(state: GameState, _ctx: ActionContext, patch: Partial<Appearance>): string | void {
  const next = { ...state.profile.appearance, ...patch };
  if (next.skin < 0 || next.skin >= SKIN_TONES.length) return 'Invalid skin tone';
  if (next.hairColor < 0 || next.hairColor >= HAIR_COLORS.length) return 'Invalid hair colour';
  if (!HAIR_STYLES.some((h) => h.id === next.hair)) return 'Invalid hairstyle';
  for (const slot of Object.keys(SLOT_CATEGORY) as (keyof typeof SLOT_CATEGORY)[]) {
    const id = next[slot];
    const def = ITEM_MAP[id];
    if (!def || def.category !== SLOT_CATEGORY[slot]) return `Invalid ${slot}`;
    if (!ownsItem(state, id)) return `${def.name} is locked`;
  }
  state.profile.appearance = next;
}

export function setName(state: GameState, _ctx: ActionContext, name: string): string | void {
  const clean = name.replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 16);
  if (clean.length < 2) return 'Name must be at least 2 characters';
  state.profile.name = clean;
}

export function equipSkin(state: GameState, _ctx: ActionContext, itemId: string): string | void {
  const def = ITEM_MAP[itemId];
  if (!def || (def.category !== 'barbell' && def.category !== 'dumbbell')) return 'Not an equipment skin';
  if (!ownsItem(state, itemId)) return 'Item locked';
  if (def.category === 'barbell') state.skins.barbell = itemId;
  else state.skins.dumbbell = itemId;
}

export function completeOnboarding(state: GameState, ctx: ActionContext, name: string, appearance: Appearance): string | void {
  const e1 = setName(state, ctx, name);
  if (e1) return e1;
  const e2 = setAppearance(state, ctx, appearance);
  if (e2) return e2;
  const wasOnboarded = state.profile.onboarded;
  state.profile.onboarded = true;
  state.lastTickAt = ctx.now;
  if (!wasOnboarded) {
    const garage = state.locations.garage;
    if (garage) {
      for (let i = 0; i < ECONOMY.gym.startingMembers; i++) createMember(state, garage, ctx, 'basic');
    }
  }
}
