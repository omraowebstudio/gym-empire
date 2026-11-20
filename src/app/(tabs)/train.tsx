import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, GRADIENTS, R, S } from '@/theme';
import { CurrencyBar, GameButton, GText, Panel, ProgressBar, Screen, SectionTitle } from '@/components/ui';
import { Character, exercisePose } from '@/components/art/Character';
import { LiveCharacter } from '@/components/LiveCharacter';
import { EXERCISES, PHYSIQUE_STAGES } from '@/game/config/exercises';
import { ECONOMY, exerciseXpForLevel, maxEnergy, techniqueCost } from '@/game/config/economy';
import { currentEnergy, energyRegenRemaining } from '@/game/systems/core';
import { exercisePower, isExerciseUnlocked, overallStrength, physiqueProgress, trainingMultiplier } from '@/game/systems/stats';
import { upgradeTechnique } from '@/game/systems/training';
import { adEnergyRefill, refillEnergyWithGems } from '@/game/systems/shop';
import { dispatch, physiqueName, useGame } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { useRewardedAd } from '@/hooks/useAds';
import { formatCash, formatNumber } from '@/game/utils/format';
import { audio } from '@/services/audio';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrainScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const game = useGame((g) => g);
  const { watch, busy } = useRewardedAd();
  const energy = currentEnergy(game, now);
  const maxE = maxEnergy(game.level);
  const regen = energyRegenRemaining(game, now);
  const strength = overallStrength(game);
  const phys = physiqueProgress(strength);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: S.lg, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={styles.top}>
            <GText variant="title">Training</GText>
            <CurrencyBar />
          </View>

          {/* Energy */}
          <Panel>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 28 }}>⚡</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <GText variant="h2" style={{ fontSize: 16 }}>Energy {energy}/{maxE}</GText>
                  <GText variant="tiny" color={C.textDim}>{regen > 0 ? `+1 in ${Math.floor(regen / 60)}:${String(regen % 60).padStart(2, '0')}` : 'FULL'}</GText>
                </View>
                <ProgressBar value={energy / maxE} color={C.green} height={12} />
              </View>
            </View>
            {energy < maxE ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <GameButton title="+50% energy" subtitle="Watch optional ad" icon="📺" color="purple" size="sm" style={{ flex: 1 }} disabled={busy} onPress={() => watch('energy_refill', (d, ctx) => adEnergyRefill(d, ctx))} />
                <GameButton title="Refill" subtitle={`${ECONOMY.energy.refillGemCost} gems`} icon="💎" color="blue" size="sm" style={{ flex: 1 }} disabled={game.gems < ECONOMY.energy.refillGemCost} onPress={() => dispatch((d, ctx) => refillEnergyWithGems(d, ctx))} />
              </View>
            ) : null}
          </Panel>

          {/* Stats & physique */}
          <SectionTitle>Your Lifter</SectionTitle>
          <Panel colors={GRADIENTS.hero}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LiveCharacter size={110} />
              <View style={{ flex: 1, gap: 4 }}>
                <GText variant="tiny" color={C.goldLight}>PHYSIQUE · STAGE {phys.stage + 1}/6</GText>
                <GText variant="title" style={{ fontSize: 24 }}>{physiqueName(phys.stage)}</GText>
                <ProgressBar value={phys.progress} label={phys.next ? `${strength} / ${phys.next}` : 'MAX'} />
                <GText variant="tiny" color={C.textDim}>{phys.next ? `Next: ${PHYSIQUE_STAGES[phys.stage + 1].name}` : 'You reached the Elite physique!'}</GText>
              </View>
            </View>
            <View style={styles.statGrid}>
              <Stat label="OVERALL" value={strength} color={C.goldLight} />
              <Stat label="BENCH" value={exercisePower(game, 'bench')} />
              <Stat label="SQUAT" value={exercisePower(game, 'squat')} />
              <Stat label="DEADLIFT" value={exercisePower(game, 'deadlift')} />
            </View>
            <GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center' }}>Power values are fictional game statistics.</GText>
          </Panel>

          <SectionTitle>Exercises</SectionTitle>
          <View style={{ gap: S.md }}>
            {EXERCISES.map((e) => {
              const unlocked = isExerciseUnlocked(game, e.id);
              const p = game.exercises[e.id];
              const tCost = techniqueCost(p.technique);
              const mult = trainingMultiplier(game, e.id);
              return (
                <Pressable
                  key={e.id}
                  onPress={() => {
                    if (!unlocked) return;
                    audio.play('click');
                    router.push(`/training/${e.id}`);
                  }}
                  accessibilityLabel={`${e.name}${unlocked ? '' : ' locked'}`}
                  testID={`exercise-${e.id}`}
                >
                  <View style={[styles.card, { borderColor: unlocked ? e.color : C.panelBorder }]}>
                    <LinearGradient colors={unlocked ? [e.color + '40', '#1A2150'] : ['#1A2150', '#141A40']} style={StyleSheet.absoluteFill} />
                    <View style={[styles.thumb, { opacity: unlocked ? 1 : 0.35 }]}>
                      <Character appearance={game.profile.appearance} stage={phys.stage} size={62} pose={exercisePose(e.id, phys.stage, 0.55)} exercise={e.id} showShadow={false} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <GText variant="h2" style={{ fontSize: 17 }}>{e.name}</GText>
                        {unlocked ? <GText variant="tiny" color={C.goldLight}>LV {p.level}</GText> : null}
                      </View>
                      {unlocked ? (
                        <>
                          <GText variant="tiny" color={C.textDim}>{e.muscle.toUpperCase()} · POWER {exercisePower(game, e.id)} · BONUS +{Math.round((mult.total - 1) * 100)}%</GText>
                          <ProgressBar value={p.xp / exerciseXpForLevel(p.level)} color={e.color} height={10} />
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            <GameButton title="TRAIN" color="green" size="sm" style={{ flex: 1 }} onPress={() => router.push(`/training/${e.id}`)} testID={`train-${e.id}`} />
                            <GameButton
                              title={p.technique >= ECONOMY.training.maxTechnique ? 'MAX' : `Technique ${p.technique + 1}`}
                              subtitle={p.technique >= ECONOMY.training.maxTechnique ? undefined : formatCash(tCost)}
                              color="gold"
                              size="sm"
                              style={{ flex: 1 }}
                              disabled={p.technique >= ECONOMY.training.maxTechnique || game.cash < tCost}
                              onPress={() => {
                                if (dispatch((d, ctx) => upgradeTechnique(d, ctx, e.id)).ok) audio.play('upgrade');
                              }}
                              testID={`technique-${e.id}`}
                            />
                          </View>
                        </>
                      ) : (
                        <GText variant="small" color={C.textDim}>🔒 Unlocks at player level {e.unlockLevel}</GText>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <GText variant="tiny" color={C.textMuted} style={{ marginTop: 12, textAlign: 'center' }}>
            Technique upgrades add +{Math.round(ECONOMY.training.techniqueXpBonus * 100)}% XP and +{ECONOMY.training.techniquePowerBonus} power each. Owning matching gym equipment and hiring trainers also boosts training.
          </GText>
          <GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center' }}>Sessions done: {formatNumber(game.counters.trainings)}</GText>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, color = '#fff' }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{formatNumber(value)}</Text>
      <GText variant="tiny" color={C.textDim}>{label}</GText>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  statGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 6 },
  stat: { alignItems: 'center', flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', marginHorizontal: 3, borderRadius: 12, paddingVertical: 6 },
  statValue: { fontFamily: FONT.display, fontSize: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: R.lg, borderWidth: 2, padding: 10, overflow: 'hidden' },
  thumb: { width: 70, height: 84, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14 },
});
