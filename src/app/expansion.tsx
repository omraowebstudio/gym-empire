import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S } from '@/theme';
import { Badge, GameButton, GText, ProgressBar, Screen, ScreenHeader } from '@/components/ui';
import { LOCATIONS } from '@/game/config/locations';
import { canUnlockLocation, switchLocation, unlockLocation } from '@/game/systems/gymActions';
import { dispatch, useGame } from '@/store/gameStore';
import { formatCash } from '@/game/utils/format';
import { audio } from '@/services/audio';

export default function ExpansionScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  return (
    <Screen>
      <ScreenHeader title="Gym Expansion" subtitle={`${Object.keys(game.locations).length} of ${LOCATIONS.length} locations owned`} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          {LOCATIONS.map((l, i) => {
            const owned = !!game.locations[l.id];
            const err = canUnlockLocation(game, l.id);
            const prevOwned = i === 0 || !!game.locations[LOCATIONS[i - 1].id];
            const levelOk = game.level >= l.unlockLevel;
            return (
              <View key={l.id} style={{ flexDirection: 'row' }}>
                <View style={styles.path}>
                  <View style={[styles.node, { backgroundColor: owned ? C.green : prevOwned ? C.gold : C.panel2 }]}><Text style={styles.nodeText}>{i + 1}</Text></View>
                  {i < LOCATIONS.length - 1 ? <View style={[styles.line, { backgroundColor: owned ? C.green : C.panel2 }]} /> : null}
                </View>
                <LinearGradient colors={[l.theme.wallTop, l.theme.wallBottom]} style={[styles.card, { borderColor: owned ? C.green : l.theme.accent, opacity: prevOwned || owned ? 1 : 0.6 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <GText variant="h2" style={{ fontSize: 17, flex: 1 }}>{l.name}</GText>
                    {owned ? <Badge text="OWNED" color={C.green} textColor="#063D1F" /> : null}
                  </View>
                  <GText variant="tiny" color="rgba(255,255,255,0.8)">📍 {l.city} · {l.slotCount} equipment spots · income ×{l.incomeMult}</GText>
                  <GText variant="small" color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }}>{l.description}</GText>
                  {owned ? (
                    <GameButton title={game.currentLocation === l.id ? 'CURRENT GYM' : 'VISIT'} color="blue" size="sm" style={{ marginTop: 8 }} disabled={game.currentLocation === l.id} onPress={() => { dispatch((d, ctx) => switchLocation(d, ctx, l.id)); router.navigate('/gym'); }} />
                  ) : (
                    <View style={{ marginTop: 8, gap: 6 }}>
                      <GText variant="tiny" color={levelOk ? C.green : C.goldLight}>{levelOk ? '✓' : '🔒'} Player level {l.unlockLevel} (you: {game.level})</GText>
                      <ProgressBar value={game.cash / Math.max(1, l.unlockCost)} height={12} label={`${formatCash(game.cash)} / ${formatCash(l.unlockCost)}`} />
                      <GameButton
                        title={err === null ? `OPEN FOR ${formatCash(l.unlockCost)}` : err}
                        color={err === null ? 'gold' : 'gray'}
                        size="sm"
                        disabled={err !== null}
                        onPress={() => {
                          if (dispatch((d, ctx) => unlockLocation(d, ctx, l.id)).ok) {
                            audio.play('levelup');
                            router.navigate('/gym');
                          }
                        }}
                        testID={`unlock-${l.id}`}
                      />
                    </View>
                  )}
                </LinearGradient>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  path: { width: 34, alignItems: 'center' },
  node: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', marginTop: 14 },
  nodeText: { color: '#111', fontWeight: '900' },
  line: { width: 4, flex: 1, marginVertical: 2 },
  card: { flex: 1, borderRadius: R.lg, padding: S.md, marginBottom: S.md, borderWidth: 2 },
});
