// In-app purchase catalog. Prices shown in the UI come from the store at runtime when
// available; `displayPrice` is only a fallback label for test mode.

export type ProductKind = 'consumable' | 'non_consumable';

export interface ProductDef {
  id: string;
  name: string;
  description: string;
  kind: ProductKind;
  displayPrice: string;
  gems?: number;
  cash?: number; // minutes of income
  items?: string[];
  removeAds?: boolean;
  badge?: string;
}

export const PRODUCTS: ProductDef[] = [
  { id: 'remove_ads', name: 'Remove Ads', description: 'Removes all interstitial ads forever. Optional rewarded ads stay available for bonuses.', kind: 'non_consumable', displayPrice: '$3.99', removeAds: true, badge: 'POPULAR' },
  { id: 'gems_small', name: 'Pouch of Gems', description: '100 gems', kind: 'consumable', displayPrice: '$0.99', gems: 100 },
  { id: 'gems_medium', name: 'Chest of Gems', description: '550 gems (10% bonus)', kind: 'consumable', displayPrice: '$4.99', gems: 550 },
  { id: 'gems_large', name: 'Vault of Gems', description: '1,200 gems (20% bonus)', kind: 'consumable', displayPrice: '$9.99', gems: 1200, badge: 'BEST VALUE' },
  { id: 'bundle_royal', name: 'Royal Cosmetic Bundle', description: 'Royal Hoodie + Neon Crown Sign + 200 gems', kind: 'non_consumable', displayPrice: '$4.99', gems: 200, items: ['shirt_hoodie_gold', 'deco_neon_crown'] },
  { id: 'theme_royal', name: 'Royal Gold Gym Theme', description: 'A legendary purple-and-gold theme for any gym.', kind: 'non_consumable', displayPrice: '$2.99', items: ['theme_royal'] },
];

export const PRODUCT_MAP: Record<string, ProductDef> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
