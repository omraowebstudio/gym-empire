import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, R, S, TEXT_SHADOW } from '@/theme';
import { GameButton, GText, Panel, ProgressBar, Screen, ScreenHeader, StatRow } from '@/components/ui';
import { Character, exercisePose } from '@/components/art/Character';
import { ChallengeView } from '@/components/training/Challenges';
import { CHALLENGE_INFO, EXERCISE_MAP } from '@/game/config/exercises';
import { ECONOMY, exerciseXpForLevel } from '@/game/config/economy';
import { ITEM_MAP } from '@/game/config/items';
import {
  canTrain,
  challengeDifficulty,
  completeTraining,
  computeTrainingReward,
  nextChallenge,
  type ChallengeOutcome,
  type TrainingReward,
} from '@/game/systems/training';
import { currentEnergy } from '@/game/systems/core';
import { exercisePower, overallStrength, physiqueStage, trainingMultiplier } from '@/game/systems/stats';
import type { ExerciseId } from '@/game/types';
import { dispatch, useGame, useGameStore } from '@/store/gameStore';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { naturalBreak, setActiveGameplay } from '@/hooks/useAds';
import { formatNumber } from '@/game/utils/format';

type Phase = 'intro' | 'countdown' | 'play' | 'result';

export default function TrainingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ex = EXERCISE_MAP[id as ExerciseId];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const game = useGame((g) => g);
  const [phase, setPhase] = useState<Phase>('intro');
  const [count, setCount] = useState(3);
  const [p, setP] = useState(0);
  const [result, setResult] = useState<{ outcome: ChallengeOutcome; reward: TrainingReward; before: { level: number; power: number } } | null>(null);
  const [kind, setKind] = useState(() => (ex ? nextChallenge(game, ex.id) : 'timing'));
  const difficulty = ex ? challengeDifficulty(game, ex.id) : 0;
  const stage = physiqueStage(overallStrength(game));
  const startSnapshot = useRef<{ level: number; power: number } | null>(null);

  useEffect(() => {
    setActiveGameplay(phase === 'countdown' || phase === 'play');
    return () => setActiveGameplay(false);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      setPhase('play');
      audio.play('whoosh');
      return;
    }
    audio.play('click');
    const t = setTimeout(() => setCount((c) => c - 1), 650);
    return () => clearTimeout(t);
  }, [phase, count]);

  const pose = useMemo(() => (ex ? exercisePose(ex.id, stage, p) : undefined), [ex, stage, p]);

  if (!ex) {
    return (
      <Screen>
        <ScreenHeader title="Unknown exercise" />
      </Screen>
    );
  }

  const prog = game.exercises[ex.id];
  const err = canTrain(game, ex.id, Date.now());
  const preview = computeTrainingReward(game, ex.id, { challenge: kind, reps: 5, perfects: 5, goods: 0, misses: 0, score: 1 });
  const mult = trainingMultiplier(game, ex.id);
  const charSize = Math.min(width * 0.62, 280);

  const start = () => {
    if (err) {
      haptics.error();
      return;
    }
    startSnapshot.current = { level: prog.level, power: exercisePower(game, ex.id) };
    setCount(3);
    setPhase('countdown');
  };

  const finish = (outcome: ChallengeOutcome) => {
    const reward = computeTrainingReward(game, ex.id, outcome);
    const r = dispatch((d, ctx) => completeTraining(d, ctx, ex.id, outcome));
    if (r.ok) {
      setResult({ outcome, reward, before: startSnapshot.current ?? { level: prog.level, power: 0 } });
      setPhase('result');
      audio.play(reward.grade === 'S' || reward.grade === 'A' ? 'victory' : 'coin');
    } else {
      setPhase('intro');
    }
    setP(0);
  };

  const again = () => {
    setResult(null);
    setKind(nextChallenge(useGameStore.getState().game, ex.id));
    setPhase('intro');
  };

  return (
    <Screen>
      {phase === 'intro' || phase === 'result' ? (
        <ScreenHeader
          title={ex.name}
          subtitle={`${ex.muscle} · Level ${prog.level} · Power ${exercisePower(game, ex.id)}`}
          onBack={() => {
            if (phase === 'result') naturalBreak();
            router.back();
          }}
        />
      ) : (
        <View style={{ height: insets.top + 12 }} />
      )}

      <LinearGradient colors={[ex.color + '55', 'transparent']} style={styles.stage}>
        <View style={styles.spotlight} />
        <Character
          appearance={game.profile.appearance}
          stage={stage}
          size={charSize}
          pose={pose}
          exercise={ex.id}
          progress={p}
          barbellColor={ITEM_MAP[game.skins.barbell]?.color}
          dumbbellColor={ITEM_MAP[game.skins.dumbbell]?.color}
        />
        {phase === 'countdown' ? (
          <Animated.Text key={count} entering={ZoomIn} style={styles.countdown}>{count === 0 ? 'GO!' : count}</Animated.Text>
        ) : null}
      </LinearGradient>

      {phase === 'intro' ? (
        <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 20, gap: S.md }}>
          <Panel>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <GText variant="h2">{CHALLENGE_INFO[kind].name}</GText>
              <GText variant="tiny" color={C.goldLight}>DIFFICULTY {'★'.repeat(1 + Math.round(difficulty * 4))}</GText>
            </View>
            <GText variant="small" color={C.textDim} style={{ marginTop: 4 }}>{CHALLENGE_INFO[kind].howTo}</GText>
            <GText variant="small" color={C.blueLight} style={{ marginTop: 4 }}>💡 {ex.tip}</GText>
            <View style={{ marginTop: 10 }}>
              <StatRow icon="⭐" label="Max XP" value={`${preview.xp}`} />
              <StatRow icon="💵" label="Max cash" value={`$${preview.cash}`} />
              <StatRow icon="📈" label="Training bonus" value={`+${Math.round((mult.total - 1) * 100)}%`} />
              <StatRow icon="⚡" label="Energy cost" value={`${ECONOMY.energy.trainingCost} (you have ${currentEnergy(game, Date.now())})`} />
            </View>
            <GText variant="tiny" color={C.textMuted} style={{ marginTop: 6 }}>All stats are fictional game values, not real-world training advice.</GText>
          </Panel>
          <GameButton title={err ?? 'START SET'} color={err ? 'gray' : 'green'} size="lg" disabled={!!err} onPress={start} testID="start-training" />
          {err === 'Not enough energy' ? <GameButton title="Get energy" icon="⚡" color="purple" size="sm" onPress={() => router.push('/train')} /> : null}
        </ScrollView>
      ) : null}

      {phase === 'play' ? (
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          <ChallengeView kind={kind} difficulty={difficulty} onProgress={setP} onFinish={finish} />
        </View>
      ) : null}

      {phase === 'countdown' ? <View style={{ flex: 1 }} /> : null}

      {phase === 'result' && result ? (
        <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 20, gap: S.md }}>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={{ alignItems: 'center' }}>
            <View style={[styles.grade, { borderColor: gradeColor(result.reward.grade) }]}>
              <Text style={[styles.gradeText, { color: gradeColor(result.reward.grade) }]}>{result.reward.grade}</Text>
            </View>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(200)}>
            <Panel>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <Reward icon="⭐" value={`+${result.reward.xp}`} label="XP" />
                <Reward icon="💵" value={`+$${result.reward.cash}`} label="CASH" />
                <Reward icon="🎯" value={`${result.outcome.perfects}/${result.outcome.reps}`} label="PERFECT" />
              </View>
              <View style={{ marginTop: 12 }}>
                <GText variant="small" color={C.textDim}>
                  {ex.name} Lv {prog.level}
                  {prog.level > result.before.level ? `  (+${prog.level - result.before.level} LEVEL UP!)` : ''}
                </GText>
                <ProgressBar value={prog.xp / exerciseXpForLevel(prog.level)} color={ex.color} label={`${formatNumber(prog.xp)} / ${formatNumber(exerciseXpForLevel(prog.level))}`} />
                <GText variant="small" color={C.textDim} style={{ marginTop: 6 }}>
                  Power {result.before.power} → <Text style={{ color: C.goldLight }}>{exercisePower(game, ex.id)}</Text>
                </GText>
              </View>
            </Panel>
          </Animated.View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <GameButton title="Done" color="gray" style={{ flex: 1 }} onPress={() => { naturalBreak(); router.back(); }} testID="training-done" />
            <GameButton title="Train again" color="green" style={{ flex: 1 }} onPress={again} disabled={!!canTrain(game, ex.id, Date.now())} testID="training-again" />
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}


function gradeColor(g: string) {
  return g === 'S' ? C.gold : g === 'A' ? C.green : g === 'B' ? C.blueLight : C.textDim;
}

function Reward({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <GText variant="number">{value}</GText>
      <GText variant="tiny" color={C.textDim}>{label}</GText>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'flex-end', paddingTop: 6, marginHorizontal: S.lg, borderRadius: R.xl, borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  spotlight: { position: 'absolute', bottom: 0, width: '80%', height: 60, borderRadius: 999, backgroundColor: 'rgba(255,231,168,0.12)' },
  countdown: { position: 'absolute', top: '30%', fontFamily: FONT.display, fontSize: 96, color: C.goldLight, ...TEXT_SHADOW },
  grade: { width: 120, height: 120, borderRadius: 60, borderWidth: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  gradeText: { fontFamily: FONT.display, fontSize: 72, ...TEXT_SHADOW },
});

