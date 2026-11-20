// Interactive training minigames. Each reports per-frame "lift progress" (for the character
// animation) and a final ChallengeOutcome. Judgement happens at the exact input timestamp.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { C, FONT, R, TEXT_SHADOW } from '@/theme';
import type { ChallengeKind } from '@/game/types';
import type { ChallengeOutcome } from '@/game/systems/training';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';

export type Judgement = 'perfect' | 'good' | 'miss';
const SCORE: Record<Judgement, number> = { perfect: 1, good: 0.7, miss: 0.15 };

export interface ChallengeProps {
  difficulty: number; // 0..1
  onProgress: (p: number) => void;
  onFinish: (o: ChallengeOutcome) => void;
}

function useRaf(cb: (now: number) => void, active: boolean) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const loop = () => {
      ref.current(performance.now());
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

function feedback(j: Judgement) {
  if (j === 'perfect') {
    audio.play('perfect');
    haptics.success();
  } else if (j === 'good') {
    audio.play('good');
    haptics.tap();
  } else {
    audio.play('miss');
    haptics.error();
  }
  audio.play('clank', 0.5);
}

function buildOutcome(kind: ChallengeKind, results: Judgement[]): ChallengeOutcome {
  const perfects = results.filter((r) => r === 'perfect').length;
  const goods = results.filter((r) => r === 'good').length;
  const misses = results.length - perfects - goods;
  const score = results.reduce((s, r) => s + SCORE[r], 0) / Math.max(1, results.length);
  return { challenge: kind, reps: results.length, perfects, goods, misses, score };
}

export function RepPips({ total, results }: { total: number; results: Judgement[] }) {
  return (
    <View style={styles.pips}>
      {Array.from({ length: total }).map((_, i) => {
        const r = results[i];
        const color = r === 'perfect' ? C.gold : r === 'good' ? C.green : r === 'miss' ? C.red : 'rgba(255,255,255,0.15)';
        return <View key={i} style={[styles.pip, { backgroundColor: color }]} />;
      })}
    </View>
  );
}

export function JudgementPop({ j, k }: { j: Judgement | null; k: number }) {
  if (!j) return null;
  const color = j === 'perfect' ? C.goldLight : j === 'good' ? C.green : C.red;
  return (
    <Animated.View key={k} entering={ZoomIn.springify().damping(10)} exiting={FadeOut} style={styles.pop} pointerEvents="none">
      <Text style={[styles.popText, { color }]}>{j === 'perfect' ? 'PERFECT!' : j === 'good' ? 'GOOD' : 'MISS'}</Text>
    </Animated.View>
  );
}

// ---------------- Timing ----------------

export function TimingChallenge({ difficulty, onProgress, onFinish }: ChallengeProps) {
  const reps = 5;
  const [results, setResults] = useState<Judgement[]>([]);
  const [marker, setMarker] = useState(0);
  const [judge, setJudge] = useState<{ j: Judgement; k: number } | null>(null);
  const st = useRef({ repStart: performance.now(), phase: 'aim' as 'aim' | 'lift', liftStart: 0, zone: newZone(difficulty), done: false, results: [] as Judgement[] });
  const [zone, setZone] = useState(st.current.zone);
  const speed = (rep: number) => 0.5 + 0.55 * difficulty + 0.05 * rep;

  const pos = useCallback((t: number) => {
    const s = speed(st.current.results.length);
    const x = ((t - st.current.repStart) / 1000) * s * 2;
    return 1 - Math.abs((x % 2) - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const register = useCallback((j: Judgement) => {
    const s = st.current;
    s.results = [...s.results, j];
    setResults(s.results);
    setJudge({ j, k: s.results.length });
    feedback(j);
    s.phase = 'lift';
    s.liftStart = performance.now();
  }, []);

  useRaf((t) => {
    const s = st.current;
    if (s.done) return;
    if (s.phase === 'aim') {
      setMarker(pos(t));
      onProgress(0.08 * Math.sin((t - s.repStart) / 180) + 0.08);
      if (t - s.repStart > 7000) register('miss');
    } else {
      const e = (t - s.liftStart) / 700;
      const j = s.results[s.results.length - 1];
      const height = j === 'miss' ? 0.45 : 1;
      onProgress(e < 0.5 ? height * (e / 0.5) : height * Math.max(0, 1 - (e - 0.5) / 0.5));
      if (e >= 1) {
        if (s.results.length >= reps) {
          s.done = true;
          onFinish(buildOutcome('timing', s.results));
        } else {
          s.phase = 'aim';
          s.repStart = performance.now();
          s.zone = newZone(difficulty);
          setZone(s.zone);
        }
      }
    }
  }, true);

  const tap = () => {
    const s = st.current;
    if (s.phase !== 'aim' || s.done) return;
    const x = pos(performance.now());
    const d = Math.abs(x - s.zone.center);
    register(d <= s.zone.perfect / 2 ? 'perfect' : d <= s.zone.width / 2 ? 'good' : 'miss');
  };

  return (
    <Pressable style={styles.area} onPressIn={tap} accessibilityLabel="Tap when the marker is in the gold zone" testID="tap-area">
      <RepPips total={reps} results={results} />
      <View style={styles.gauge}>
        <View style={[styles.zone, { left: `${(zone.center - zone.width / 2) * 100}%`, width: `${zone.width * 100}%` }]} />
        <View style={[styles.zonePerfect, { left: `${(zone.center - zone.perfect / 2) * 100}%`, width: `${zone.perfect * 100}%` }]} />
        <View style={[styles.marker, { left: `${marker * 100}%` }]} />
      </View>
      <JudgementPop j={judge?.j ?? null} k={judge?.k ?? 0} />
      <Text style={styles.cta}>TAP!</Text>
    </Pressable>
  );
}

function newZone(difficulty: number) {
  const width = 0.26 - 0.1 * difficulty;
  const center = 0.25 + Math.random() * 0.5;
  return { center, width, perfect: width * 0.36 };
}

// ---------------- Power (tap mash) ----------------

export function PowerChallenge({ difficulty, onProgress, onFinish }: ChallengeProps) {
  const reps = 3;
  const limit = 4200 - 1000 * difficulty;
  const [results, setResults] = useState<Judgement[]>([]);
  const [meter, setMeter] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1);
  const [judge, setJudge] = useState<{ j: Judgement; k: number } | null>(null);
  const st = useRef({ m: 0, repStart: performance.now(), last: performance.now(), phase: 'grind' as 'grind' | 'lower', lowerStart: 0, results: [] as Judgement[], done: false });

  const finishRep = (j: Judgement) => {
    const s = st.current;
    s.results = [...s.results, j];
    setResults(s.results);
    setJudge({ j, k: s.results.length });
    feedback(j);
    s.phase = 'lower';
    s.lowerStart = performance.now();
  };

  useRaf((t) => {
    const s = st.current;
    if (s.done) return;
    const dt = (t - s.last) / 1000;
    s.last = t;
    if (s.phase === 'grind') {
      s.m = Math.max(0, s.m - dt * (0.32 + 0.15 * difficulty));
      const elapsed = t - s.repStart;
      setMeter(s.m);
      setTimeLeft(Math.max(0, 1 - elapsed / limit));
      onProgress(s.m);
      if (elapsed > limit) finishRep('miss');
    } else {
      const e = (t - s.lowerStart) / 450;
      onProgress(Math.max(0, s.m * (1 - e)));
      setMeter(Math.max(0, s.m * (1 - e)));
      if (e >= 1) {
        s.m = 0;
        if (s.results.length >= reps) {
          s.done = true;
          onFinish(buildOutcome('power', s.results));
        } else {
          s.phase = 'grind';
          s.repStart = performance.now();
        }
      }
    }
  }, true);

  const tap = () => {
    const s = st.current;
    if (s.phase !== 'grind' || s.done) return;
    s.m = Math.min(1, s.m + 0.09 - 0.03 * difficulty);
    haptics.tap();
    if (s.m >= 1) {
      const elapsed = performance.now() - s.repStart;
      finishRep(elapsed <= limit * 0.55 ? 'perfect' : 'good');
    }
  };

  return (
    <Pressable style={styles.area} onPressIn={tap} accessibilityLabel="Tap rapidly to fill the power meter" testID="tap-area">
      <RepPips total={reps} results={results} />
      <View style={styles.powerRow}>
        <View style={styles.powerTrack}>
          <LinearGradient colors={[C.green, C.gold, C.red]} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={[styles.powerFill, { height: `${meter * 100}%` }]} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.hint}>TIME</Text>
          <View style={styles.timeTrack}><View style={[styles.timeFill, { width: `${timeLeft * 100}%`, backgroundColor: timeLeft > 0.45 ? C.blueLight : C.red }]} /></View>
          <Text style={styles.hint}>Fill the bar fast for PERFECT</Text>
        </View>
      </View>
      <JudgementPop j={judge?.j ?? null} k={judge?.k ?? 0} />
      <Text style={styles.cta}>TAP TAP TAP!</Text>
    </Pressable>
  );
}

// ---------------- Tempo (hold & release) ----------------

export function TempoChallenge({ difficulty, onProgress, onFinish }: ChallengeProps) {
  const reps = 4;
  const fillTime = 1350 - 400 * difficulty;
  const [results, setResults] = useState<Judgement[]>([]);
  const [charge, setCharge] = useState(0);
  const [holding, setHolding] = useState(false);
  const [judge, setJudge] = useState<{ j: Judgement; k: number } | null>(null);
  const st = useRef({ c: 0, holding: false, holdStart: 0, phase: 'ready' as 'ready' | 'hold' | 'lower', lowerStart: 0, results: [] as Judgement[], done: false, zone: tempoZone(difficulty), idleSince: performance.now() });
  const [zone, setZone] = useState(st.current.zone);

  const judgeRelease = (c: number): Judgement => {
    const z = st.current.zone;
    const mid = (z.lo + z.hi) / 2;
    const half = (z.hi - z.lo) / 2;
    if (Math.abs(c - mid) <= half * 0.4) return 'perfect';
    if (c >= z.lo && c <= z.hi) return 'good';
    return 'miss';
  };

  const complete = (j: Judgement) => {
    const s = st.current;
    s.results = [...s.results, j];
    setResults(s.results);
    setJudge({ j, k: s.results.length });
    feedback(j);
    s.phase = 'lower';
    s.holding = false;
    setHolding(false);
    s.lowerStart = performance.now();
  };

  useRaf((t) => {
    const s = st.current;
    if (s.done) return;
    if (s.phase === 'hold') {
      s.c = (t - s.holdStart) / fillTime;
      setCharge(s.c);
      onProgress(Math.min(1, s.c));
      if (s.c >= 1.1) complete('miss');
    } else if (s.phase === 'lower') {
      const e = (t - s.lowerStart) / 500;
      const v = Math.max(0, Math.min(1, s.c) * (1 - e));
      onProgress(v);
      setCharge(v);
      if (e >= 1) {
        s.c = 0;
        if (s.results.length >= reps) {
          s.done = true;
          onFinish(buildOutcome('tempo', s.results));
        } else {
          s.phase = 'ready';
          s.idleSince = performance.now();
          s.zone = tempoZone(difficulty);
          setZone(s.zone);
        }
      }
    } else if (t - s.idleSince > 8000) {
      s.c = 0;
      complete('miss');
    }
  }, true);

  const pressIn = () => {
    const s = st.current;
    if (s.phase !== 'ready' || s.done) return;
    s.phase = 'hold';
    s.holding = true;
    s.holdStart = performance.now();
    setHolding(true);
    haptics.tap();
  };
  const pressOut = () => {
    const s = st.current;
    if (s.phase !== 'hold') return;
    complete(judgeRelease((performance.now() - s.holdStart) / fillTime));
  };

  return (
    <Pressable style={styles.area} onPressIn={pressIn} onPressOut={pressOut} accessibilityLabel="Hold to charge, release in the zone" testID="tap-area">
      <RepPips total={reps} results={results} />
      <View style={styles.gauge}>
        <View style={[styles.zone, { left: `${zone.lo * 100}%`, width: `${(zone.hi - zone.lo) * 100}%` }]} />
        <View style={[styles.zonePerfect, { left: `${((zone.lo + zone.hi) / 2 - ((zone.hi - zone.lo) / 2) * 0.4) * 100}%`, width: `${(zone.hi - zone.lo) * 0.4 * 100}%` }]} />
        <View style={[styles.chargeFill, { width: `${Math.min(1, charge) * 100}%` }]} />
      </View>
      <JudgementPop j={judge?.j ?? null} k={judge?.k ?? 0} />
      <Text style={styles.cta}>{holding ? 'RELEASE IN THE ZONE!' : 'PRESS & HOLD'}</Text>
    </Pressable>
  );
}

function tempoZone(difficulty: number) {
  const width = 0.22 - 0.08 * difficulty;
  const lo = 0.5 + Math.random() * 0.25;
  return { lo, hi: Math.min(0.98, lo + width) };
}

export function ChallengeView({ kind, ...props }: ChallengeProps & { kind: ChallengeKind }) {
  if (kind === 'power') return <PowerChallenge {...props} />;
  if (kind === 'tempo') return <TempoChallenge {...props} />;
  return <TimingChallenge {...props} />;
}

const styles = StyleSheet.create({
  area: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 20, paddingVertical: 10 },
  pips: { flexDirection: 'row', gap: 8 },
  pip: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  gauge: { width: '100%', maxWidth: 420, height: 46, borderRadius: R.md, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', justifyContent: 'center' },
  zone: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(255,200,61,0.45)' },
  zonePerfect: { position: 'absolute', top: 0, bottom: 0, backgroundColor: C.gold },
  marker: { position: 'absolute', top: -2, bottom: -2, width: 8, marginLeft: -4, backgroundColor: '#fff', borderRadius: 4, borderWidth: 2, borderColor: C.bg },
  chargeFill: { position: 'absolute', left: 0, top: 10, bottom: 10, backgroundColor: 'rgba(95,160,255,0.85)', borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  cta: { fontFamily: FONT.display, fontSize: 30, color: '#fff', letterSpacing: 1, ...TEXT_SHADOW },
  pop: { position: 'absolute', top: '30%' },
  popText: { fontFamily: FONT.display, fontSize: 44, ...TEXT_SHADOW },
  powerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%', maxWidth: 420 },
  powerTrack: { width: 46, height: 150, borderRadius: R.md, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.18)', justifyContent: 'flex-end', overflow: 'hidden' },
  powerFill: { width: '100%' },
  timeTrack: { height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.45)', overflow: 'hidden' },
  timeFill: { height: '100%', borderRadius: 8 },
  hint: { fontFamily: FONT.heavy, fontSize: 12, color: C.textDim },
});
