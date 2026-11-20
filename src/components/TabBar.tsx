import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { C, FONT, GRADIENTS, TEXT_SHADOW } from '@/theme';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useGame } from '@/store/gameStore';
import { canClaimDaily, missionBonusAvailable } from '@/game/systems/retention';

const TABS: Record<string, { label: string; icon: string }> = {
  index: { label: 'HOME', icon: '🏠' },
  train: { label: 'TRAIN', icon: '💪' },
  gym: { label: 'GYM', icon: '🏋️' },
  compete: { label: 'COMPETE', icon: '🏆' },
  collect: { label: 'COLLECT', icon: '🎒' },
};

function TabItem({ name, focused, onPress, badge }: { name: string; focused: boolean; onPress: () => void; badge: boolean }) {
  const t = TABS[name] ?? { label: name, icon: '•' };
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: withSpring(focused ? -10 : 0, { damping: 12 }) }, { scale: withSpring(focused ? 1.12 : 1) }] }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={t.label}
      testID={`tab-${name}`}
      onPress={() => {
        audio.play('click', 0.5);
        haptics.tap();
        onPress();
      }}
      style={styles.item}
    >
      <Animated.View style={[styles.iconWrap, anim]}>
        {focused ? (
          <LinearGradient colors={GRADIENTS.blue} style={styles.iconBubble}>
            <Text style={styles.icon}>{t.icon}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.iconBubble, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.icon, { opacity: 0.75 }]}>{t.icon}</Text>
          </View>
        )}
        {badge ? <View style={styles.badge} /> : null}
      </Animated.View>
      <Text style={[styles.label, { color: focused ? C.goldLight : C.textMuted }]}>{t.label}</Text>
    </Pressable>
  );
}

export function GameTabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const homeBadge = useGame((g) => canClaimDaily(g, Date.now()) || g.missions.missions.some((m) => !m.claimed && m.progress >= m.target) || missionBonusAvailable(g));
  const collectBadge = useGame((g) => Object.values(g.achievements).some((a) => !a.claimed));
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <LinearGradient colors={['#1F2766', '#10163D']} style={StyleSheet.absoluteFill} />
      <View style={styles.topEdge} />
      {state.routes.map((r, i) => (
        <TabItem
          key={r.key}
          name={r.name}
          focused={state.index === i}
          onPress={() => navigateToTab(r.key)}
          badge={(r.name === 'index' && homeBadge) || (r.name === 'collect' && collectBadge)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', borderWidth: 2, borderBottomWidth: 0, borderColor: C.panelBorder },
  topEdge: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  item: { flex: 1, alignItems: 'center' },
  iconWrap: { alignItems: 'center' },
  iconBubble: { width: 46, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  label: { fontFamily: FONT.display, fontSize: 11, marginTop: -4, letterSpacing: 0.5, ...TEXT_SHADOW },
  badge: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: C.red, borderWidth: 2, borderColor: '#10163D' },
});
