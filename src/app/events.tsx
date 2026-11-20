import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, R, S, TEXT_SHADOW } from '@/theme';
import { GameButton, GText, Panel, ProgressBar, Screen, ScreenHeader, SectionTitle } from '@/components/ui';
import { ItemIcon } from '@/components/art/Items';
import { EVENTS, EVENT_MAP } from '@/game/config/rewards';
import { claimEventMilestone } from '@/game/systems/retention';
import { resolveReward } from '@/game/systems/core';
import { dispatch, useGame } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { formatCash, formatDuration } from '@/game/utils/format';
import { msUntilNextWeek } from '@/game/utils/time';
import { audio } from '@/services/audio';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const game = useGame((g) => g);
  const ev = EVENT_MAP[game.event.eventId];
  if (!ev) return <Screen><ScreenHeader title="Events" /></Screen>;
  const max = ev.milestones[ev.milestones.length - 1].tokens;
  const idx = EVENTS.findIndex((e) => e.id === ev.id);
  const upcoming = [1, 2].map((k) => EVENTS[(idx + k) % EVENTS.length]);
  return (
    <Screen>
      <ScreenHeader title="Weekly Event" subtitle={`Ends in ${formatDuration(msUntilNextWeek(now))}`} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: S.md }}>
          <LinearGradient colors={[ev.color, ev.color2]} style={styles.banner}>
            <Text style={{ fontSize: 64 }}>{ev.icon}</Text>
            <Text style={styles.title}>{ev.name}</Text>
            <GText variant="small" color="rgba(255,255,255,0.9)">{ev.tagline}</GText>
            <View style={styles.tokens}><Text style={styles.tokenText}>🎟️ {game.event.tokens} event tokens</Text></View>
            <View style={{ alignSelf: 'stretch', marginTop: 8 }}><ProgressBar value={game.event.tokens / max} height={14} /></View>
          </LinearGradient>

          <SectionTitle>How to earn tokens</SectionTitle>
          <Panel>
            {ev.rules.map((r, i) => (
              <View key={i} style={styles.rule}>
                <GText variant="small" style={{ flex: 1 }}>{r.label}</GText>
                <GText variant="small" color={C.goldLight}>+{r.tokens} 🎟️</GText>
              </View>
            ))}
          </Panel>

          <SectionTitle>Rewards</SectionTitle>
          {ev.milestones.map((m, i) => {
            const claimed = game.event.claimed.includes(i);
            const ready = game.event.tokens >= m.tokens && !claimed;
            const r = resolveReward(game, m.reward);
            return (
              <Panel key={i} padded={false}>
                <View style={styles.ms}>
                  <View style={[styles.msBadge, { backgroundColor: claimed ? C.green : ready ? C.gold : C.panel2 }]}>
                    <Text style={styles.msTokens}>{m.tokens}</Text>
                    <Text style={{ fontSize: 10 }}>🎟️</Text>
                  </View>
                  {m.reward.itemId ? <ItemIcon itemId={m.reward.itemId} size={52} locked={false} /> : <Text style={{ fontSize: 32 }}>{m.reward.gems ? '💎' : '💵'}</Text>}
                  <View style={{ flex: 1 }}>
                    <GText variant="small">
                      {[m.reward.itemId && !r.duplicate ? 'Limited item' : null, r.cash ? formatCash(r.cash) : null, r.xp ? `${r.xp} XP` : null, r.gems ? `${r.gems} gems` : null, m.reward.energy ? `+${m.reward.energy} energy` : null].filter(Boolean).join(' + ')}
                    </GText>
                    {m.reward.itemId && r.duplicate ? <GText variant="tiny" color={C.textDim}>Already owned: converted to gems</GText> : null}
                  </View>
                  <GameButton title={claimed ? '✓' : 'CLAIM'} color={ready ? 'green' : 'gray'} size="sm" disabled={!ready} onPress={() => dispatch((d, ctx) => claimEventMilestone(d, ctx, i)).ok && audio.play('achievement')} testID={`claim-event-${i}`} />
                </View>
              </Panel>
            );
          })}

          <SectionTitle>Coming up</SectionTitle>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {upcoming.map((u, k) => (
              <LinearGradient key={u.id} colors={[u.color, u.color2]} style={styles.upcoming}>
                <Text style={{ fontSize: 28 }}>{u.icon}</Text>
                <GText variant="small" style={{ textAlign: 'center' }}>{u.name}</GText>
                <GText variant="tiny" color="rgba(255,255,255,0.8)">in {k + 1} week{k ? 's' : ''}</GText>
              </LinearGradient>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: R.xl, padding: S.lg, alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  title: { fontFamily: FONT.display, fontSize: 32, color: '#fff', ...TEXT_SHADOW },
  tokens: { backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, marginTop: 10 },
  tokenText: { fontFamily: FONT.display, color: C.goldLight, fontSize: 18 },
  rule: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  ms: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  msBadge: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  msTokens: { fontFamily: FONT.display, fontSize: 15, color: '#111' },
  upcoming: { flex: 1, borderRadius: R.md, padding: 10, alignItems: 'center' },
});
