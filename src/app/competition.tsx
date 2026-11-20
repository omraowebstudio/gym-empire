import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, R, S, TEXT_SHADOW } from "@/theme";
import { GameButton, GText, Panel, Screen } from '@/components/ui';
import { Avatar, Character, exercisePose } from '@/components/art/Character';
import { COMPETITION_TIERS, COMPETITION_TYPE_MAP, ROUND_NAMES } from '@/game/config/competitions';
import { ITEM_MAP } from '@/game/config/items';
import { PLAYER_ID, forfeitCompetition, playCompetitionRound, playerCompetitionPower } from '@/game/systems/competitions';
import { overallStrength, physiqueStage } from '@/game/systems/stats';
import type { CompetitionMatch, CompetitionOpponent, ExerciseId } from '@/game/types';
import { dispatch, useGame, useGameStore } from '@/store/gameStore';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { setActiveGameplay } from '@/hooks/useAds';
import { formatNumber } from '@/game/utils/format';

type Phase = 'matchup' | 'lift' | 'reveal';

export default function CompetitionScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const game = useGame((g) => g);
  const active = game.competition.active;
  const [phase, setPhase] = useState<Phase>('matchup');
  const [reveal, setReveal] = useState<{ match: CompetitionMatch; opp: CompetitionOpponent; finished: boolean; resultId: string | null } | null>(null);
  const [liftP, setLiftP] = useState(0);
  const stage = physiqueStage(overallStrength(game));

  useEffect(() => {
    setActiveGameplay(true);
    return () => setActiveGameplay(false);
  }, []);

  useEffect(() => {
    if (!active && !reveal) router.replace('/compete');
  }, [active, reveal]);

  if (!active && !reveal) return <Screen><View /></Screen>;

  const typeDef = COMPETITION_TYPE_MAP[(active ?? game.competition.history[0]).type];
  const exercise: ExerciseId = typeDef.type === 'bench' ? 'bench' : typeDef.type === 'squat' ? 'squat' : 'deadlift';

  // Current opponent for the player this round
  let opponent: CompetitionOpponent | null = null;
  if (active) {
    if (active.round === 0) opponent = active.opponents[0];
    else {
      const prev = active.matches.filter((m) => m.round === active.round - 1).map((m) => m.winner);
      const idx = prev.indexOf(PLAYER_ID);
      const oppId = idx % 2 === 0 ? prev[idx + 1] : prev[idx - 1];
      opponent = active.opponents.find((o) => o.id === oppId) ?? null;
    }
  }

  const onLift = (quality: number) => {
    const prevActive = useGameStore.getState().game.competition.active!;
    const opp = opponent!;
    const r = dispatch((d, ctx) => playCompetitionRound(d, ctx, quality));
    if (!r.ok) return;
    const after = r.state.competition.active;
    const matches = after ? after.matches : r.state.competition.history[0].matches;
    const match = matches.filter((m) => m.round === prevActive.round && (m.a === PLAYER_ID || m.b === PLAYER_ID))[0];
    setReveal({ match, opp, finished: !after, resultId: after ? null : r.state.competition.history[0].id });
    setPhase('reveal');
  };

  const playerPower = playerCompetitionPower(game, typeDef.type);
  const charSize = Math.min(width * 0.42, 190);

  return (
    <Screen>
      <LinearGradient colors={[typeDef.color + '66', 'transparent']} style={{ paddingTop: insets.top + 8, paddingHorizontal: S.lg, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <GText variant="tiny" color={C.goldLight}>{COMPETITION_TIERS[(active ?? game.competition.history[0]).tier].name.toUpperCase()}</GText>
            <GText variant="h2">{typeDef.icon} {typeDef.name}</GText>
          </View>
          {active && phase === 'matchup' ? (
            <GameButton title="Forfeit" color="gray" size="sm" onPress={() => {
              const r = dispatch((d, ctx) => forfeitCompetition(d, ctx));
              if (r.ok) router.replace({ pathname: '/results', params: { id: r.state.competition.history[0].id } });
            }} />
          ) : null}
        </View>
        <Bracket round={active ? active.round : 3} eliminated={!!active?.eliminated} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24, gap: S.md, alignItems: 'center' }}>
        {phase === 'matchup' && active && opponent ? (
          <Animated.View entering={FadeIn} style={{ width: '100%', maxWidth: 520, gap: S.md }}>
            <GText variant="title" style={{ textAlign: 'center' }}>{ROUND_NAMES[active.round]}</GText>
            <View style={styles.vsRow}>
              <Fighter name={game.profile.name} power={playerPower} isPlayer avatar={<Character appearance={game.profile.appearance} stage={stage} size={110} showShadow={false} />} />
              <Text style={styles.vs}>VS</Text>
              <Fighter name={opponent.name} power={opponent.power} subtitle={opponent.country} avatar={<Avatar seed={opponent.seed} size={96} ring={typeDef.color} />} />
            </View>
            <Panel>
              <GText variant="small" color={C.textDim} style={{ textAlign: 'center' }}>
                Nail the timing on your lift to perform up to 8% above your power. A sloppy lift can cost you the round!
              </GText>
            </Panel>
            <GameButton title="STEP UP TO THE BAR" color="gold" size="lg" onPress={() => { audio.play('whoosh'); setLiftP(0); setPhase('lift'); }} testID="step-up" />
          </Animated.View>
        ) : null}

        {phase === 'lift' && opponent ? (
          <View style={{ width: '100%', maxWidth: 520, alignItems: 'center', gap: S.md }}>
            <Character appearance={game.profile.appearance} stage={stage} size={charSize} pose={exercisePose(exercise, stage, liftP)} exercise={exercise} progress={liftP} barbellColor={ITEM_MAP[game.skins.barbell]?.color} />
            <LiftTiming onDone={onLift} onProgress={setLiftP} />
          </View>
        ) : null}

        {phase === 'reveal' && reveal ? (
          <Reveal
            match={reveal.match}
            playerName={game.profile.name}
            opp={reveal.opp}
            onNext={() => {
              if (reveal.finished && reveal.resultId) {
                router.replace({ pathname: '/results', params: { id: reveal.resultId } });
              } else {
                setReveal(null);
                setPhase('matchup');
              }
            }}
            finished={reveal.finished}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Bracket({ round, eliminated }: { round: number; eliminated: boolean }) {
  return (
    <View style={styles.bracket}>
      {ROUND_NAMES.map((n, i) => {
        const done = i < round;
        const current = i === round && !eliminated;
        return (
          <View key={n} style={[styles.bracketStep, done && { backgroundColor: C.green }, current && { backgroundColor: C.gold }]}>
            <Text style={[styles.bracketText, { color: done || current ? '#111' : C.textDim }]}>{n}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Fighter({ name, power, avatar, isPlayer, subtitle }: { name: string; power: number; avatar: React.ReactNode; isPlayer?: boolean; subtitle?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={[styles.fighterBox, { borderColor: isPlayer ? C.blueLight : C.red }]}>{avatar}</View>
      <GText variant="small" numberOfLines={1} style={{ marginTop: 4 }}>{name}</GText>
      {subtitle ? <Text style={{ fontSize: 16 }}>{subtitle}</Text> : null}
      <GText variant="number" color={isPlayer ? C.blueLight : C.red}>{formatNumber(power)} PWR</GText>
    </View>
  );
}

/** One-shot timing tap: the marker sweeps; tap as close to the centre as possible. */
function LiftTiming({ onDone, onProgress }: { onDone: (q: number) => void; onProgress: (p: number) => void }) {
  const [x, setX] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const start = useRef(performance.now());
  const doneRef = useRef(false);
  useEffect(() => {
    let id = 0;
    const loop = () => {
      const t = (performance.now() - start.current) / 1000;
      if (!doneRef.current) {
        const v = 1 - Math.abs(((t * 1.6) % 2) - 1);
        setX(v);
        onProgress(0.05 + 0.05 * Math.sin(t * 6));
        if (t > 8) tap(0);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tap = (forced?: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const q = forced ?? Math.max(0, 1 - Math.abs(x - 0.5) / 0.5);
    setResult(q);
    if (q > 0.85) { audio.play('perfect'); haptics.success(); } else if (q > 0.5) audio.play('good'); else audio.play('miss');
    audio.play('clank', 0.6);
    // animate the lift, then report
    const t0 = performance.now();
    const anim = () => {
      const e = (performance.now() - t0) / 900;
      onProgress(Math.min(1, e * (0.6 + q * 0.4) * 1.4));
      if (e < 1) requestAnimationFrame(anim);
      else onDone(q);
    };
    requestAnimationFrame(anim);
  };
  return (
    <Pressable style={{ alignSelf: 'stretch', alignItems: 'center', gap: 12, paddingVertical: 10 }} onPressIn={() => tap()} testID="lift-tap" accessibilityLabel="Tap to lift">
      <View style={styles.gauge}>
        <View style={[styles.zone, { left: '35%', width: '30%' }]} />
        <View style={[styles.zonePerfect, { left: '45%', width: '10%' }]} />
        <View style={[styles.marker, { left: `${x * 100}%` }]} />
      </View>
      <Text style={styles.cta}>{result === null ? 'TAP TO LIFT!' : result > 0.85 ? 'PERFECT LIFT!' : result > 0.5 ? 'GOOD LIFT' : 'SHAKY LIFT…'}</Text>
    </Pressable>
  );
}

function CountUp({ to, duration = 1200, color }: { to: number; duration?: number; color: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let id = 0;
    const loop = () => {
      const e = Math.min(1, (performance.now() - t0) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - e, 3))));
      if (e < 1) id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [to, duration]);
  return <Text style={[styles.liftNum, { color }]}>{formatNumber(v)}</Text>;
}

function Reveal({ match, playerName, opp, onNext, finished }: { match: CompetitionMatch; playerName: string; opp: CompetitionOpponent; onNext: () => void; finished: boolean }) {
  const playerLift = match.a === PLAYER_ID ? match.aLift : match.bLift;
  const oppLift = match.a === PLAYER_ID ? match.bLift : match.aLift;
  const won = match.winner === PLAYER_ID;
  const [shown, setShown] = useState(false);
  const scale = useSharedValue(0);
  useEffect(() => {
    const id = setTimeout(() => {
      setShown(true);
      scale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(2)) });
      audio.play(won ? 'victory' : 'defeat');
      if (won) haptics.success();
    }, 1400);
    return () => clearTimeout(id);
  }, [won, scale]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={{ width: '100%', maxWidth: 520, gap: S.md, alignItems: 'center' }}>
      <View style={styles.vsRow}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <GText variant="small">{playerName}</GText>
          <CountUp to={playerLift} color={C.blueLight} />
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <GText variant="small" numberOfLines={1}>{opp.name}</GText>
          <CountUp to={oppLift} color={C.red} />
        </View>
      </View>
      {shown ? (
        <Animated.View style={[st, { alignItems: 'center' }]}>
          <Text style={[styles.outcome, { color: won ? C.goldLight : C.red }]}>{won ? 'YOU WIN!' : 'DEFEATED'}</Text>
          <GText variant="small" color={C.textDim}>{won ? (finished ? 'You are the champion!' : 'On to the next round!') : 'Train harder and come back stronger.'}</GText>
        </Animated.View>
      ) : null}
      {shown ? (
        <Animated.View entering={ZoomIn} style={{ alignSelf: 'stretch' }}>
          <GameButton title={finished ? 'SEE RESULTS' : 'NEXT ROUND'} color={won ? 'green' : 'blue'} size="lg" onPress={onNext} testID="reveal-next" />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bracket: { flexDirection: 'row', gap: 6, marginTop: 10 },
  bracketStep: { flex: 1, paddingVertical: 6, borderRadius: R.sm, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center' },
  bracketText: { fontFamily: FONT.display, fontSize: 12 },
  vsRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  vs: { fontFamily: FONT.display, fontSize: 34, color: C.gold, marginHorizontal: 6, ...TEXT_SHADOW },
  fighterBox: { width: 120, height: 130, borderRadius: R.lg, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden' },
  gauge: { width: '100%', maxWidth: 420, height: 46, borderRadius: R.md, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  zone: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(255,200,61,0.45)' },
  zonePerfect: { position: 'absolute', top: 0, bottom: 0, backgroundColor: C.gold },
  marker: { position: 'absolute', top: -2, bottom: -2, width: 8, marginLeft: -4, backgroundColor: '#fff', borderRadius: 4, borderWidth: 2, borderColor: C.bg },
  cta: { fontFamily: FONT.display, fontSize: 28, color: '#fff', ...TEXT_SHADOW },
  liftNum: { fontFamily: FONT.display, fontSize: 52, ...TEXT_SHADOW },
  outcome: { fontFamily: FONT.display, fontSize: 48, ...TEXT_SHADOW },
});


