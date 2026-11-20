// Pure, testable rules for when an interstitial ad MAY be shown.
export interface InterstitialPolicyConfig {
  minSecondsAfterLaunch: number;
  minSecondsBetween: number;
  naturalBreaksBetween: number; // show at most once every N natural breaks
  minSecondsAfterRewarded: number;
  maxPerSession: number;
}

export const DEFAULT_INTERSTITIAL_POLICY: InterstitialPolicyConfig = {
  minSecondsAfterLaunch: 240,
  minSecondsBetween: 300,
  naturalBreaksBetween: 4,
  minSecondsAfterRewarded: 120,
  maxPerSession: 4,
};

export interface InterstitialPolicyState {
  launchedAt: number;
  lastShownAt: number | null;
  lastRewardedAt: number | null;
  breaksSinceLast: number;
  shownThisSession: number;
  activeGameplay: boolean; // training or competition in progress
}

export function createPolicyState(now: number): InterstitialPolicyState {
  return { launchedAt: now, lastShownAt: null, lastRewardedAt: null, breaksSinceLast: 0, shownThisSession: 0, activeGameplay: false };
}

export type InterstitialDecision = { show: true } | { show: false; reason: string };

/**
 * Called at a natural break (e.g. leaving a results screen). Records the break and
 * decides whether an interstitial is allowed right now.
 */
export function evaluateInterstitial(
  s: InterstitialPolicyState,
  now: number,
  removeAds: boolean,
  cfg: InterstitialPolicyConfig = DEFAULT_INTERSTITIAL_POLICY,
): InterstitialDecision {
  if (removeAds) return { show: false, reason: 'remove_ads' };
  if (s.activeGameplay) return { show: false, reason: 'active_gameplay' };
  s.breaksSinceLast += 1;
  if (s.shownThisSession >= cfg.maxPerSession) return { show: false, reason: 'session_cap' };
  if (now - s.launchedAt < cfg.minSecondsAfterLaunch * 1000) return { show: false, reason: 'too_soon_after_launch' };
  if (s.lastShownAt !== null && now - s.lastShownAt < cfg.minSecondsBetween * 1000) return { show: false, reason: 'frequency_cap' };
  if (s.lastRewardedAt !== null && now - s.lastRewardedAt < cfg.minSecondsAfterRewarded * 1000) return { show: false, reason: 'after_rewarded' };
  if (s.breaksSinceLast < cfg.naturalBreaksBetween) return { show: false, reason: 'not_enough_breaks' };
  return { show: true };
}

export function recordInterstitialShown(s: InterstitialPolicyState, now: number): void {
  s.lastShownAt = now;
  s.breaksSinceLast = 0;
  s.shownThisSession += 1;
}

export function recordRewardedShown(s: InterstitialPolicyState, now: number): void {
  s.lastRewardedAt = now;
}
