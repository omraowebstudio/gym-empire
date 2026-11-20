import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S } from '@/theme';
import { GText, Panel, ProgressBar, Screen, ScreenHeader, SectionTitle } from '@/components/ui';
import { LEVEL_UNLOCKS } from '@/game/config/rewards';
import { PHYSIQUE_STAGES } from '@/game/config/exercises';
import { ITEMS } from '@/game/config/items';
import { xpForLevel } from '@/game/config/economy';
import { overallStrength } from '@/game/systems/stats';
import { useGame } from '@/store/gameStore';

export default function RoadmapScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  const strength = overallStrength(game);
  const levelItems = ITEMS.filter((i) => i.unlock.kind === 'level');
  return (
    <Screen>
      <ScreenHeader title="Progression Roadmap" subtitle={`Level ${game.level} · ${strength} strength`} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: S.sm }}>
          <Panel>
            <GText variant="small">Level {game.level} → {game.level + 1}</GText>
            <ProgressBar value={game.xp / xpForLevel(game.level)} label={`${game.xp} / ${xpForLevel(game.level)} XP`} />
          </Panel>
          <SectionTitle>Level unlocks</SectionTitle>
          {LEVEL_UNLOCKS.map((u) => {
            const done = game.level >= u.level;
            const items = levelItems.filter((i) => i.unlock.kind === 'level' && i.unlock.level === u.level);
            return (
              <Panel key={u.level} padded={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, opacity: done ? 0.65 : 1 }}>
                  <Text style={{ fontSize: 26 }}>{done ? '✅' : u.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <GText variant="body">Level {u.level}</GText>
                    <GText variant="tiny" color={C.textDim}>{u.label}{items.length ? ` · ${items.map((i) => i.name).join(', ')}` : ''}</GText>
                  </View>
                </View>
              </Panel>
            );
          })}
          <SectionTitle>Physique stages</SectionTitle>
          {PHYSIQUE_STAGES.map((p, i) => (
            <Panel key={p.name} padded={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
                <Text style={{ fontSize: 24 }}>{strength >= p.minStrength ? '💪' : '🔒'}</Text>
                <GText variant="body" style={{ flex: 1 }}>{i + 1}. {p.name}</GText>
                <GText variant="tiny" color={C.goldLight}>{p.minStrength} STR</GText>
              </View>
            </Panel>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
