// Advertising abstraction. Game code only talks to `AdService`; the concrete provider
// (mock in development, AdMob in production builds) is selected in ./index.ts.

export type AdPlacement =
  | 'offline_double'
  | 'income_boost'
  | 'mission_double'
  | 'daily_bonus'
  | 'energy_refill'
  | 'free_gems';

export type RewardedResult =
  | { status: 'earned' }
  | { status: 'dismissed' }
  | { status: 'unavailable'; reason: string }
  | { status: 'error'; reason: string };

export interface AdConsent {
  personalized: boolean;
}

export interface AdService {
  readonly name: string;
  /** true for mock/test providers: the UI must label these clearly as test ads */
  readonly isTestMode: boolean;
  initialize(consent: AdConsent): Promise<void>;
  isRewardedReady(): boolean;
  showRewarded(placement: AdPlacement): Promise<RewardedResult>;
  showInterstitial(): Promise<boolean>;
}

export interface MockAdRequest {
  kind: 'rewarded' | 'interstitial';
  placement?: AdPlacement;
  resolve: (completed: boolean) => void;
}

type Listener = (req: MockAdRequest) => void;

/**
 * Development ad provider. It never contacts an ad network. It asks the UI host
 * (<MockAdHost/>) to display a clearly labelled TEST AD overlay with a countdown.
 * A reward is only granted if the countdown is completed, mirroring real SDK callbacks.
 */
export class MockAdService implements AdService {
  readonly name = 'Mock Ads (TEST MODE)';
  readonly isTestMode = true;
  private listener: Listener | null = null;
  private busy = false;

  setHost(listener: Listener | null) {
    this.listener = listener;
  }

  async initialize(_consent: AdConsent): Promise<void> {}

  isRewardedReady(): boolean {
    return !!this.listener && !this.busy;
  }

  showRewarded(placement: AdPlacement): Promise<RewardedResult> {
    if (!this.listener) return Promise.resolve({ status: 'unavailable', reason: 'Ad host not mounted' });
    if (this.busy) return Promise.resolve({ status: 'unavailable', reason: 'Another ad is showing' });
    this.busy = true;
    return new Promise((resolve) => {
      this.listener!({
        kind: 'rewarded',
        placement,
        resolve: (completed) => {
          this.busy = false;
          resolve(completed ? { status: 'earned' } : { status: 'dismissed' });
        },
      });
    });
  }

  showInterstitial(): Promise<boolean> {
    if (!this.listener || this.busy) return Promise.resolve(false);
    this.busy = true;
    return new Promise((resolve) => {
      this.listener!({
        kind: 'interstitial',
        resolve: () => {
          this.busy = false;
          resolve(true);
        },
      });
    });
  }
}
