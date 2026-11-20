import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, R, S } from '@/theme';
import { GText, Panel, Screen, ScreenHeader } from '@/components/ui';
import { Avatar } from '@/components/art/Character';
import { CATEGORY_INFO, leaderboardService, type LeaderboardEntry } from '@/services/leaderboard/leaderboardService';
import type { LeaderboardCategory } from '@/services/leaderboard/validation';
import { useGameStore } from '@/store/gameStore';
import { formatNumber } from '@/game/utils/format';

const CATS: LeaderboardCategory[] = ['level', 'gym', 'members', 'strength', 'achievements', 'weekly'];

export default function LeaderboardsScreen() {
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState<LeaderboardCategory>('level');
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    let alive = true;
    leaderboardService.getBoard(cat, useGameStore.getState().game, Date.now()).then((r) => alive && setRows(r));
    return () => { alive = false; };
  }, [cat]);
  const me = rows.find((r) => r.isPlayer);
  const info = CATEGORY_INFO[cat];
  return (
    <Screen>
      <ScreenHeader title="Leaderboards" subtitle={leaderboardService.isOnline ? 'Global' : 'Local rivals · online boards coming soon'} />
      <View style={{ paddingHorizontal: S.lg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
          {CATS.map((c) => (
            <Pressable key={c} onPress={() => setCat(c)} accessibilityLabel={CATEGORY_INFO[c].label}>
              <View style={[styles.chip, cat === c && { backgroundColor: C.blue, borderColor: C.blueLight }]}>
                <Text style={styles.chipText}>{CATEGORY_INFO[c].icon} {CATEGORY_INFO[c].label}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        {me ? (
          <Panel style={{ marginBottom: 8 }}>
            <GText variant="body" style={{ textAlign: 'center' }}>Your rank: <Text style={{ color: C.goldLight }}>#{me.rank}</Text> of {rows.length} · {formatNumber(me.value)} {info.unit}</GText>
          </Panel>
        ) : null}
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => `${r.rank}-${r.name}`}
        contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: insets.bottom + 24, gap: 6, width: '100%', maxWidth: 560, alignSelf: 'center' }}
        renderItem={({ item }) => (
          <View style={[styles.row, item.isPlayer && styles.me]}>
            <Text style={[styles.rank, { color: item.rank <= 3 ? C.goldLight : '#fff' }]}>{item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}</Text>
            {item.isPlayer ? <View style={styles.youDot}><Text style={{ fontSize: 22 }}>⭐</Text></View> : <Avatar seed={item.seed} size={38} />}
            <View style={{ flex: 1 }}>
              <GText variant="small" numberOfLines={1}>{item.country} {item.name}</GText>
              <GText variant="tiny" color={C.textDim} numberOfLines={1}>{item.subtitle}</GText>
            </View>
            <GText variant="number" style={{ fontSize: 16 }}>{formatNumber(item.value)}</GText>
          </View>
        )}
        ListFooterComponent={<GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center', marginTop: 8 }}>Rivals are AI lifters with fixed scores. Online leaderboards will use server-validated submissions.</GText>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, backgroundColor: C.panel, borderWidth: 2, borderColor: C.panelBorder },
  chipText: { fontFamily: FONT.display, color: '#fff', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.panel, borderRadius: R.md, padding: 8, borderWidth: 2, borderColor: C.panelBorder },
  me: { backgroundColor: C.blueDark, borderColor: C.gold },
  rank: { fontFamily: FONT.display, fontSize: 16, width: 40, textAlign: 'center' },
  youDot: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
});
