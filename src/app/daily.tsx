import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, GRADIENTS, R, S } from '@/theme';
import { GameButton, GText, Panel, Screen, ScreenHeader } from '@/components/ui';
import { ItemIcon } from '@/components/art/Items';
import { DAILY_REWARDS } from '@/game/config/rewards';
import { canClaimDaily, canClaimDailyAdBonus, claimDaily, claimDailyAdBonus } from '@/game/systems/retention';
import { resolveReward } from '@/game/systems/core';
import { dispatch, useGame, useGameStore } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { useRewardedAd } from '@/hooks/useAds';
import { formatCash, formatDuration } from '@/game/utils/format';
import { msUntilNextDay } from '@/game/utils/time';
import { audio } from '@/services/audio';

export default function DailyScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const game = useGame((g) => g);
  const { watch, busy } = useRewardedAd();
  const d = game.dailyReward;
  const can = canClaimDaily(game, now);
  const todayIdx = can ? d.nextDay : (d.nextDay + 6) % 7;

  return (
    <Screen>
      <ScreenHeader title="Daily Rewards" subtitle={`Cycle ${d.cycle + 1} · ${d.totalClaims} rewards claimed`} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: S.md }}>
          <View style={styles.grid}>
            {DAILY_REWARDS.map((day, i) => {
              const r = resolveReward(game, day.reward);
              const claimed = i < d.nextDay || (!can && i === todayIdx);
              const isToday = i === todayIdx;
              const big = i === 6;
              return (
                <View key={day.day} style={[styles.cell, big && styles.bigCell]}>
                  <LinearGradient colors={claimed ? GRADIENTS.gray : isToday ? GRADIENTS.gold : GRADIENTS.panelLight} style={[styles.cellInner, isToday && can && { borderColor: '#fff' }]}>
                    <Text style={[styles.dayText, { color: isToday && can ? '#3A2A00' : '#fff' }]}>DAY {day.day}</Text>
                    {day.reward.itemId ? <ItemIcon itemId={day.reward.itemId} size={big ? 64 : 46} /> : <Text style={{ fontSize: big ? 44 : 32 }}>{day.reward.gems ? '💎' : day.reward.xp ? '⭐' : '💵'}</Text>}
                    <Text style={[styles.amt, { color: isToday && can ? '#3A2A00' : C.goldLight }]} numberOfLines={2}>
                      {[r.cash ? formatCash(r.cash) : null, r.xp ? `${r.xp} XP` : null, r.gems ? `${r.gems}💎` : null, r.itemId ? 'ITEM' : r.duplicate ? 'gems (dupe)' : null, day.reward.energy ? `+${day.reward.energy}⚡` : null].filter(Boolean).join(' + ')}
                    </Text>
                    {claimed ? <View style={styles.check}><Text style={{ fontSize: 26 }}>✅</Text></View> : null}
                  </LinearGradient>
                </View>
              );
            })}
          </View>
          {can ? (
            <Animated.View entering={ZoomIn}>
              <GameButton title={`CLAIM DAY ${DAILY_REWARDS[d.nextDay].day}`} color="gold" size="lg" onPress={() => {
                const r = dispatch((dd, ctx) => claimDaily(dd, ctx));
                if (r.ok) {
                  audio.play('achievement');
                  const rw = r.effects.find((e) => e.type === 'reward');
                  if (rw && rw.type === 'reward' && rw.cash) useGameStore.getState().triggerCoinBurst(rw.cash);
                }
              }} testID="claim-daily" />
            </Animated.View>
          ) : (
            <Panel>
              <GText variant="body" style={{ textAlign: 'center' }}>Come back in {formatDuration(msUntilNextDay(now))} for your next reward!</GText>
              <GameButton title="Bonus reward" subtitle="Watch optional ad" icon="📺" color="purple" size="sm" style={{ marginTop: 10 }} disabled={busy || !canClaimDailyAdBonus(game, now)} onPress={() => watch('daily_bonus', (dd, ctx) => claimDailyAdBonus(dd, ctx)).then((ok) => ok && audio.play('coin'))} />
            </Panel>
          )}
          <GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center' }}>Missed a day? No problem. Your calendar never resets; you simply continue where you left off.</GText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { width: '30%', aspectRatio: 0.85 },
  bigCell: { width: '62%', aspectRatio: 1.8 },
  cellInner: { flex: 1, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', padding: 6, borderWidth: 3, borderColor: 'rgba(255,255,255,0.12)' },
  dayText: { fontFamily: FONT.display, fontSize: 13 },
  amt: { fontFamily: FONT.heavy, fontSize: 10, textAlign: 'center' },
  check: { position: 'absolute', top: 4, right: 4 },
});
