import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, GRADIENTS, S, TEXT_SHADOW } from '@/theme';
import { GameButton, GText } from '@/components/ui';
import { Character, flexPose } from '@/components/art/Character';
import { GymScene } from '@/components/art/GymScene';
import { createLocationState } from '@/game/state';
import { useGame } from '@/store/gameStore';
import { audio } from '@/services/audio';

const demoGym = (() => {
  const l = createLocationState('commercial');
  l.slots.s0 = { itemId: 'squat_rack', level: 6 };
  l.slots.s1 = { itemId: 'flat_bench', level: 4 };
  l.slots.s2 = { itemId: 'cable_machine', level: 10 };
  l.slots.s3 = { itemId: 'dumbbell_rack', level: 3 };
  l.slots.s5 = { itemId: 'treadmill', level: 2 };
  l.slots.s6 = { itemId: 'leg_press', level: 5 };
  l.facilities = { flooring: 5, lighting: 8, mirrors: 6, reception: 3 };
  l.members = [0, 1, 2, 3, 4, 5].map((i) => ({ id: `d${i}`, name: '', seed: 1000 + i * 977, tier: (['basic', 'plus', 'vip'] as const)[i % 3], satisfactionOffset: 0, slotId: ['s0', 's1', 's2', 's3', 's5', 's6'][i], joinedAt: 0 }));
  return l;
})();

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const onboarded = useGame((g) => g.profile.onboarded);
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) })), -1);
  }, [bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 8 }] }));
  if (onboarded) return <Redirect href="/" />;
  const w = Math.min(width, 520);
  return (
    <LinearGradient colors={GRADIENTS.hero} style={{ flex: 1, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20, alignItems: 'center' }}>
      <View style={{ width: w, flex: 1, alignItems: 'center', paddingHorizontal: S.lg }}>
        <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center' }}>
          <Text style={styles.logoTop}>GYM</Text>
          <Text style={styles.logo}>EMPIRE</Text>
          <GText variant="small" color={C.textDim}>Lift. Build. Dominate.</GText>
        </Animated.View>
        <View style={{ width: w - 32, marginTop: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 3, borderColor: C.gold }}>
          <GymScene location={demoGym} width={w - 32} showSign={false} />
          <Animated.View style={[{ position: 'absolute', bottom: -8, alignSelf: 'center' }, bobStyle]}>
            <Character
              appearance={{ skin: 2, hair: 'spiky', hairColor: 0, shirt: 'shirt_tank_white', shorts: 'shorts_navy', shoes: 'shoes_white', accessory: 'acc_none' }}
              stage={4}
              size={(w - 32) * 0.36}
              pose={flexPose(4)}
            />
          </Animated.View>
        </View>
        <Animated.View entering={FadeInUp.delay(250)} style={{ marginTop: 18, gap: 6, alignSelf: 'stretch' }}>
          <Feature icon="💪" text="Train your lifter with skill-based mini-games" />
          <Feature icon="🏋️" text="Build your gym from a garage to a global empire" />
          <Feature icon="🏆" text="Compete, collect trophies and climb the ranks" />
        </Animated.View>
        <View style={{ flex: 1 }} />
        <GameButton
          title="START YOUR EMPIRE"
          color="gold"
          size="lg"
          style={{ alignSelf: 'stretch' }}
          onPress={() => {
            audio.startMusic();
            router.push('/create');
          }}
          testID="start-empire"
        />
        <GText variant="tiny" color={C.textMuted} style={{ marginTop: 8, textAlign: 'center' }}>
          All lifting stats are fictional. No real-world exercise required.
        </GText>
      </View>
    </LinearGradient>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <GText variant="small" style={{ flex: 1 }}>{text}</GText>
    </View>
  );
}

const styles = StyleSheet.create({
  logoTop: { fontFamily: FONT.display, fontSize: 30, color: '#fff', letterSpacing: 6, marginBottom: -12, ...TEXT_SHADOW },
  logo: { fontFamily: FONT.display, fontSize: 58, color: C.gold, letterSpacing: 2, textShadowColor: '#7A4A00', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 0 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
});
