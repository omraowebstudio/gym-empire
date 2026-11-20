import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { C, S } from '@/theme';
import { Badge, GameButton, GText, Panel, Screen, ScreenHeader } from '@/components/ui';
import { EquipmentSprite } from '@/components/art/Equipment';
import { EQUIPMENT } from '@/game/config/equipment';
import { EXERCISE_MAP } from '@/game/config/exercises';
import { LOCATIONS, LOCATION_MAP } from '@/game/config/locations';
import { equipmentPrice } from '@/game/systems/gym';
import { buyEquipment } from '@/game/systems/gymActions';
import { dispatch, useGame } from '@/store/gameStore';
import { formatCash } from '@/game/utils/format';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';

export default function EquipmentShop() {
  const params = useLocalSearchParams<{ slot?: string }>();
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  const loc = game.locations[game.currentLocation]!;
  const tier = LOCATION_MAP[loc.id].tier;
  const emptySlots = Object.keys(loc.slots).filter((s) => !loc.slots[s]);
  const slot = params.slot && !loc.slots[params.slot] ? params.slot : emptySlots[0];

  return (
    <Screen>
      <ScreenHeader title="Equipment Shop" subtitle={`${LOCATION_MAP[loc.id].name} · ${emptySlots.length} free spot${emptySlots.length === 1 ? '' : 's'}`} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24, gap: S.md }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: S.md }}>
          {!slot ? (
            <Panel>
              <GText variant="body">Your gym floor is full! Upgrade existing equipment or expand to a bigger gym.</GText>
              <GameButton title="Expand empire" color="gold" size="sm" style={{ marginTop: 10 }} onPress={() => router.replace('/expansion')} />
            </Panel>
          ) : null}
          {EQUIPMENT.map((e) => {
            const locked = e.minLocationTier > tier;
            const price = equipmentPrice(loc, e.id);
            const afford = game.cash >= price;
            return (
              <Panel key={e.id} padded={false}>
                <View style={[styles.row, locked && { opacity: 0.55 }]}>
                  <View style={styles.thumb}>
                    <Svg width={84} height={74} viewBox="0 0 80 70"><EquipmentSprite id={e.id} /></Svg>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <GText variant="h2" style={{ fontSize: 16 }}>{e.name}</GText>
                    <GText variant="tiny" color={C.textDim}>{e.description}</GText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                      <Badge text={`🙋 ${e.capacity} members`} color={C.panel2} />
                      <Badge text={`✨ ${e.appeal} appeal`} color={C.panel2} />
                      {e.trainsExercise ? <Badge text={`💪 ${EXERCISE_MAP[e.trainsExercise].short} XP`} color={C.purpleDark} /> : null}
                    </View>
                  </View>
                  <GameButton
                    title={locked ? '🔒' : formatCash(price)}
                    subtitle={locked ? LOCATIONS[e.minLocationTier].name.split(' ')[0] : undefined}
                    color="green"
                    size="sm"
                    disabled={locked || !slot || !afford}
                    onPress={() => {
                      const r = dispatch((d, ctx) => buyEquipment(d, ctx, loc.id, slot!, e.id));
                      if (r.ok) {
                        audio.play('purchase');
                        haptics.success();
                        router.back();
                      }
                    }}
                    testID={`buy-${e.id}`}
                  />
                </View>
              </Panel>
            );
          })}
          <Text style={{ color: C.textMuted, fontSize: 11, textAlign: 'center' }}>Prices rise slightly with each item you own at this gym.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  thumb: { width: 84, height: 74, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
