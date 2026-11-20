import React, { useState } from 'react';
import { ScrollView, TextInput, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, R, S } from '@/theme';
import { GameButton, GText, Panel, Screen, ScreenHeader } from '@/components/ui';
import { CharacterEditor } from '@/components/CharacterEditor';
import { LiveCharacter } from '@/components/LiveCharacter';
import { setAppearance, setName } from '@/game/systems/shop';
import { dispatch, physiqueName, useGame } from '@/store/gameStore';
import { overallStrength, physiqueStage } from '@/game/systems/stats';
import { PHYSIQUE_STAGES } from '@/game/config/exercises';
import { audio } from '@/services/audio';

export default function CustomizeScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  const [draft, setDraft] = useState(game.profile.appearance);
  const [name, setNameDraft] = useState(game.profile.name);
  const stage = physiqueStage(overallStrength(game));
  const dirty = JSON.stringify(draft) !== JSON.stringify(game.profile.appearance) || name !== game.profile.name;

  const save = () => {
    const a = dispatch((d, ctx) => setAppearance(d, ctx, draft));
    const b = name !== game.profile.name ? dispatch((d, ctx) => setName(d, ctx, name)) : { ok: true };
    if (a.ok && b.ok) {
      audio.play('purchase');
      router.back();
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Customize Lifter" subtitle={`${physiqueName(stage)} physique`} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24, gap: S.md }}>
        <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: S.md }}>
          <View style={styles.preview}>
            <LiveCharacter size={170} appearanceOverride={draft} />
          </View>
          <Panel>
            <GText variant="tiny" color={C.textDim}>LIFTER NAME</GText>
            <TextInput value={name} onChangeText={setNameDraft} maxLength={16} style={styles.input} placeholder="Your name" placeholderTextColor={C.textMuted} accessibilityLabel="Lifter name" />
          </Panel>
          <Panel>
            <CharacterEditor value={draft} onChange={setDraft} owns={(id) => game.inventory[id] !== undefined} />
          </Panel>
          <Panel>
            <GText variant="tiny" color={C.goldLight}>PHYSIQUE JOURNEY</GText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {PHYSIQUE_STAGES.map((p, i) => (
                <View key={p.name} style={[styles.stage, i <= stage && { backgroundColor: C.purple, borderColor: C.purpleLight }]}>
                  <GText variant="tiny">{i + 1}. {p.name}</GText>
                  <GText variant="tiny" color={C.textDim}>{p.minStrength} STR</GText>
                </View>
              ))}
            </View>
            <GText variant="tiny" color={C.textMuted} style={{ marginTop: 6 }}>Your physique grows with in-game Overall Strength. No real-world exercise required.</GText>
          </Panel>
          <GameButton title="SAVE LOOK" color="green" size="lg" disabled={!dirty} onPress={save} testID="save-look" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', backgroundColor: 'rgba(47,123,255,0.12)', borderRadius: R.xl, paddingTop: 8, borderWidth: 2, borderColor: C.panelBorder },
  input: { fontFamily: FONT.display, fontSize: 20, color: '#fff', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: C.blue },
  stage: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 2, borderColor: C.panelBorder },
});
