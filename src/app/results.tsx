import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, GRADIENTS, S, TEXT_SHADOW } from '@/theme';
import { Badge, GameButton, GText, Panel, Screen, ScreenHeader } from '@/components/ui';
import { ItemIcon } from '@/components/art/Items';
import { Confetti } from '@/components/overlays';
import { COMPETITION_TIERS, COMPETITION_TYPE_MAP, ROUND_NAMES } from '@/game/config/competitions';
import { PLAYER_ID } from '@/game/systems/competitions';
import { useGame } from '@/store/gameStore';
import { formatCash, formatNumber } from '@/game/utils/format';
import { naturalBreak } from '@/hooks/useAds';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const history = useGame((g) => g.competition.history);
  const reduced = useGame((g) => g.settings.reducedMotion);
  const name = useGame((g) => g.profile.name);
  const res = history.find((h) => h.id === id) ?? history[0];
  const isFresh = res && Date.now() - res.at < 15000;

  useEffect(() => () => {
    naturalBreak();
  }, []);

  if (!res) {
    return (
      <Screen>
        <ScreenHeader title="Results" />
        <GText style={{ textAlign: 'center' }}>No results yet.</GText>
      </Screen>
    );
  }
  const type = COMPETITION_TYPE_MAP[res.type];
  const tier = COMPETITION_TIERS[res.tier];
  const medal = res.place === 1 ? '🥇' : res.place === 2 ? '🥈' : res.place === 3 ? '🥉' : '🎗️';
  const placeText = res.place === 1 ? 'CHAMPION!' : res.place === 2 ? '2ND PLACE' : res.place === 3 ? 'SEMI-FINALIST' : 'QUARTER-FINALIST';
  const nameOf = (pid: string) => (pid === PLAYER_ID ? name : res.opponents.find((o) => o.id === pid)?.name ?? pid);

  return (
    <Screen>
      <ScreenHeader title="Competition Results" subtitle={`${tier.name} · ${type.name}`} onBack={() => router.navigate('/compete')} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24, gap: S.md, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 520, gap: S.md }}>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 96 }}>{medal}</Text>
            <Text style={[styles.place, { color: res.place === 1 ? C.goldLight : '#fff' }]}>{placeText}</Text>
            {res.newRecord ? <Badge text="NEW PERSONAL RECORD!" color={C.green} textColor="#063D1F" /> : null}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150)}>
            <Panel colors={GRADIENTS.hero}>
              <GText variant="tiny" color={C.goldLight} style={{ textAlign: 'center' }}>REWARDS</GText>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 }}>
                <Reward icon="💵" value={formatCash(res.rewardCash)} />
                <Reward icon="⭐" value={`${res.rewardXp} XP`} />
                {res.rewardGems ? <Reward icon="💎" value={`${res.rewardGems}`} /> : null}
              </View>
              {res.trophyId ? (
                <View style={{ alignItems: 'center', marginTop: 10, gap: 4 }}>
                  <ItemIcon itemId={res.trophyId} size={84} />
                  <GText variant="small" color={C.goldLight}>New trophy added to your collection!</GText>
                </View>
              ) : null}
              <GText variant="small" color={C.textDim} style={{ textAlign: 'center', marginTop: 8 }}>Best lift: {formatNumber(res.playerBest)} PWR</GText>
            </Panel>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <Panel padded={false}>
              {[0, 1, 2].map((round) => {
                const ms = res.matches.filter((m) => m.round === round);
                if (!ms.length) return null;
                return (
                  <View key={round} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <GText variant="tiny" color={C.goldLight}>{ROUND_NAMES[round].toUpperCase()}</GText>
                    {ms.map((m, i) => {
                      const involves = m.a === PLAYER_ID || m.b === PLAYER_ID;
                      return (
                        <View key={i} style={[styles.matchRow, involves && { backgroundColor: 'rgba(47,123,255,0.18)' }]}>
                          <GText variant="small" numberOfLines={1} style={{ flex: 1, color: m.winner === m.a ? '#fff' : C.textMuted }}>{nameOf(m.a)} {m.winner === m.a ? '✓' : ''}</GText>
                          <GText variant="tiny" color={C.textDim}>{formatNumber(m.aLift)} – {formatNumber(m.bLift)}</GText>
                          <GText variant="small" numberOfLines={1} style={{ flex: 1, textAlign: 'right', color: m.winner === m.b ? '#fff' : C.textMuted }}>{m.winner === m.b ? '✓ ' : ''}{nameOf(m.b)}</GText>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </Panel>
          </Animated.View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <GameButton title="Train" icon="💪" color="purple" style={{ flex: 1 }} onPress={() => router.navigate('/train')} />
            <GameButton title="Continue" color="green" style={{ flex: 1 }} onPress={() => router.navigate('/compete')} testID="results-continue" />
          </View>
        </View>
      </ScrollView>
      {isFresh && res.place === 1 && !reduced ? <Confetti count={50} /> : null}
    </Screen>
  );
}

function Reward({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <GText variant="number">{value}</GText>
    </View>
  );
}

const styles = StyleSheet.create({
  place: { fontFamily: FONT.display, fontSize: 40, ...TEXT_SHADOW },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8 },
});
