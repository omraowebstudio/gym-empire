// Core UI kit: chunky, glossy, game-style controls.
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, GRADIENTS, R, S, TEXT_SHADOW } from '@/theme';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { formatNumber } from '@/game/utils/format';
import { useGame } from '@/store/gameStore';

// ---------------- Text ----------------

type Variant = 'display' | 'title' | 'h2' | 'body' | 'small' | 'tiny' | 'number';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: FONT.display, fontSize: 40, letterSpacing: 1, ...TEXT_SHADOW },
  title: { fontFamily: FONT.display, fontSize: 28, letterSpacing: 0.5, ...TEXT_SHADOW },
  h2: { fontFamily: FONT.display, fontSize: 20, letterSpacing: 0.3, ...TEXT_SHADOW },
  body: { fontFamily: FONT.body, fontSize: 15 },
  small: { fontFamily: FONT.body, fontSize: 13 },
  tiny: { fontFamily: FONT.heavy, fontSize: 11, letterSpacing: 0.5 },
  number: { fontFamily: FONT.display, fontSize: 18, ...TEXT_SHADOW },
};

export function GText({ variant = 'body', color = C.text, style, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  return <Text {...rest} style={[VARIANTS[variant], { color }, style]} />;
}

// ---------------- Buttons ----------------

export type ButtonColor = 'blue' | 'purple' | 'gold' | 'green' | 'red' | 'gray';

const BTN_TEXT: Record<ButtonColor, string> = {
  blue: '#fff', purple: '#fff', gold: '#4A2A00', green: '#063D1F', red: '#fff', gray: '#E4E8FF',
};
const BTN_EDGE: Record<ButtonColor, string> = {
  blue: '#123A9E', purple: '#36198F', gold: '#A3680A', green: '#137043', red: '#8C1830', gray: '#262B47',
};

export interface GameButtonProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  color?: ButtonColor;
  onPress?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  sound?: 'click' | 'none';
  testID?: string;
  accessibilityLabel?: string;
}

export function GameButton({
  title, subtitle, icon, color = 'blue', onPress, disabled, size = 'md', style, children, sound = 'click', testID, accessibilityLabel,
}: GameButtonProps) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const c = disabled ? 'gray' : color;
  const pad = size === 'lg' ? 16 : size === 'sm' ? 7 : 11;
  const fs = size === 'lg' ? 22 : size === 'sm' ? 14 : 17;
  return (
    <Animated.View style={[anim, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: !!disabled }}
        onPressIn={() => (scale.value = withSpring(0.94, { damping: 15, stiffness: 400 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 300 }))}
        onPress={() => {
          if (disabled) {
            haptics.error();
            return;
          }
          if (sound === 'click') audio.play('click', 0.6);
          haptics.tap();
          onPress?.();
        }}
        style={{ opacity: disabled ? 0.75 : 1 }}
      >
        <View style={[styles.btnEdge, { backgroundColor: BTN_EDGE[c], borderRadius: R.md + 2 }]}>
          <LinearGradient colors={GRADIENTS[c]} style={[styles.btnFace, { paddingVertical: pad, borderRadius: R.md }]}>
            <View style={styles.btnGloss} />
            {children ?? (
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {icon ? <Text style={{ fontSize: fs }}>{icon}</Text> : null}
                  {title ? (
                    <Text style={{ fontFamily: FONT.display, fontSize: fs, color: BTN_TEXT[c], letterSpacing: 0.5, ...(c === 'gold' || c === 'green' ? {} : TEXT_SHADOW) }}>
                      {title}
                    </Text>
                  ) : null}
                </View>
                {subtitle ? <Text style={{ fontFamily: FONT.heavy, fontSize: 11, color: BTN_TEXT[c], opacity: 0.85 }}>{subtitle}</Text> : null}
              </View>
            )}
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({ icon, onPress, label, badge, size = 44 }: { icon: string; onPress: () => void; label: string; badge?: number | boolean; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        audio.play('click', 0.5);
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.92 : 1 }] }]}
    >
      <LinearGradient colors={GRADIENTS.panelLight} style={[styles.iconBtn, { width: size, height: size, borderRadius: size / 2.6 }]}>
        <Text style={{ fontSize: size * 0.48 }}>{icon}</Text>
      </LinearGradient>
      {badge ? (
        <View style={styles.badgeDot}>
          {typeof badge === 'number' ? <Text style={styles.badgeText}>{badge}</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

// ---------------- Panels ----------------

export function Panel({ children, style, colors, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; colors?: readonly [string, string, ...string[]]; padded?: boolean }) {
  return (
    <View style={[styles.panelOuter, style]}>
      <LinearGradient colors={colors ?? GRADIENTS.panel} style={[styles.panel, padded && { padding: S.lg }]}>
        <View style={styles.panelGloss} pointerEvents="none" />
        {children}
      </LinearGradient>
    </View>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <GText variant="h2">{children}</GText>
      {right}
    </View>
  );
}

// ---------------- Progress ----------------

export function ProgressBar({
  value, color = C.gold, height = 14, track = 'rgba(0,0,0,0.35)', label, animated = true,
}: { value: number; color?: string; height?: number; track?: string; label?: string; animated?: boolean }) {
  const w = useSharedValue(0);
  const v = Math.max(0, Math.min(1, value));
  useEffect(() => {
    w.value = animated ? withTiming(v, { duration: 450, easing: Easing.out(Easing.cubic) }) : v;
  }, [v, animated, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={[styles.barTrack, { height, borderRadius: height / 2, backgroundColor: track }]}>
      <Animated.View style={[{ height: '100%', borderRadius: height / 2, backgroundColor: color, overflow: 'hidden' }, fill]}>
        <View style={{ height: '45%', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: height / 2, marginHorizontal: 3, marginTop: 1 }} />
      </Animated.View>
      {label ? (
        <View style={StyleSheet.absoluteFill}>
          <Text style={[styles.barLabel, { lineHeight: height }]}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------- Currency ----------------

export function CurrencyPill({ icon, value, color = C.gold, onPress, testID }: { icon: string; value: number | string; color?: string; onPress?: () => void; testID?: string }) {
  const scale = useSharedValue(1);
  const prev = React.useRef(value);
  useEffect(() => {
    if (typeof value === 'number' && typeof prev.current === 'number' && value > prev.current + 0.5) {
      scale.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1));
    }
    prev.current = value;
  }, [value, scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={onPress} disabled={!onPress} testID={testID} accessibilityLabel={`${icon} ${value}`}>
      <Animated.View style={[styles.pill, anim]}>
        <Text style={{ fontSize: 15 }}>{icon}</Text>
        <Text style={[styles.pillText, { color }]}>{typeof value === 'number' ? formatNumber(value) : value}</Text>
        {onPress ? <View style={styles.pillPlus}><Text style={styles.pillPlusText}>+</Text></View> : null}
      </Animated.View>
    </Pressable>
  );
}

export function CurrencyBar() {
  const cash = useGame((g) => g.cash);
  const gems = useGame((g) => g.gems);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <CurrencyPill icon="💵" value={cash} color={C.goldLight} testID="cash-pill" />
      <CurrencyPill icon="💎" value={gems} color="#9FE6FF" onPress={() => router.push('/premium')} testID="gems-pill" />
    </View>
  );
}

// ---------------- Headers ----------------

export function ScreenHeader({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: React.ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <IconButton icon="◀" label="Back" size={40} onPress={() => (onBack ? onBack() : router.canGoBack() ? router.back() : router.replace('/'))} />
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <GText variant="h2" numberOfLines={1}>{title}</GText>
        {subtitle ? <GText variant="small" color={C.textDim} numberOfLines={1}>{subtitle}</GText> : null}
      </View>
      {right ?? <CurrencyBar />}
    </View>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={GRADIENTS.bg} style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
}

// ---------------- Misc ----------------

export function Badge({ text, color = C.purple, textColor = '#fff' }: { text: string; color?: string; textColor?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.badgeLabel, { color: textColor }]}>{text}</Text>
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              audio.play('click', 0.4);
              onChange(o.id);
            }}
            style={{ flex: 1 }}
          >
            {active ? (
              <LinearGradient colors={GRADIENTS.blue} style={styles.segmentItem}>
                <Text style={[styles.segmentText, { color: '#fff' }]} numberOfLines={1}>{o.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.segmentItem}>
                <Text style={[styles.segmentText, { color: C.textDim }]} numberOfLines={1}>{o.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Sheet({ visible, onClose, children, title }: { visible: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <LinearGradient colors={GRADIENTS.panelLight} style={StyleSheet.absoluteFill} />
          <View style={styles.sheetHandle} />
          {title ? <GText variant="title" style={{ textAlign: 'center', marginBottom: 10 }}>{title}</GText> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function StatRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <View style={styles.statRow}>
      <GText variant="small" color={C.textDim}>{icon ? `${icon}  ` : ''}{label}</GText>
      <GText variant="small">{value}</GText>
    </View>
  );
}

const styles = StyleSheet.create({
  btnEdge: { paddingBottom: 4 },
  btnFace: { paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  btnGloss: { position: 'absolute', top: 2, left: 6, right: 6, height: '42%', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)' },
  iconBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' },
  badgeDot: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: C.bg },
  badgeText: { color: '#fff', fontFamily: FONT.heavy, fontSize: 10 },
  panelOuter: { borderRadius: R.lg, borderWidth: 2, borderColor: C.panelBorder, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  panel: { borderRadius: R.lg - 2 },
  panelGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: 26, backgroundColor: 'rgba(255,255,255,0.05)' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm, marginTop: S.md },
  barTrack: { width: '100%', overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(0,0,0,0.35)' },
  barLabel: { textAlign: 'center', color: '#fff', fontFamily: FONT.heavy, fontSize: 10, ...TEXT_SHADOW },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(5,8,26,0.7)', borderRadius: R.pill, paddingLeft: 8, paddingRight: 10, paddingVertical: 5, borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' },
  pillText: { fontFamily: FONT.display, fontSize: 15, ...TEXT_SHADOW },
  pillPlus: { backgroundColor: C.green, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  pillPlusText: { color: '#063D1F', fontFamily: FONT.heavy, fontSize: 13, lineHeight: 15 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.lg, paddingBottom: S.md },
  badge: { borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeLabel: { fontFamily: FONT.heavy, fontSize: 10, letterSpacing: 0.5 },
  segment: { flexDirection: 'row', backgroundColor: 'rgba(5,8,26,0.6)', borderRadius: R.md, padding: 4, gap: 4 },
  segmentItem: { paddingVertical: 8, borderRadius: R.sm + 2, alignItems: 'center' },
  segmentText: { fontFamily: FONT.display, fontSize: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(3,5,18,0.7)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: S.lg, paddingTop: 10, maxHeight: '88%', borderWidth: 2, borderColor: C.panelBorder },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
});
