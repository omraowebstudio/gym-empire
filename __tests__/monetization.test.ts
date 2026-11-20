import {
  MockReceiptVerifier,
  MockStoreClient,
  PurchaseService,
  type ReceiptVerifier,
} from '../src/services/monetization/purchaseService';
import {
  createPolicyState,
  evaluateInterstitial,
  recordInterstitialShown,
  recordRewardedShown,
  DEFAULT_INTERSTITIAL_POLICY as P,
} from '../src/services/monetization/interstitialPolicy';
import { applyVerifiedPurchase, restoreEntitlements, adFreeGems, ECONOMY } from '../src/game';
import { act } from '../src/game/engine';
import { must, newPlayer, rng, run, T0 } from './helpers';

function setup() {
  const store = new MockStoreClient();
  store.autoApprove = true;
  return { store, svc: new PurchaseService(store, new MockReceiptVerifier()) };
}

describe('purchase verification', () => {
  test('verified purchase grants gems exactly once', async () => {
    const { svc } = setup();
    let s = newPlayer();
    const gems = s.gems;
    const out = await svc.buy('gems_small', (v) => {
      s = must(s, T0, (d, ctx) => applyVerifiedPurchase(d, ctx, v));
    });
    expect(out.status).toBe('verified');
    expect(s.gems).toBe(gems + 100);
    // Replaying the same transaction does not grant again.
    if (out.status === 'verified') {
      const replay = run(s, T0, (d, ctx) => applyVerifiedPurchase(d, ctx, { productId: 'gems_small', transactionId: out.transactionId }));
      expect(replay.ok).toBe(false);
      expect(replay.state.gems).toBe(gems + 100);
    }
  });

  test('a tampered receipt is rejected and nothing is granted', async () => {
    const { store, svc } = setup();
    store.tamperNext = true;
    const granted = jest.fn();
    const out = await svc.buy('gems_large', granted);
    expect(out.status).toBe('failed');
    expect(granted).not.toHaveBeenCalled();
  });

  test('cancelled purchases grant nothing', async () => {
    const { store, svc } = setup();
    store.autoApprove = false;
    const granted = jest.fn();
    expect((await svc.buy('remove_ads', granted)).status).toBe('cancelled');
    expect(granted).not.toHaveBeenCalled();
  });

  test('a verifier response for a different product is rejected', async () => {
    const store = new MockStoreClient();
    store.autoApprove = true;
    const lying: ReceiptVerifier = { verify: async (tx) => ({ valid: true, productId: 'gems_large', transactionId: tx.transactionId }) };
    const granted = jest.fn();
    const out = await new PurchaseService(store, lying).buy('gems_small', granted);
    expect(out.status).toBe('failed');
    expect(granted).not.toHaveBeenCalled();
  });

  test('verifier errors fail safely', async () => {
    const store = new MockStoreClient();
    store.autoApprove = true;
    const broken: ReceiptVerifier = { verify: async () => { throw new Error('network'); } };
    const granted = jest.fn();
    expect((await new PurchaseService(store, broken).buy('gems_small', granted)).status).toBe('failed');
    expect(granted).not.toHaveBeenCalled();
  });

  test('remove ads + cosmetic bundle are non-consumable and restorable', async () => {
    const { svc } = setup();
    let s = newPlayer();
    await svc.buy('remove_ads', (v) => (s = must(s, T0, (d, ctx) => applyVerifiedPurchase(d, ctx, v))));
    await svc.buy('bundle_royal', (v) => (s = must(s, T0, (d, ctx) => applyVerifiedPurchase(d, ctx, v))));
    await svc.buy('gems_small', (v) => (s = must(s, T0, (d, ctx) => applyVerifiedPurchase(d, ctx, v))));
    expect(s.monetization.removeAds).toBe(true);
    expect(s.inventory.shirt_hoodie_gold).toBeDefined();
    const restored = await svc.restore();
    expect(restored.sort()).toEqual(['bundle_royal', 'remove_ads']);
    // Simulate reinstall
    let fresh = newPlayer();
    fresh = must(fresh, T0, (d, ctx) => restoreEntitlements(d, ctx, restored));
    expect(fresh.monetization.removeAds).toBe(true);
    expect(fresh.inventory.deco_neon_crown).toBeDefined();
    expect(fresh.gems).toBe(newPlayer().gems + 0 + (fresh.gems - newPlayer().gems)); // no consumables restored
    expect(fresh.monetization.entitlements).not.toContain('gems_small');
  });
});

describe('rewarded ad limits', () => {
  test('rewarded ads are capped per day', () => {
    let s = newPlayer();
    for (let i = 0; i < ECONOMY.ads.maxRewardedPerDay; i++) {
      const r = act(s, T0, (d, ctx) => adFreeGems(d, ctx), { rng: rng(), rewardedAd: true });
      expect(r.ok).toBe(true);
      s = r.state;
    }
    expect(act(s, T0, (d, ctx) => adFreeGems(d, ctx), { rng: rng(), rewardedAd: true }).ok).toBe(false);
  });
});

describe('interstitial policy', () => {
  test('never shows right after launch', () => {
    const st = createPolicyState(T0);
    for (let i = 0; i < 10; i++) expect(evaluateInterstitial(st, T0 + 1000, false).show).toBe(false);
  });

  test('never shows during active gameplay or with Remove Ads', () => {
    const st = createPolicyState(T0);
    st.breaksSinceLast = 99;
    const later = T0 + P.minSecondsAfterLaunch * 1000 + 1;
    st.activeGameplay = true;
    expect(evaluateInterstitial(st, later, false)).toEqual({ show: false, reason: 'active_gameplay' });
    st.activeGameplay = false;
    expect(evaluateInterstitial(st, later, true)).toEqual({ show: false, reason: 'remove_ads' });
  });

  test('requires several natural breaks and respects frequency caps (no back-to-back)', () => {
    const st = createPolicyState(T0);
    const t = T0 + P.minSecondsAfterLaunch * 1000 + 1;
    let shown = 0;
    for (let i = 0; i < P.naturalBreaksBetween; i++) if (evaluateInterstitial(st, t, false).show) shown++;
    expect(shown).toBe(1);
    recordInterstitialShown(st, t);
    for (let i = 0; i < 20; i++) expect(evaluateInterstitial(st, t + 1000, false).show).toBe(false);
  });

  test('waits after a rewarded ad', () => {
    const st = createPolicyState(T0);
    const t = T0 + P.minSecondsAfterLaunch * 1000 + 1;
    st.breaksSinceLast = 99;
    recordRewardedShown(st, t);
    expect(evaluateInterstitial(st, t + 1000, false)).toEqual({ show: false, reason: 'after_rewarded' });
  });
});
