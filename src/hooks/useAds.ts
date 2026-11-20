import { useCallback, useState } from 'react';
import type { ActionFn } from '@/game/engine';
import { rewardedAdsRemaining } from '@/game/systems/shop';
import { adService, evaluateInterstitial, interstitialState, recordInterstitialShown, recordRewardedShown, type AdPlacement } from '@/services/monetization';
import { dispatch, useGameStore } from '@/store/gameStore';

/**
 * Watch an optional rewarded ad, then grant `reward` ONLY if the ad SDK reports the
 * ad was watched to completion. Never grants on dismiss/error.
 */
export function useRewardedAd() {
  const [busy, setBusy] = useState(false);
  const watch = useCallback(async (placement: AdPlacement, reward: ActionFn): Promise<boolean> => {
    if (busy) return false;
    const game = useGameStore.getState().game;
    if (rewardedAdsRemaining(game, Date.now()) <= 0) {
      useGameStore.getState().pushToast({ kind: 'info', title: 'Daily ad bonus limit reached', subtitle: 'Come back tomorrow!', icon: '📺' });
      return false;
    }
    setBusy(true);
    try {
      const res = await adService.showRewarded(placement);
      recordRewardedShown(interstitialState, Date.now());
      if (res.status !== 'earned') {
        if (res.status === 'unavailable' || res.status === 'error') {
          useGameStore.getState().pushToast({ kind: 'info', title: 'No ad available right now', subtitle: res.reason, icon: '📺' });
        }
        return false;
      }
      return dispatch(reward, { rewardedAd: true }).ok;
    } finally {
      setBusy(false);
    }
  }, [busy]);
  return { watch, busy };
}

/** Marks training/competitions as active gameplay so interstitials can never interrupt them. */
export function setActiveGameplay(active: boolean) {
  interstitialState.activeGameplay = active;
}

/** Call at natural breaks (e.g. leaving a results screen). Shows an interstitial only if policy allows. */
export async function naturalBreak() {
  const removeAds = useGameStore.getState().game.monetization.removeAds;
  const decision = evaluateInterstitial(interstitialState, Date.now(), removeAds);
  if (!decision.show) return;
  recordInterstitialShown(interstitialState, Date.now());
  await adService.showInterstitial();
}
