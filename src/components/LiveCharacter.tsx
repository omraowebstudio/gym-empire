import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Character, flexPose, idlePose } from './art/Character';
import { ITEM_MAP } from '@/game/config/items';
import { overallStrength, physiqueStage } from '@/game/systems/stats';
import { useGame } from '@/store/gameStore';
import type { Appearance } from '@/game/types';

/** The player's character with a gentle breathing/bounce idle animation. */
export function LiveCharacter({ size = 180, appearanceOverride, stageOverride, flex = false }: { size?: number; appearanceOverride?: Appearance; stageOverride?: number; flex?: boolean }) {
  const appearance = useGame((g) => g.profile.appearance);
  const strength = useGame((g) => overallStrength(g));
  const reduced = useGame((g) => g.settings.reducedMotion);
  const skins = useGame((g) => g.skins.barbell);
  const stage = stageOverride ?? physiqueStage(strength);
  const breathe = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      breathe.value = 0;
      return;
    }
    breathe.value = withRepeat(withSequence(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })), -1);
  }, [reduced, breathe]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -breathe.value * 3 }, { scaleY: 1 + breathe.value * 0.015 }, { scaleX: 1 - breathe.value * 0.006 }],
  }));
  return (
    <Animated.View style={style}>
      <Character
        appearance={appearanceOverride ?? appearance}
        stage={stage}
        size={size}
        pose={flex ? flexPose(stage) : idlePose(stage)}
        barbellColor={ITEM_MAP[skins]?.color}
      />
    </Animated.View>
  );
}
