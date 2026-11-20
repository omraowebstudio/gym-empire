import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, GRADIENTS, S } from '@/theme';
import { Badge, GameButton, GText, Panel, Screen, ScreenHeader, SectionTitle } from '@/components/ui';
import { PRODUCTS } from '@/game/config/products';
import { ECONOMY } from '@/game/config/economy';
import { applyVerifiedPurchase, adFreeGems, rewardedAdsRemaining } from '@/game/systems/shop';
import { dispatch, useGame, useGameStore } from '@/store/gameStore';
import { purchaseService } from '@/services/monetization';
import { useRewardedAd } from '@/hooks/useAds';
import { audio } from '@/services/audio';

export default function PremiumShop() {
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  const { watch, busy } = useRewardedAd();
  const [pending, setPending] = useState<string | null>(null);

  const buy = async (id: string) => {
    setPending(id);
    try {
      const out = await purchaseService.buy(id, (v) => {
        dispatch((d, ctx) => applyVerifiedPurchase(d, ctx, v));
      });
      if (out.status === 'verified') {
        audio.play('achievement');
        useGameStore.getState().pushToast({ kind: 'item', title: 'Purchase complete', subtitle: 'Thank you for supporting Gym Empire!', icon: '🎉' });
      } else if (out.status === 'failed') {
        useGameStore.getState().pushToast({ kind: 'error', title: 'Purchase not completed', subtitle: out.reason, icon: '⚠️' });
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Premium Shop" subtitle="Everything here is optional" />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: S.sm }}>
          {purchaseService.isTestMode ? (
            <View style={styles.test}><Text style={styles.testText}>TEST MODE · purchases are simulated and never charge money</Text></View>
          ) : null}

          <Panel colors={GRADIENTS.purple}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 36 }}>📺</Text>
              <View style={{ flex: 1 }}>
                <GText variant="h2">Free gems</GText>
                <GText variant="small" color="rgba(255,255,255,0.85)">Watch an optional ad for 3 gems. {rewardedAdsRemaining(game, Date.now())}/{ECONOMY.ads.maxRewardedPerDay} ad bonuses left today.</GText>
              </View>
              <GameButton title="+3 💎" color="gold" size="sm" disabled={busy} onPress={() => watch('free_gems', (d, ctx) => adFreeGems(d, ctx))} />
            </View>
          </Panel>

          <SectionTitle>Offers</SectionTitle>
          {PRODUCTS.map((p) => {
            const owned = p.kind === 'non_consumable' && game.monetization.entitlements.includes(p.id);
            return (
              <Panel key={p.id} padded={false}>
                <View style={styles.row}>
                  <Text style={{ fontSize: 36 }}>{p.removeAds ? '🚫' : p.items?.length ? '👑' : '💎'}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <GText variant="body">{p.name}</GText>
                      {p.badge ? <Badge text={p.badge} color={C.gold} textColor="#3A2A00" /> : null}
                    </View>
                    <GText variant="tiny" color={C.textDim}>{p.description}</GText>
                  </View>
                  <GameButton title={owned ? 'OWNED' : p.displayPrice} color={owned ? 'gray' : 'green'} size="sm" disabled={owned || pending !== null} onPress={() => buy(p.id)} testID={`buy-product-${p.id}`} />
                </View>
              </Panel>
            );
          })}

          <SectionTitle>Spend gems</SectionTitle>
          <Panel>
            <GText variant="small" color={C.textDim}>Gems buy cosmetics, decorations and themes in the Collection, plus conveniences: energy refills ({ECONOMY.energy.refillGemCost}💎), 1h income boosts ({ECONOMY.boosts.gemBoostCost}💎) and doubled offline earnings (10💎).</GText>
            <GameButton title="Browse cosmetics" color="blue" size="sm" style={{ marginTop: 10 }} onPress={() => router.navigate('/collect')} />
          </Panel>
          <GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center', marginTop: 8 }}>Items are granted only after the store purchase is verified. Progress never requires purchases or ads.</GText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  test: { backgroundColor: C.gold, borderRadius: 10, padding: 8 },
  testText: { fontFamily: FONT.heavy, fontSize: 11, color: '#3A2A00', textAlign: 'center' },
});
