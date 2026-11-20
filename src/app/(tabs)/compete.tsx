import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, GRADIENTS, R, S } from '@/theme';
import { CurrencyBar, GameButton, GText, Panel, Screen, SectionTitle } from '@/components/ui';
import { ItemIcon } from '@/components/art/Items';
import { COMPETITION_TIERS, COMPETITION_TYPES, COMPETITION_TYPE_MAP } from '@/game/config/competitions';
import { ECONOMY } from '@/game/config/economy';
import { trophyId } from '@/game/config/items';
import { highestUnlockedTier, opponentBasePower, playerCompetitionPower, startCompetition } from '@/game/systems/competitions';
import { currentEnergy } from '@/game/systems/core';
import { baseIncomePerMin } from '@/game/systems/gym';
import { dispatch, useGame } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { formatCash, formatDuration, formatNumber } from '@/game/utils/format';
import { msUntilNextWeek } from '@/game/utils/time';
import { audio } from '@/services/audio';
import type { CompetitionType } from '@/game/types';

function oddsLabel(ratio: number): { text: string; color: string } {
  if (ratio >= 1.12) return { text: 'FAVORITE', color: C.green };
  if (ratio >= 0.97) return { text: 'EVEN MATCH', color: C.gold };
  if (ratio >= 0.85) return { text: 'UNDERDOG', color: C.orange };
  return { text: 'LONG SHOT', color: C.red };
}

export default function CompeteScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const game = useGame((g) => g);
  const maxTier = highestUnlockedTier(game);
  const [tier, setTier] = useState(maxTier);
  const energy = currentEnergy(game, now);
  const active = game.competition.active;

  const enter = (type: CompetitionType, t: number) => {
    const r = dispatch((d, ctx) => startCompetition(d, ctx, type, t));
    if (r.ok) {
      audio.play('cheer');
      router.push('/competition');
    }
  };

  const weeklyPower = playerCompetitionPower(game, 'weekly');
  const weeklyOpp = opponentBasePower('weekly', maxTier);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: S.lg, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={styles.top}>
            <GText variant="title">Compete</GText>
            <CurrencyBar />
          </View>

          {active ? (
            <Pressable onPress={() => router.push('/competition')}>
              <Panel colors={GRADIENTS.green} style={{ marginBottom: S.md }}>
                <GText variant="h2" color="#063D1F">▶ Resume {COMPETITION_TYPE_MAP[active.type].name}</GText>
                <GText variant="small" color="#063D1F">You are in the middle of a competition.</GText>
              </Panel>
            </Pressable>
          ) : null}

          {/* Weekly championship */}
          <LinearGradient colors={['#00C2A8', '#0B4F47']} style={styles.weekly}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 44 }}>👑</Text>
              <View style={{ flex: 1 }}>
                <GText variant="tiny" color={C.goldLight}>FREE · ONCE PER WEEK · RESETS IN {formatDuration(msUntilNextWeek(now))}</GText>
                <GText variant="h2">Weekly Gym Championship</GText>
                <GText variant="small" color="rgba(255,255,255,0.85)">{COMPETITION_TIERS[maxTier].name} tier · Strength + gym reputation · ×2 rewards</GText>
              </View>
            </View>
            <View style={styles.powerRow}>
              <GText variant="small">Your power: <Text style={{ color: C.goldLight }}>{formatNumber(weeklyPower)}</Text></GText>
              <GText variant="small">Field: ~{formatNumber(weeklyOpp * 0.8)}–{formatNumber(weeklyOpp * 1.15)}</GText>
            </View>
            <GameButton
              title={game.competition.weeklyChampionshipDone ? 'COMPLETED THIS WEEK' : 'ENTER FREE'}
              color={game.competition.weeklyChampionshipDone ? 'gray' : 'gold'}
              disabled={game.competition.weeklyChampionshipDone || !!active}
              onPress={() => enter('weekly', maxTier)}
              testID="enter-weekly"
            />
          </LinearGradient>

          {/* Tier selector */}
          <SectionTitle right={<GText variant="tiny" color={C.textDim}>⚡ {energy} · entry costs {ECONOMY.energy.competitionCost}</GText>}>Competitions</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {COMPETITION_TIERS.map((t) => {
              const locked = game.level < t.unlockLevel;
              const sel = t.tier === tier;
              return (
                <Pressable key={t.tier} disabled={locked} onPress={() => setTier(t.tier)} accessibilityLabel={t.name} testID={`tier-${t.tier}`}>
                  <View style={[styles.tierChip, { borderColor: t.color }, sel && { backgroundColor: t.color }]}>
                    <Text style={[styles.tierText, { color: sel ? '#111' : locked ? C.textMuted : '#fff' }]}>{locked ? `🔒 Lv ${t.unlockLevel}` : t.name}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ gap: S.md }}>
            {COMPETITION_TYPES.filter((c) => !c.weekly).map((c) => {
              const mine = playerCompetitionPower(game, c.type);
              const opp = opponentBasePower(c.type, tier);
              const odds = oddsLabel(mine / opp);
              const tDef = COMPETITION_TIERS[tier];
              const trophy = trophyId(c.type, tier);
              const hasTrophy = game.inventory[trophy] !== undefined;
              const rewardCash = Math.max(tDef.cash, baseIncomePerMin(game) * 10);
              return (
                <Panel key={c.type} padded={false}>
                  <LinearGradient colors={[c.color + '55', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.compCard}>
                    <View style={{ alignItems: 'center', width: 64 }}>
                      <ItemIcon itemId={trophy} size={56} locked={!hasTrophy} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <GText variant="h2" style={{ fontSize: 17 }}>{c.icon} {c.name}</GText>
                      <GText variant="tiny" color={C.textDim}>YOU {formatNumber(mine)} vs FIELD ~{formatNumber(opp * 0.85)}–{formatNumber(opp * 1.15)}</GText>
                      <GText variant="tiny" color={odds.color}>{odds.text}</GText>
                      <GText variant="tiny" color={C.goldLight}>🥇 {formatCash(rewardCash)} · {tDef.xp} XP{hasTrophy ? '' : ` · first win: trophy + ${tDef.firstWinGems}💎`}</GText>
                    </View>
                    <GameButton
                      title="ENTER"
                      subtitle={`⚡${ECONOMY.energy.competitionCost}`}
                      color="blue"
                      size="sm"
                      disabled={!!active || energy < ECONOMY.energy.competitionCost}
                      onPress={() => enter(c.type, tier)}
                      testID={`enter-${c.type}`}
                    />
                  </LinearGradient>
                </Panel>
              );
            })}
          </View>

          <SectionTitle>Personal Records</SectionTitle>
          <View style={styles.records}>
            {COMPETITION_TYPES.map((c) => (
              <View key={c.type} style={styles.record}>
                <Text style={{ fontSize: 20 }}>{c.icon}</Text>
                <Text style={styles.recordValue}>{game.competition.records[c.type] ? formatNumber(game.competition.records[c.type]) : '—'}</Text>
                <GText variant="tiny" color={C.textDim} style={{ fontSize: 9 }}>{c.type.toUpperCase()}</GText>
              </View>
            ))}
          </View>

          <SectionTitle right={<Pressable onPress={() => router.push('/leaderboards')}><GText variant="tiny" color={C.blueLight}>LEADERBOARDS ›</GText></Pressable>}>History</SectionTitle>
          <GText variant="tiny" color={C.textDim} style={{ marginBottom: 6 }}>League points this week: {game.competition.leaguePoints}</GText>
          {game.competition.history.length === 0 ? (
            <Panel><GText variant="small" color={C.textDim}>No competitions yet. Enter a Local Meet to get started!</GText></Panel>
          ) : (
            <Panel padded={false}>
              {game.competition.history.slice(0, 10).map((h) => (
                <Pressable key={h.id} onPress={() => router.push({ pathname: '/results', params: { id: h.id } })} style={styles.histRow}>
                  <Text style={{ fontSize: 22 }}>{h.place === 1 ? '🥇' : h.place === 2 ? '🥈' : h.place === 3 ? '🥉' : '🎗️'}</Text>
                  <View style={{ flex: 1 }}>
                    <GText variant="small">{COMPETITION_TYPE_MAP[h.type].name}</GText>
                    <GText variant="tiny" color={C.textDim}>{COMPETITION_TIERS[h.tier].name} · best lift {formatNumber(h.playerBest)}{h.newRecord ? ' · NEW PR!' : ''}</GText>
                  </View>
                  <GText variant="tiny" color={C.goldLight}>+{formatCash(h.rewardCash)}</GText>
                </Pressable>
              ))}
            </Panel>
          )}
          <GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center', marginTop: 10 }}>Competitions are simulated with fictional stats against AI lifters.</GText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  weekly: { borderRadius: R.lg, padding: S.lg, gap: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  powerRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 8 },
  tierChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, borderWidth: 2 },
  tierText: { fontFamily: FONT.display, fontSize: 13 },
  compCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  records: { flexDirection: 'row', gap: 6 },
  record: { flex: 1, alignItems: 'center', backgroundColor: C.panel, borderRadius: R.md, paddingVertical: 8, borderWidth: 2, borderColor: C.panelBorder },
  recordValue: { fontFamily: FONT.display, fontSize: 16, color: '#fff' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
});
