import React, { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { C, S } from '@/theme';
import { GameButton, GText, Panel, Screen, ScreenHeader, SectionTitle, Sheet } from '@/components/ui';
import { dispatch, useGame, useGameStore } from '@/store/gameStore';
import { purchaseService, adService } from '@/services/monetization';
import { restoreEntitlements } from '@/game/systems/shop';
import type { Settings } from '@/game/types';

const TOGGLES: { key: keyof Settings; label: string; hint: string }[] = [
  { key: 'sound', label: 'Sound effects', hint: 'Clicks, coins, lifts and fanfares' },
  { key: 'music', label: 'Music', hint: 'Background gym soundtrack' },
  { key: 'haptics', label: 'Haptics', hint: 'Vibration feedback on supported phones' },
  { key: 'reducedMotion', label: 'Reduced motion', hint: 'Turns off confetti, bobbing and idle animations' },
  { key: 'personalizedAds', label: 'Personalized ads', hint: 'Off = only non-personalized ads are requested' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useGame((g) => g.settings);
  const loadError = useGameStore((s) => s.loadError);
  const [confirm, setConfirm] = useState(0);
  const [privacy, setPrivacy] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const toggle = (key: keyof Settings, v: boolean) => { dispatch((d) => { (d.settings as unknown as Record<string, boolean>)[key] = v; }, { silent: true }); };

  const restore = async () => {
    setRestoring(true);
    try {
      const ids = await purchaseService.restore();
      dispatch((d, ctx) => restoreEntitlements(d, ctx, ids));
      useGameStore.getState().pushToast({ kind: 'info', title: ids.length ? `Restored ${ids.length} purchase(s)` : 'No purchases to restore', icon: '🧾' });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Settings" right={<View />} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: S.sm }}>
          <Panel>
            {TOGGLES.map((t) => (
              <View key={t.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ flex: 1 }}>
                  <GText variant="body">{t.label}</GText>
                  <GText variant="tiny" color={C.textDim}>{t.hint}</GText>
                </View>
                <Switch value={!!settings[t.key]} onValueChange={(v) => toggle(t.key, v)} accessibilityLabel={t.label} testID={`toggle-${t.key}`} />
              </View>
            ))}
          </Panel>

          <SectionTitle>Account & purchases</SectionTitle>
          <Panel>
            <GText variant="small" color={C.textDim}>Ads: {adService.name}{adService.isTestMode ? ' (no real ads are shown)' : ''}</GText>
            <GText variant="small" color={C.textDim}>Store: {purchaseService.isTestMode ? 'Test store (no real charges)' : 'Live store'}</GText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <GameButton title="Restore purchases" color="blue" size="sm" style={{ flex: 1 }} disabled={restoring} onPress={restore} />
              <GameButton title="Privacy" color="gray" size="sm" style={{ flex: 1 }} onPress={() => setPrivacy(true)} />
            </View>
            <GameButton title="Edit name & look" color="purple" size="sm" style={{ marginTop: 8 }} onPress={() => router.push('/customize')} />
          </Panel>

          <SectionTitle>Danger zone</SectionTitle>
          <Panel>
            <GText variant="small" color={C.textDim}>
              {loadError ? 'Your previous save could not be read. Starting fresh will replace it.' : 'Erase all progress on this device. This cannot be undone.'}
            </GText>
            <GameButton title={confirm === 0 ? 'Reset progress' : 'Tap again to confirm'} color="red" size="sm" style={{ marginTop: 10 }} onPress={async () => {
              if (confirm === 0) { setConfirm(1); return; }
              await useGameStore.getState().resetGame();
              router.replace('/welcome');
            }} testID="reset-progress" />
          </Panel>

          <GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center', marginTop: 10 }}>
            Gym Empire v{Constants.expoConfig?.version ?? '1.0.0'} · All characters, stats and competitions are fictional. Not fitness or medical advice.
          </GText>
        </View>
      </ScrollView>
      <Sheet visible={privacy} onClose={() => setPrivacy(false)} title="Privacy summary">
        <ScrollView style={{ maxHeight: 420 }}>
          <GText variant="small" color={C.textDim}>
            {'• Your game progress is stored only on this device.\n\n• Gym Empire does not ask for your real name, body measurements or health data. All stats are fictional.\n\n• In production builds, ads are served by Google AdMob. With "Personalized ads" off, only non-personalized ads are requested. In the EEA/UK a consent form is shown, and on iOS the App Tracking Transparency prompt is respected.\n\n• Purchases are processed by Apple or Google; we receive only a receipt to verify the purchase.\n\n• Online leaderboards (when enabled) will store your lifter name and game scores.\n\nThe full privacy policy is in docs/PRIVACY_POLICY.md and must be hosted at a public URL before store submission.'}
          </GText>
        </ScrollView>
      </Sheet>
    </Screen>
  );
}
