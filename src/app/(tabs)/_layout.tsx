import React from 'react';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { GameTabBar } from '@/components/TabBar';
import { useGame } from '@/store/gameStore';
import { C } from '@/theme';

export default function TabLayout() {
  const onboarded = useGame((g) => g.profile.onboarded);
  if (!onboarded) return <Redirect href="/welcome" />;
  return (
    <Tabs
      tabBar={(props) => <GameTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg }, animation: 'shift' }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="train" />
      <Tabs.Screen name="gym" />
      <Tabs.Screen name="compete" />
      <Tabs.Screen name="collect" />
    </Tabs>
  );
}
