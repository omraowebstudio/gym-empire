# Store Submission Checklist

## Before the first build
- [ ] Replace `com.gymempire.game` in `app.json` (iOS bundle identifier and Android package) with your own identifier.
- [ ] `eas build:configure` (adds the EAS projectId).
- [ ] Replace the mock ad and store providers (see README). Use AdMob test unit IDs until launch.
- [ ] Implement and deploy `verify-purchase` (it currently fails closed).
- [ ] Host `docs/PRIVACY_POLICY.md` at a public URL; add the URL to both stores and to the Settings screen.
- [ ] Add `NSUserTrackingUsageDescription` (if using ATT) and the AdMob `SKAdNetworkItems` to iOS config.

## App metadata (draft)
- **Name:** Gym Empire
- **Subtitle:** Lift. Build. Dominate.
- **Category:** Games › Simulation (secondary: Casual)
- **Age rating:** 4+ / Everyone. No violence, no gambling mechanics; optional ads and IAP.
- **Short description:** Train your lifter, build your gym empire, and become a legend.
- **Description:** Start in a cramped garage gym and grow a worldwide fitness empire. Train your cartoon lifter with timing, power and tempo mini-games, watch them grow through six physique stages, buy and upgrade equipment, recruit members, hire trainers and managers, and earn money even while you're away. Compete in bench, squat and deadlift meets, win trophies, complete daily missions and weekly events, and collect over 90 cosmetics. All stats are fictional; no real exercise required.
- **Keywords:** gym, tycoon, idle, lifting, fitness, simulator, bodybuilding, manager
- **Screenshots:** 6.9" and 6.5" iPhone, plus Android phone. Capture Home, Training, Gym, Compete, Collection and Results.

## Privacy declarations
- Data collected (with AdMob): device identifiers for advertising (only when consented), and coarse diagnostics. No health, fitness or contact data.
- Google Play Data Safety and App Store privacy nutrition labels must match the final SDKs.
- Ads: declare "Contains ads". IAP: declare in-app purchases.

## QA pass
- [ ] Fresh install → onboarding → home.
- [ ] Kill the app for 30+ min → offline earnings modal shows the correct amount once.
- [ ] Change device date forward and back → no double rewards (missions and daily refresh only on a new date).
- [ ] Every tab and every stack screen opens; back navigation works.
- [ ] Remove Ads purchase → no interstitials; restore works after reinstall.
- [ ] Small (iPhone SE) and large (Pro Max) screens; Android with gesture navigation.
- [ ] `npm test` and `npx tsc --noEmit` both pass.
