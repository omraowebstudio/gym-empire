import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, GRADIENTS, R, S, TEXT_SHADOW } from '@/theme';
import { CurrencyBar, GameButton, GText, IconButton, Panel, ProgressBar, Screen, SectionTitle } from '@/components/ui';
import { GymScene } from '@/components/art/GymScene';
import { LiveCharacter } from '@/components/LiveCharacter';
import { dispatch, physiqueName, useGame, useGameStore } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { xpForLevel, ECONOMY } from '@/game/config/economy';
import { incomeBreakdown, activeBoostMultiplier } from '@/game/systems/gym';
import { collectTips } from '@/game/systems/gymActions';
import { canClaimDaily, missionBonusAvailable } from '@/game/systems/retention';
import { nextObjective } from '@/game/systems/objectives';
import { overallStrength, physiqueStage } from '@/game/systems/stats';
import { adIncomeBoost, gemIncomeBoost } from '@/game/systems/shop';
import { MISSION_MAP } from '@/game/config/missions';
import { EVENT_MAP } from '@/game/config/rewards';
import { formatCash, formatDuration, formatNumber } from '@/game/utils/format';
import { msUntilNextWeek } from '@/game/utils/time';
import { audio } from '@/services/audio';
import { useRewardedAd } from '@/hooks/useAds';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const now = useNow(1000);
  const game = useGame((g) => g);
  const loadError = useGameStore((s) => s.loadError);
  const { watch, busy } = useRewardedAd();
  const loc = game.locations[game.currentLocation]!;
  const income = incomeBreakdown(game, now);
  const boost = activeBoostMultiplier(game, now);
  const boostUntil = Math.max(0, ...game.boosts.map((b) => b.until));
  const objective = nextObjective(game, now);
  const stage = physiqueStage(overallStrength(game));
  const ev = EVENT_MAP[game.event.eventId];
  const dailyReady = canClaimDaily(game, now);
  const missionsReady = game.missions.missions.filter((m) => !m.claimed && m.progress >= m.target).length + (missionBonusAvailable(game) ? 1 : 0);
  const sceneW = Math.min(width - S.lg * 2, 520);
  const xpNeed = xpForLevel(game.level);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 30, paddingHorizontal: S.lg, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 520 }}>
          {/* HUD */}
          <View style={styles.hud}>
            <Pressable style={styles.profile} onPress={() => router.push('/customize')} accessibilityLabel="Customize character" testID="profile-button">
              <View style={styles.levelBadge}>
                <LinearGradient colors={GRADIENTS.gold} style={StyleSheet.absoluteFill} />
                <Text style={styles.levelText}>{game.level}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <GText variant="h2" numberOfLines={1} style={{ fontSize: 17 }}>{game.profile.name}</GText>
                <ProgressBar value={game.xp / xpNeed} height={12} color={C.blueLight} label={`${formatNumber(game.xp)} / ${formatNumber(xpNeed)} XP`} />
              </View>
            </Pressable>
            <IconButton icon="⚙️" label="Settings" size={40} onPress={() => router.push('/settings')} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <CurrencyBar />
            <Pressable onPress={() => router.push('/roadmap')} accessibilityLabel="Progression roadmap">
              <GText variant="tiny" color={C.goldLight}>🗺️ ROADMAP</GText>
            </Pressable>
          </View>

          {loadError ? (
            <Panel colors={GRADIENTS.red} style={{ marginTop: 10 }}>
              <GText variant="body">We couldn&apos;t read your saved game, so it has been left untouched.</GText>
              <GText variant="small" color="#FFE">This session won&apos;t be saved until you choose to start fresh in Settings.</GText>
            </Panel>
          ) : null}

          {/* Gym hero */}
          <Pressable onPress={() => router.navigate('/gym')} accessibilityLabel="Open gym" style={[styles.hero, { width: sceneW, alignSelf: 'center' }]}>
            <GymScene location={loc} width={sceneW} reducedMotion={game.settings.reducedMotion} barbellSkin={undefined} />
            <View style={[styles.heroChar, { left: sceneW / 2 - sceneW * 0.17 }]} pointerEvents="none">
              <LiveCharacter size={sceneW * 0.34} />
            </View>
            <View style={styles.physiqueTag} pointerEvents="none">
              <GText variant="tiny" color={C.goldLight}>{physiqueName(stage).toUpperCase()} PHYSIQUE</GText>
            </View>
          </Pressable>

          {/* Income strip */}
          <View style={styles.incomeRow}>
            <LinearGradient colors={GRADIENTS.panelLight} style={styles.incomeBox}>
              <GText variant="tiny" color={C.textDim}>GYM INCOME</GText>
              <Text style={styles.incomeValue}>{formatCash(income.net)}<Text style={styles.perMin}>/min</Text></Text>
              {boost > 1 ? <GText variant="tiny" color={C.green}>🚀 ×{boost} for {formatDuration(boostUntil - now)}</GText> : <GText variant="tiny" color={C.textMuted}>{loc.members.length} members here</GText>}
            </LinearGradient>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => {
                const r = dispatch((d, ctx) => collectTips(d, ctx));
                if (r.ok) {
                  audio.play('coin');
                  useGameStore.getState().triggerCoinBurst(Math.floor(game.tipJar));
                }
              }}
              accessibilityLabel="Collect tip jar"
              testID="tip-jar"
            >
              <LinearGradient colors={game.tipJar >= 1 ? GRADIENTS.gold : GRADIENTS.gray} style={styles.incomeBox}>
                <GText variant="tiny" color={game.tipJar >= 1 ? '#4A2A00' : C.textDim}>TIP JAR 🫙</GText>
                <Text style={[styles.incomeValue, { color: game.tipJar >= 1 ? '#4A2A00' : '#fff', textShadowRadius: 0, textShadowColor: 'transparent' }]}>{formatCash(game.tipJar)}</Text>
                <GText variant="tiny" color={game.tipJar >= 1 ? '#4A2A00' : C.textMuted}>{game.tipJar >= 1 ? 'TAP TO COLLECT' : 'Filling up…'}</GText>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <QuickAction icon="🎁" label="Daily" badge={dailyReady} onPress={() => router.push('/daily')} />
            <QuickAction icon="📋" label="Missions" badge={missionsReady > 0} count={missionsReady} onPress={() => router.push('/missions')} />
            <QuickAction icon={ev?.icon ?? '🎉'} label="Event" onPress={() => router.push('/events')} />
            <QuickAction icon="📊" label="Ranks" onPress={() => router.push('/leaderboards')} />
            <QuickAction icon="💎" label="Shop" onPress={() => router.push('/premium')} />
          </View>

          {/* Main objective */}
          <Panel colors={GRADIENTS.hero} style={{ marginTop: S.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 36 }}>{objective.icon}</Text>
              <View style={{ flex: 1 }}>
                <GText variant="tiny" color={C.goldLight}>NEXT GOAL</GText>
                <GText variant="h2" style={{ fontSize: 17 }}>{objective.title}</GText>
                <GText variant="small" color={C.textDim}>{objective.subtitle}</GText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}><ProgressBar value={objective.progress} /></View>
              <GameButton title={objective.cta} color="gold" size="sm" onPress={() => router.push(objective.route as never)} testID="objective-cta" />
            </View>
          </Panel>

          {/* Missions preview */}
          <SectionTitle right={<Pressable onPress={() => router.push('/missions')}><GText variant="tiny" color={C.blueLight}>SEE ALL ›</GText></Pressable>}>Daily Missions</SectionTitle>
          <Panel padded={false}>
            {game.missions.missions.slice(0, 3).map((m) => {
              const def = MISSION_MAP[m.defId];
              const done = m.progress >= m.target;
              return (
                <Pressable key={m.id} onPress={() => router.push('/missions')} style={styles.missionRow}>
                  <Text style={{ fontSize: 22 }}>{m.claimed ? '✅' : def.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <GText variant="small" numberOfLines={1}>{def.title.replace('{n}', formatNumber(m.target))}</GText>
                    <ProgressBar value={m.progress / m.target} height={10} color={done ? C.green : C.blue} />
                  </View>
                  <GText variant="tiny" color={done && !m.claimed ? C.green : C.textDim}>{m.claimed ? 'DONE' : done ? 'CLAIM!' : `${formatNumber(m.progress)}/${formatNumber(m.target)}`}</GText>
                </Pressable>
              );
            })}
          </Panel>

          {/* Event banner */}
          {ev ? (
            <Pressable onPress={() => router.push('/events')} style={{ marginTop: S.md }} accessibilityLabel="Open event">
              <LinearGradient colors={[ev.color, ev.color2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.eventBanner}>
                <Text style={{ fontSize: 40 }}>{ev.icon}</Text>
                <View style={{ flex: 1 }}>
                  <GText variant="tiny" color={C.goldLight}>WEEKLY EVENT · ENDS IN {formatDuration(msUntilNextWeek(now))}</GText>
                  <GText variant="h2">{ev.name}</GText>
                  <GText variant="small" color="rgba(255,255,255,0.85)">{ev.tagline} · 🎟️ {game.event.tokens} tokens</GText>
                </View>
                <GText variant="h2">›</GText>
              </LinearGradient>
            </Pressable>
          ) : null}

          {/* Income boost */}
          <SectionTitle>Income Boost</SectionTitle>
          <Panel>
            <GText variant="small" color={C.textDim}>
              Double your gym income for a while. Boosts also apply to offline earnings. (Max {ECONOMY.boosts.maxBoostMinutes / 60}h stacked.)
            </GText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <GameButton
                title="×2 for 30m"
                subtitle="Watch optional ad"
                icon="📺"
                color="purple"
                size="sm"
                style={{ flex: 1 }}
                disabled={busy}
                onPress={() => watch('income_boost', (d, ctx) => adIncomeBoost(d, ctx)).then((ok) => ok && audio.play('upgrade'))}
              />
              <GameButton
                title="×2 for 1h"
                subtitle={`${ECONOMY.boosts.gemBoostCost} gems`}
                icon="💎"
                color="blue"
                size="sm"
                style={{ flex: 1 }}
                disabled={game.gems < ECONOMY.boosts.gemBoostCost}
                onPress={() => dispatch((d, ctx) => gemIncomeBoost(d, ctx)).ok && audio.play('upgrade')}
              />
            </View>
          </Panel>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: S.md }}>
            <GameButton title="Achievements" icon="🏅" color="gray" size="sm" style={{ flex: 1 }} onPress={() => router.push('/achievements')} />
            <GameButton title="Customize" icon="👕" color="gray" size="sm" style={{ flex: 1 }} onPress={() => router.push('/customize')} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickAction({ icon, label, onPress, badge, count }: { icon: string; label: string; onPress: () => void; badge?: boolean; count?: number }) {
  return (
    <Pressable
      onPress={() => {
        audio.play('click', 0.5);
        onPress();
      }}
      style={({ pressed }) => [styles.quick, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient colors={GRADIENTS.panelLight} style={styles.quickInner}>
        <Text style={{ fontSize: 26 }}>{icon}</Text>
      </LinearGradient>
      <GText variant="tiny" color={C.textDim}>{label.toUpperCase()}</GText>
      {badge ? (
        <View style={styles.quickBadge}>
          <Text style={styles.quickBadgeText}>{count ? count : '!'}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hud: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  levelText: { fontFamily: FONT.display, fontSize: 20, color: '#4A2A00' },
  hero: { marginTop: S.md, borderRadius: R.xl, overflow: 'hidden', borderWidth: 3, borderColor: C.panelBorder },
  heroChar: { position: 'absolute', bottom: -6 },
  physiqueTag: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(5,8,26,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  incomeRow: { flexDirection: 'row', gap: 8, marginTop: S.md },
  incomeBox: { flex: 1, borderRadius: R.md, padding: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  incomeValue: { fontFamily: FONT.display, fontSize: 24, color: C.goldLight, ...TEXT_SHADOW },
  perMin: { fontSize: 14, color: C.textDim },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: S.md },
  quick: { alignItems: 'center', gap: 3, width: '19%' },
  quickInner: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' },
  quickBadge: { position: 'absolute', top: -4, right: 2, backgroundColor: C.red, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  quickBadgeText: { color: '#fff', fontFamily: FONT.heavy, fontSize: 11 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: S.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  eventBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: R.lg, padding: S.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
});
