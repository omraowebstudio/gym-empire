import React from 'react';
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C, GRADIENTS, S } from '@/theme';
import { GameButton, GText, Panel, ProgressBar, Screen, ScreenHeader } from '@/components/ui';
import { MISSION_MAP } from '@/game/config/missions';
import { ECONOMY } from '@/game/config/economy';
import { claimMission, claimMissionBonus, missionBonusAvailable } from '@/game/systems/retention';
import { dispatch, useGame, useGameStore } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { useRewardedAd } from '@/hooks/useAds';
import { formatCash, formatDuration, formatNumber } from '@/game/utils/format';
import { msUntilNextDay } from '@/game/utils/time';
import { audio } from '@/services/audio';

export default function MissionsScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const game = useGame((g) => g);
  const { watch, busy } = useRewardedAd();
  const missions = game.missions.missions;
  const done = missions.filter((m) => m.claimed).length;
  const celebrate = (cash: number) => {
    audio.play('coin');
    useGameStore.getState().triggerCoinBurst(cash);
  };
  return (
    <Screen>
      <ScreenHeader title="Daily Missions" subtitle={`New missions in ${formatDuration(msUntilNextDay(now))}`} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24, gap: S.md }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: S.md }}>
          {missions.map((m, i) => {
            const def = MISSION_MAP[m.defId];
            const complete = m.progress >= m.target;
            return (
              <Animated.View key={m.id} entering={FadeInDown.delay(i * 60)}>
                <Panel colors={m.claimed ? GRADIENTS.panel : complete ? ['#1F6B45', '#14402B'] : undefined}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 30 }}>{m.claimed ? '✅' : def.icon}</Text>
                    <View style={{ flex: 1, gap: 4 }}>
                      <GText variant="body">{def.title.replace('{n}', formatNumber(m.target))}</GText>
                      <ProgressBar value={m.progress / m.target} color={complete ? C.green : C.blue} label={`${formatNumber(m.progress)} / ${formatNumber(m.target)}`} />
                      <GText variant="tiny" color={C.goldLight}>💵 {formatCash(m.rewardCash)} · ⭐ {m.rewardXp} XP{m.rewardGems ? ` · 💎 ${m.rewardGems}` : ''}{m.adDoubled ? ' · DOUBLED' : ''}</GText>
                    </View>
                  </View>
                  {complete && !m.claimed ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <GameButton title="CLAIM" color="green" size="sm" style={{ flex: 1 }} onPress={() => dispatch((d, ctx) => claimMission(d, ctx, m.id)).ok && celebrate(m.rewardCash)} testID={`claim-mission-${i}`} />
                      <GameButton title="CLAIM ×2" subtitle="Watch optional ad" color="purple" size="sm" style={{ flex: 1 }} disabled={busy} onPress={() => watch('mission_double', (d, ctx) => claimMission(d, ctx, m.id, true)).then((ok) => ok && celebrate(m.rewardCash * 2))} />
                    </View>
                  ) : null}
                </Panel>
              </Animated.View>
            );
          })}
          <Panel colors={missionBonusAvailable(game) ? GRADIENTS.gold : GRADIENTS.panelLight}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 40 }}>{game.missions.bonusClaimed ? '📭' : '🎁'}</Text>
              <View style={{ flex: 1 }}>
                <GText variant="h2" color={missionBonusAvailable(game) ? '#3A2A00' : '#fff'}>Daily Chest</GText>
                <GText variant="small" color={missionBonusAvailable(game) ? '#3A2A00' : C.textDim}>Claim all missions ({done}/{missions.length}) for 💎 {ECONOMY.missions.bonusGems} + cash</GText>
              </View>
            </View>
            <GameButton title={game.missions.bonusClaimed ? 'CLAIMED' : 'OPEN CHEST'} color="green" style={{ marginTop: 10 }} disabled={!missionBonusAvailable(game)} onPress={() => dispatch((d, ctx) => claimMissionBonus(d, ctx)).ok && audio.play('achievement')} testID="claim-chest" />
          </Panel>
          <GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center' }}>Mission progress is saved and never resets until the next day.</GText>
        </View>
      </ScrollView>
    </Screen>
  );
}


