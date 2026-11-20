import { MockAdService, type AdService } from './adService';
import { MockReceiptVerifier, MockStoreClient, PurchaseService } from './purchaseService';
import { createPolicyState } from './interstitialPolicy';

/**
 * Provider selection. Development and Expo Go builds use the clearly labelled mock
 * providers. See docs/MONETIZATION.md to switch to AdMob + StoreKit/Play Billing.
 */
export const mockAds = new MockAdService();
export const adService: AdService = mockAds;

export const mockStore = new MockStoreClient();
export const purchaseService = new PurchaseService(mockStore, new MockReceiptVerifier());

export const interstitialState = createPolicyState(Date.now());

export * from './adService';
export * from './purchaseService';
export * from './interstitialPolicy';
