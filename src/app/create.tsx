import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, R, S } from '@/theme';
import { GameButton, GText, Panel, Screen, ScreenHeader } from '@/components/ui';
import { CharacterEditor } from '@/components/CharacterEditor';
import { LiveCharacter } from '@/components/LiveCharacter';
import { completeOnboarding } from '@/game/systems/shop';
import { dispatch, useGame } from '@/store/gameStore';
import { audio } from '@/services/audio';
import type { Appearance } from '@/game/types';

const NAMES = ['Iron Mike', 'Swole Sam', 'Lift Queen', 'Big Ben', 'Atlas Jr', 'Ripped Rae', 'Max Rep', 'Gainz Gus'];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const initial = useGame((g) => g.profile.appearance);
  const inventory = useGame((g) => g.inventory);
  const [draft, setDraft] = useState<Appearance>(initial);
  const [name, setName] = useState('');
  const [personalized, setPersonalized] = useState(false);

  const finish = () => {
    const finalName = name.trim() || NAMES[Math.floor(Math.random() * NAMES.length)];
    const r = dispatch((d, ctx) => {
      d.settings.personalizedAds = personalized;
      d.settings.consentAsked = true;
      return completeOnboarding(d, ctx, finalName, draft);
    });
    if (r.ok) {
      audio.play('levelup');
      audio.startMusic();
      router.replace('/');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Create Your Lifter" subtitle="You can change your look any time" right={<View />} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24, gap: S.md }}>
        <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: S.md }}>
          <View style={styles.preview}>
            <LiveCharacter size={160} appearanceOverride={draft} stageOverride={0} />
            <GText variant="tiny" color={C.goldLight}>BEGINNER PHYSIQUE · TRAIN TO GROW!</GText>
          </View>
          <Panel>
            <GText variant="tiny" color={C.textDim}>LIFTER NAME</GText>
            <TextInput value={name} onChangeText={setName} maxLength={16} placeholder="Enter a name (or leave blank)" placeholderTextColor={C.textMuted} style={styles.input} accessibilityLabel="Lifter name" testID="name-input" />
          </Panel>
          <Panel>
            <CharacterEditor value={draft} onChange={setDraft} owns={(id) => inventory[id] !== undefined} />
          </Panel>
          <Panel>
            <GText variant="tiny" color={C.goldLight}>PRIVACY</GText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <GText variant="small" style={{ flex: 1 }}>Allow personalized ads? Gym Empire is free and shows optional ads. You can change this any time in Settings.</GText>
              <Switch value={personalized} onValueChange={setPersonalized} accessibilityLabel="Personalized ads" />
            </View>
            <Pressable onPress={() => router.push('/settings')}>
              <GText variant="tiny" color={C.blueLight} style={{ marginTop: 6 }}>Read the privacy summary in Settings ›</GText>
            </Pressable>
          </Panel>
          <GameButton title="OPEN MY GARAGE GYM" color="gold" size="lg" onPress={finish} testID="finish-create" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', backgroundColor: 'rgba(47,123,255,0.12)', borderRadius: R.xl, paddingVertical: 8, borderWidth: 2, borderColor: C.panelBorder },
  input: { fontFamily: FONT.display, fontSize: 20, color: '#fff', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: C.blue },
});
