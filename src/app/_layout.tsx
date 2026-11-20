import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGameStore } from '@/store/gameStore';
import { LoadingScreen } from '@/components/LoadingScreen';
import { GameRuntime } from '@/components/GameRuntime';
import { CelebrationHost, CoinBurstHost, MockAdHost, MockStoreHost, OfflineEarningsModal, ToastHost } from '@/components/overlays';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LilitaOne: require('@expo-google-fonts/lilita-one/400Regular/LilitaOne_400Regular.ttf'),
    'Nunito-Bold': require('@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf'),
    'Nunito-Black': require('@expo-google-fonts/nunito/900Black/Nunito_900Black.ttf'),
  });
  const hydrated = useGameStore((s) => s.hydrated);
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    useGameStore.getState().hydrate();
    SplashScreen.hideAsync().catch(() => {});
    const id = setTimeout(() => setMinTimeDone(true), 900);
    return () => clearTimeout(id);
  }, []);

  const ready = (fontsLoaded || !!fontError) && hydrated && minTimeDone;
  if (!ready) return <LoadingScreen progress={(fontsLoaded ? 0.5 : 0.2) + (hydrated ? 0.4 : 0)} />;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar style="light" />
        <GameRuntime />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="create" options={{ animation: 'fade' }} />
          <Stack.Screen name="training/[id]" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="competition" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
        </Stack>
        <OfflineEarningsModal />
        <CelebrationHost />
        <CoinBurstHost />
        <ToastHost />
        <MockAdHost />
        <MockStoreHost />
      </View>
    </SafeAreaProvider>
  );
}
