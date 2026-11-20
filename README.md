# GYM EMPIRE

A portrait mobile game that combines a **personal lifter** (train with skill-based mini-games, grow through six physique stages, compete) with a **gym tycoon** (build from a garage gym to a seven-location fitness empire, recruit members, hire staff, earn idle income).

Built with **Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router · Reanimated 4 · react-native-svg · Zustand**.

All lifting stats are fictional game values. The game never asks for real exercise, body measurements or health data.

---

## Run locally

```bash
npm install
npx expo start          # press i (iOS), a (Android) or w (web)
npm test                # 84 automated tests (game logic, saves, monetization)
npx tsc --noEmit        # typecheck
```

Everything in this release runs in **Expo Go**. No custom native modules are required, because ads and purchases use clearly labelled mock providers.

### Test on an iPhone
1. Install **Expo Go** from the App Store.
2. Run `npx expo start` on your computer (same Wi-Fi network as the phone, or use `npx expo start --tunnel`).
3. Scan the QR code with the iPhone Camera app. The game opens in Expo Go.

Once you install the real AdMob or IAP SDKs (see below), Expo Go can no longer run the app. From then on use a development build: `npx eas-cli@latest build --profile development --platform ios`, install it on the device, then `npx expo start --dev-client`.

## Build for the stores (EAS)

```bash
npm i -g eas-cli            # or use npx eas-cli@latest
eas login
eas build:configure         # links the project and fills in the projectId
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios   # or android
```

Before building, set your own identifiers in `app.json`: `ios.bundleIdentifier` and `android.package` are currently `com.gymempire.game`. Build profiles are defined in `eas.json`.

---

## Project structure

```
src/
  app/                 Expo Router screens (5 tabs + 19 stack screens)
  components/          UI kit, overlays, minigames, SVG art (character rig, gym scene, items)
  game/                PURE game logic (no React): fully unit-tested
    config/            economy, exercises, equipment, locations, staff, competitions,
                       missions, rewards/events, items, achievements, products
    systems/           training, gym, offline, retention, competitions, shop, objectives
    engine.ts          transactional action runner (clone → mutate → validate → effects)
  storage/             versioned save manager, migrations, storage adapters
  services/            audio, haptics, monetization (ads, IAP, consent, interstitial policy),
                       leaderboards (local service + shared validation)
  store/               Zustand store: dispatch, effects → toasts/celebrations, autosave
supabase/              schema + edge functions for future online features (not deployed)
scripts/               procedural sound generator, icon generator
__tests__/             Jest test suites
```

**Architecture.** UI components never mutate state. They call `dispatch(fn)`, where `fn` is a pure system action. `act()` runs it on a cloned draft, refreshes daily and weekly systems, checks achievements and auto-unlocks, and returns either the new state with effects or the original state untouched. All prices and rewards live in `src/game/config/*`.

---

## Configuring real advertisements (AdMob)

The game only talks to the `AdService` interface (`src/services/monetization/adService.ts`). In development, `MockAdService` shows a full-screen **TEST MODE · MOCK AD** overlay and grants a reward only when its countdown completes.

To ship real ads:
1. `npx expo install react-native-google-mobile-ads` and add its config plugin to `app.json` with your `androidAppId` and `iosAppId`. Also add `NSUserTrackingUsageDescription` and `SKAdNetworkItems`.
2. Create `AdMobAdService implements AdService`. Use `RewardedAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: !consent.personalized })` and resolve `earned` **only** from the `EARNED_REWARD` event. Use `InterstitialAd` the same way.
3. Run the UMP consent flow (`AdsConsent.gatherConsent()`) and then the iOS ATT prompt (`expo-tracking-transparency`) before requesting ads. Implement it behind `ConsentService` in `consent.ts`.
4. In `src/services/monetization/index.ts`, switch `adService` to the AdMob implementation for production builds. Use Google's test unit IDs until the store review is approved.

The ad rules are already enforced by `interstitialPolicy.ts` (unit-tested):
- no interstitial in the first 4 minutes after launch;
- at least 5 minutes between interstitials, and none within 2 minutes of a rewarded ad;
- only at natural breaks (leaving result screens), at most one in every 4 breaks, and at most 4 per session;
- never during training or competitions;
- never after Remove Ads is purchased.

Rewarded ads are capped at 12 per day (`ECONOMY.ads.maxRewardedPerDay`).

## Configuring in-app purchases

Products are listed in `src/game/config/products.ts`: `remove_ads`, `gems_small`, `gems_medium`, `gems_large`, `bundle_royal` and `theme_royal`.

1. Create matching products in App Store Connect and Google Play Console. Consumables are `gems_*`; the rest are non-consumable.
2. `npx expo install expo-iap` (or `react-native-iap`) and implement `StoreClient` in `purchaseService.ts` (`getProducts`, `purchase`, `finishTransaction`, `restore`).
3. Implement server verification in `supabase/functions/verify-purchase`. It currently **fails closed**: it returns invalid for every receipt until you add Apple App Store Server API and Google Play Developer API verification, and it should record `transaction_id` to block replays.
4. Swap `MockReceiptVerifier` for `RemoteReceiptVerifier(<function URL>, getAuthToken)` in `monetization/index.ts`.

The purchase flow is: store purchase → verifier → product and transaction id must match → grant (deduplicated by transaction id) → `finishTransaction`. Nothing is granted before verification. This is covered by tests in `__tests__/monetization.test.ts`.

## Online leaderboards (future)
- `supabase/migrations/0001_leaderboards.sql` defines the tables with RLS: read-only for clients, writes only through the edge function.
- `supabase/functions/submit-score` validates submissions server-side: value ranges, maximum gain per hour, clock skew, and recomputing strength from evidence. It uses the same rules as the unit-tested `src/services/leaderboard/validation.ts`.
- Implement `SupabaseLeaderboardService implements LeaderboardService` and switch `leaderboardService`.

See `docs/RELEASE_CHECKLIST.md` for store submission steps and `docs/PRIVACY_POLICY.md` for the privacy policy draft.
