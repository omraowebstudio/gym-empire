import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { GRADIENTS } from '@/theme';

const TIPS = [
  'Tip: Perfect reps give the biggest gains.',
  'Tip: Trainers boost your personal training XP.',
  'Tip: Managers let your gym earn longer while you are away.',
  'Tip: Decorations raise member satisfaction.',
  'Tip: The Weekly Championship is free once per week.',
];

/** Shown while fonts and the save file load. Uses system fonts on purpose (custom fonts may not be ready). */
export function LoadingScreen({ progress = 0.5 }: { progress?: number }) {
  const bounce = useSharedValue(0);
  const fill = useSharedValue(0);
  useEffect(() => {
    bounce.value = withRepeat(withSequence(withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) })), -1);
  }, [bounce]);
  useEffect(() => {
    fill.value = withTiming(progress, { duration: 400 });
  }, [progress, fill]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bounce.value * 14 }, { rotate: `${(bounce.value - 0.5) * 10}deg` }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${Math.max(0.05, fill.value) * 100}%` }));
  const tip = TIPS[Math.floor(Date.now() / 10000) % TIPS.length];
  return (
    <LinearGradient colors={GRADIENTS.hero} style={styles.root}>
      <Animated.Text style={[styles.icon, iconStyle]}>🏋️</Animated.Text>
      <Text style={styles.title}>GYM EMPIRE</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
      <Text style={styles.tip}>{tip}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 84 },
  title: { fontSize: 42, fontWeight: '900', color: '#FFC83D', letterSpacing: 2, marginTop: 12, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  track: { width: '80%', maxWidth: 320, height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)', marginTop: 28, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  fill: { height: '100%', backgroundColor: '#FFC83D', borderRadius: 8 },
  tip: { color: '#AEB7E0', marginTop: 16, fontWeight: '700', textAlign: 'center' },
});
