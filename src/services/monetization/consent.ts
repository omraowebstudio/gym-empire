// Privacy & consent abstraction. In production builds this wraps Google's UMP SDK
// (bundled with react-native-google-mobile-ads) and iOS App Tracking Transparency.
export interface ConsentStatus {
  canRequestAds: boolean;
  personalized: boolean;
}

export interface ConsentService {
  /** Shows the platform consent form if required (GDPR/UK/CPRA regions). */
  gatherConsent(): Promise<ConsentStatus>;
}

/** Development consent service: uses the in-game privacy choice stored in settings. */
export class LocalConsentService implements ConsentService {
  constructor(private getPersonalized: () => boolean) {}
  async gatherConsent(): Promise<ConsentStatus> {
    return { canRequestAds: true, personalized: this.getPersonalized() };
  }
}
