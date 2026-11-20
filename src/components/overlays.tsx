// Global overlays: toasts, celebrations, offline earnings, coin bursts and the
// clearly-labelled TEST MODE ad/store hosts.
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, GRADIENTS, R, TEXT_SHADOW } from '@/theme';
import { GameButton, GText, StatRow } from './ui';
import { ItemIcon } from './art/Items';
import { LiveCharacter } from './LiveCharacter';
import { useGameStore, physiqueName, dispatch } from '@/store/gameStore';
import { formatCash, formatDuration, formatNumber } from '@/game/utils/format';
import { collectOffline } from '@/game/systems/offline';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { mockAds, mockStore, type MockAdRequest, type MockStoreRequest } from '@/services/monetization';
import { PRODUCT_MAP } from '@/game/config/products';
import { useRewardedAd } from '@/hooks/useAds';
import { PHYSIQUE_STAGES } from '@/game/config/exercises';

// ---------------- Toasts ----------------

export function ToastHost() {
  const toasts = useGameStore((s) => s.toasts);
  const dismiss = useGameStore((s) => s.dismissToast);
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8, alignItems: 'center' }]}>
      {toasts.slice(0, 2).map((t) => (
        <ToastView key={t.id} toast={t} onDone={() => dismiss(t.id)} />
      ))}
    </View>
  );
}

function ToastView({ toast, onDone }: { toast: ReturnType<typeof useGameStore.getState>['toasts'][number]; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, toast.kind === 'error' ? 2000 : 2400);
    return () => clearTimeout(id);
  }, [onDone, toast.kind]);
  const colors =
    toast.kind === 'error' ? GRADIENTS.red : toast.kind === 'achievement' ? GRADIENTS.gold : toast.kind === 'item' ? GRADIENTS.purple : toast.kind === 'mission' ? GRADIENTS.green : GRADIENTS.blue;
  const dark = toast.kind === 'achievement' || toast.kind === 'mission';
  return (
    <Animated.View entering={FadeInDown.springify().damping(14)} exiting={FadeOutUp} style={styles.toastWrap}>
      <Pressable onPress={onDone} accessibilityRole="alert">
        <LinearGradient colors={colors} style={styles.toast}>
          {toast.itemId ? <ItemIcon itemId={toast.itemId} size={36} /> : <Text style={{ fontSize: 26 }}>{toast.icon ?? '✨'}</Text>}
          <View style={{ flex: 1 }}>
            <Text style={[styles.toastTitle, { color: dark ? '#2A1A00' : '#fff' }]} numberOfLines={2}>{toast.title}</Text>
            {toast.subtitle ? <Text style={[styles.toastSub, { color: dark ? '#3A2A00' : 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>{toast.subtitle}</Text> : null}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ---------------- Confetti ----------------

const CONFETTI_COLORS = [C.gold, C.blue, C.purple, C.pink, C.green, '#fff'];

function ConfettiPiece({ x, delay, color, h }: { x: number; delay: number; color: string; h: number }) {
  const y = useSharedValue(-20);
  const rot = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withTiming(h + 40, { duration: 2200 + (delay % 900), easing: Easing.in(Easing.quad) }));
    rot.value = withDelay(delay, withRepeat(withTiming(360, { duration: 700 }), -1));
  }, [delay, h, rot, y]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: 0, width: 9, height: 14, borderRadius: 2, backgroundColor: color }, st]} />;
}

export function Confetti({ count = 40 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: Math.random() * width, delay: Math.random() * 700, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] })), [count, width]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => <ConfettiPiece key={i} {...p} h={height} />)}
    </View>
  );
}

// ---------------- Celebrations (level up / physique) ----------------

function Rays() {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1);
  }, [r]);
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.rays, st]}>
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={i} style={[styles.ray, { transform: [{ rotate: `${i * 30}deg` }] }]} />
      ))}
    </Animated.View>
  );
}

export function CelebrationHost() {
  const celebrations = useGameStore((s) => s.celebrations);
  const dismiss = useGameStore((s) => s.dismissCelebration);
  const reduced = useGameStore((s) => s.game.settings.reducedMotion);
  const c = celebrations[0];
  if (!c) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => dismiss(c.id)}>
      <View style={styles.celebBackdrop}>
        {!reduced ? <Confetti /> : null}
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.celebCard}>
          <LinearGradient colors={GRADIENTS.hero} style={StyleSheet.absoluteFill} />
          {!reduced ? <Rays /> : null}
          {c.kind === 'levelUp' ? (
            <>
              <GText variant="h2" color={C.goldLight}>LEVEL UP!</GText>
              <View style={styles.levelCircle}>
                <LinearGradient colors={GRADIENTS.gold} style={StyleSheet.absoluteFill} />
                <Text style={styles.levelNum}>{c.level}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginVertical: 8 }}>
                <GText variant="number">💵 +{formatNumber(c.cash)}</GText>
                {c.gems ? <GText variant="number">💎 +{c.gems}</GText> : null}
                <GText variant="number">⚡ Refilled</GText>
              </View>
              {c.unlocks.length ? (
                <View style={styles.unlockBox}>
                  <GText variant="tiny" color={C.goldLight}>NEW UNLOCKS</GText>
                  {c.unlocks.map((u) => <GText key={u} variant="small">🔓 {u}</GText>)}
                </View>
              ) : null}
            </>
          ) : (
            <>
              <GText variant="h2" color={C.goldLight}>NEW PHYSIQUE!</GText>
              <LiveCharacter size={150} flex stageOverride={c.stage} />
              <GText variant="title">{physiqueName(c.stage)}</GText>
              <GText variant="small" color={C.textDim} style={{ textAlign: 'center' }}>
                Stage {c.stage + 1} of {PHYSIQUE_STAGES.length}. Your training is paying off!
              </GText>
            </>
          )}
          <GameButton title="AWESOME!" color="gold" onPress={() => dismiss(c.id)} style={{ marginTop: 14, alignSelf: 'stretch' }} testID="celebration-ok" />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------- Offline earnings ----------------

export function OfflineEarningsModal() {
  const pending = useGameStore((s) => s.game.pendingOffline);
  const onboarded = useGameStore((s) => s.game.profile.onboarded);
  const gems = useGameStore((s) => s.game.gems);
  const celebrating = useGameStore((s) => s.celebrations.length > 0);
  const { watch, busy } = useRewardedAd();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (pending) setHidden(false);
  }, [pending]);
  if (!pending || !onboarded || hidden || celebrating) return null;
  const collect = (mode: 'normal' | 'gems') => {
    const r = dispatch((d, ctx) => collectOffline(d, ctx, mode));
    if (r.ok) {
      audio.play('coin');
      haptics.success();
      useGameStore.getState().triggerCoinBurst(pending.total * (mode === 'gems' ? 2 : 1));
    }
  };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setHidden(true)}>
      <View style={styles.celebBackdrop}>
        <Animated.View entering={ZoomIn.springify().damping(13)} style={styles.celebCard}>
          <LinearGradient colors={GRADIENTS.hero} style={StyleSheet.absoluteFill} />
          <GText variant="h2" color={C.goldLight}>WELCOME BACK!</GText>
          <GText variant="small" color={C.textDim} style={{ textAlign: 'center' }}>
            Your gym earned money for {formatDuration(pending.seconds * 1000)} while you were away
            {pending.rawSeconds > pending.seconds + 1 ? ` (capped at ${formatDuration(pending.capSeconds * 1000)}; hire managers to extend)` : ''}.
          </GText>
          <Text style={styles.bigCash}>{formatCash(pending.total)}</Text>
          <View style={styles.breakdown}>
            <StatRow icon="🏋️" label="Memberships" value={`+${formatCash(pending.gross)}`} />
            {pending.managerBonus > 0 ? <StatRow icon="🧑‍💼" label="Manager bonus" value={`+${formatCash(pending.managerBonus)}`} /> : null}
            {pending.boostBonus > 0 ? <StatRow icon="🚀" label="Income boost" value={`+${formatCash(pending.boostBonus)}`} /> : null}
            {pending.salaries > 0 ? <StatRow icon="💼" label="Staff salaries" value={`-${formatCash(pending.salaries)}`} /> : null}
            {pending.membersJoined > 0 ? <StatRow icon="🙋" label="New members" value={`+${pending.membersJoined}`} /> : null}
          </View>
          <GameButton title="COLLECT" icon="💰" color="green" size="lg" onPress={() => collect('normal')} style={{ alignSelf: 'stretch' }} testID="collect-offline" />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignSelf: 'stretch' }}>
            <GameButton
              title="×2"
              subtitle="Watch ad"
              icon="📺"
              color="purple"
              size="sm"
              style={{ flex: 1 }}
              disabled={busy}
              onPress={() => watch('offline_double', (d, ctx) => collectOffline(d, ctx, 'ad')).then((ok) => {
                if (ok) {
                  audio.play('coin');
                  useGameStore.getState().triggerCoinBurst(pending.total * 2);
                }
              })}
            />
            <GameButton title="×2" subtitle="10 gems" icon="💎" color="blue" size="sm" style={{ flex: 1 }} disabled={gems < 10} onPress={() => collect('gems')} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------- Coin burst ----------------

function Coin({ i, onEnd }: { i: number; onEnd?: () => void }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const angle = (i / 14) * Math.PI * 2;
  const spread = 60 + (i % 3) * 30;
  useEffect(() => {
    t.value = withDelay(i * 25, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }));
    if (onEnd) {
      const id = setTimeout(onEnd, 1300);
      return () => clearTimeout(id);
    }
  }, [i, onEnd, t]);
  const st = useAnimatedStyle(() => {
    const p = t.value;
    // burst outward, then fly to the cash counter at the top-left
    const bx = Math.cos(angle) * spread * Math.min(1, p * 3);
    const by = Math.sin(angle) * spread * Math.min(1, p * 3);
    const q = Math.max(0, (p - 0.33) / 0.67);
    const x = width / 2 + bx * (1 - q) + (60 - width / 2) * q;
    const y = height / 2 + by * (1 - q) + (40 - height / 2) * q;
    return { transform: [{ translateX: x - 12 }, { translateY: y - 12 }, { scale: 1 - q * 0.4 }], opacity: p >= 1 ? 0 : 1 };
  });
  return <Animated.Text style={[{ position: 'absolute', left: 0, top: 0, fontSize: 24 }, st]}>🪙</Animated.Text>;
}

export function CoinBurstHost() {
  const burst = useGameStore((s) => s.coinBurst);
  const reduced = useGameStore((s) => s.game.settings.reducedMotion);
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    if (burst) setActive(burst.id);
  }, [burst]);
  if (!burst || active !== burst.id || reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 14 }).map((_, i) => <Coin key={`${burst.id}-${i}`} i={i} onEnd={i === 13 ? () => setActive(null) : undefined} />)}
      <Animated.View entering={ZoomIn} style={styles.burstLabel}>
        <Text style={styles.burstText}>+{formatCash(burst.amount)}</Text>
      </Animated.View>
    </View>
  );
}

// ---------------- Mock (TEST MODE) ad + store hosts ----------------

export function MockAdHost() {
  const [req, setReq] = useState<MockAdRequest | null>(null);
  const [left, setLeft] = useState(5);
  useEffect(() => {
    mockAds.setHost((r) => {
      setLeft(r.kind === 'rewarded' ? 5 : 3);
      setReq(r);
    });
    return () => mockAds.setHost(null);
  }, []);
  useEffect(() => {
    if (!req) return;
    audio.pauseMusic();
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [req]);
  if (!req) return null;
  const done = left === 0;
  const finish = (completed: boolean) => {
    const r = req;
    setReq(null);
    audio.startMusic();
    r.resolve(completed);
  };
  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={() => finish(false)}>
      <LinearGradient colors={['#1B1F2A', '#0B0E18']} style={styles.adScreen}>
        <View style={styles.testBanner}><Text style={styles.testBannerText}>TEST MODE · MOCK AD · NOT A REAL ADVERTISEMENT</Text></View>
        <Text style={{ fontSize: 64 }}>📺</Text>
        <GText variant="title" style={{ textAlign: 'center' }}>{req.kind === 'rewarded' ? 'Rewarded Ad Placeholder' : 'Interstitial Ad Placeholder'}</GText>
        <GText variant="body" color={C.textDim} style={{ textAlign: 'center', marginHorizontal: 30 }}>
          In a production build an AdMob ad would play here. No ad network was contacted and no ad was viewed.
          {req.kind === 'rewarded' ? ' Wait for the timer to simulate a completed view.' : ''}
        </GText>
        <GText variant="display" color={C.gold}>{done ? '✓' : left}</GText>
        {req.kind === 'rewarded' ? (
          <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginHorizontal: 24 }}>
            <GameButton title="Close (no reward)" color="gray" size="sm" style={{ flex: 1 }} onPress={() => finish(false)} testID="mock-ad-close" />
            <GameButton title="Claim reward" color="green" size="sm" style={{ flex: 1 }} disabled={!done} onPress={() => finish(true)} testID="mock-ad-claim" />
          </View>
        ) : (
          <GameButton title={done ? 'Close' : `Close in ${left}`} color="gray" disabled={!done} onPress={() => finish(true)} />
        )}
      </LinearGradient>
    </Modal>
  );
}

export function MockStoreHost() {
  const [req, setReq] = useState<MockStoreRequest | null>(null);
  useEffect(() => {
    mockStore.setHost((r) => setReq(r));
    return () => mockStore.setHost(null);
  }, []);
  if (!req) return null;
  const p = PRODUCT_MAP[req.productId];
  const answer = (ok: boolean) => {
    const r = req;
    setReq(null);
    r.resolve(ok);
  };
  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => answer(false)}>
      <View style={[styles.celebBackdrop, { justifyContent: 'flex-end' }]}>
        <View style={styles.storeSheet}>
          <View style={styles.testBanner}><Text style={styles.testBannerText}>TEST STORE · NO REAL MONEY WILL BE CHARGED</Text></View>
          <GText variant="h2" color="#111">{p?.name}</GText>
          <GText variant="small" color="#444">{p?.description}</GText>
          <GText variant="title" color="#111" style={{ marginVertical: 8 }}>{p?.displayPrice} <Text style={{ fontSize: 13 }}>(simulated)</Text></GText>
          <GText variant="tiny" color="#666" style={{ marginBottom: 10 }}>
            The mock store signs a fake receipt which is then verified before any item is granted, exactly like production.
          </GText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <GameButton title="Cancel" color="gray" style={{ flex: 1 }} onPress={() => answer(false)} testID="mock-store-cancel" />
            <GameButton title="Approve (test)" color="blue" style={{ flex: 1 }} onPress={() => answer(true)} testID="mock-store-approve" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toastWrap: { width: '92%', maxWidth: 440, marginBottom: 6 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  toastTitle: { fontFamily: FONT.display, fontSize: 15 },
  toastSub: { fontFamily: FONT.body, fontSize: 12 },
  celebBackdrop: { flex: 1, backgroundColor: 'rgba(3,5,18,0.82)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  celebCard: { width: '100%', maxWidth: 380, borderRadius: 28, overflow: 'hidden', alignItems: 'center', padding: 20, borderWidth: 3, borderColor: C.gold, gap: 4 },
  rays: { position: 'absolute', top: -150, width: 500, height: 500, alignItems: 'center', justifyContent: 'center', opacity: 0.18 },
  ray: { position: 'absolute', width: 40, height: 500, backgroundColor: C.goldLight },
  levelCircle: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: '#fff', marginVertical: 8 },
  levelNum: { fontFamily: FONT.display, fontSize: 56, color: '#4A2A00' },
  unlockBox: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 10, alignSelf: 'stretch', gap: 2 },
  bigCash: { fontFamily: FONT.display, fontSize: 46, color: C.goldLight, marginVertical: 8, ...TEXT_SHADOW },
  breakdown: { alignSelf: 'stretch', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
  burstLabel: { position: 'absolute', top: '40%', alignSelf: 'center' },
  burstText: { fontFamily: FONT.display, fontSize: 40, color: C.goldLight, ...TEXT_SHADOW },
  adScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  testBanner: { backgroundColor: '#FFC83D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8, alignSelf: 'center' },
  testBannerText: { fontFamily: FONT.heavy, fontSize: 11, color: '#3A2A00' },
  storeSheet: { backgroundColor: '#F4F5F9', borderRadius: 24, padding: 20, alignSelf: 'stretch', gap: 4 },
});
