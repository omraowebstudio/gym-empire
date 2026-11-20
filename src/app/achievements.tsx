import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, GRADIENTS, S } from '@/theme';
import { GameButton, GText, Panel, ProgressBar, Screen, ScreenHeader } from '@/components/ui';
import { ACHIEVEMENTS } from '@/game/config/achievements';
import { claimAchievement, metricValue } from '@/game/systems/retention';
import { dispatch, useGame } from '@/store/gameStore';
import { formatCash, formatNumber } from '@/game/utils/format';
import { audio } from '@/services/audio';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  const now = Date.now();
  const unlocked = Object.keys(game.achievements).length;
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const sa = game.achievements[a.id];
    const sb = game.achievements[b.id];
    const rank = (s: typeof sa) => (s && !s.claimed ? 0 : !s ? 1 : 2);
    return rank(sa) - rank(sb);
  });
  return (
    <Screen>
      <ScreenHeader title="Achievements" subtitle={`${unlocked}/${ACHIEVEMENTS.length} unlocked`} />
      <FlatList
        data={sorted}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24, gap: 8, width: '100%', maxWidth: 560, alignSelf: 'center' }}
        ListHeaderComponent={<ProgressBar value={unlocked / ACHIEVEMENTS.length} label={`${unlocked} / ${ACHIEVEMENTS.length}`} height={16} />}
        renderItem={({ item: a }) => {
          const st = game.achievements[a.id];
          const v = Math.min(a.target, metricValue(game, a.metric, now));
          return (
            <Panel colors={st && !st.claimed ? GRADIENTS.gold : st ? GRADIENTS.panelLight : GRADIENTS.panel} padded={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, opacity: st ? 1 : 0.8 }}>
                <Text style={{ fontSize: 32, opacity: st ? 1 : 0.4 }}>{a.icon}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <GText variant="body" color={st && !st.claimed ? '#3A2A00' : '#fff'}>{a.name}</GText>
                  <GText variant="tiny" color={st && !st.claimed ? '#3A2A00' : C.textDim}>{a.description}</GText>
                  {!st ? <ProgressBar value={v / a.target} height={8} label={`${formatNumber(v)} / ${formatNumber(a.target)}`} /> : null}
                  <GText variant="tiny" color={st && !st.claimed ? '#3A2A00' : C.goldLight}>Reward: 💎 {a.gems}{a.cash ? ` · ${formatCash(a.cash)}` : ''}{a.xp ? ` · ${a.xp} XP` : ''}</GText>
                </View>
                {st && !st.claimed ? (
                  <GameButton title="CLAIM" color="green" size="sm" onPress={() => dispatch((d, ctx) => claimAchievement(d, ctx, a.id)).ok && audio.play('achievement')} testID={`claim-ach-${a.id}`} />
                ) : st ? <Text style={{ fontSize: 22 }}>✅</Text> : <Text style={{ fontSize: 18 }}>🔒</Text>}
              </View>
            </Panel>
          );
        }}
      />
    </Screen>
  );
}
