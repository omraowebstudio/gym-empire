import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { C, FONT, GRADIENTS, R, S } from '@/theme';
import { Badge, CurrencyBar, GameButton, GText, Panel, ProgressBar, Screen, SectionTitle, Sheet, StatRow } from '@/components/ui';
import { GymScene } from '@/components/art/GymScene';
import { EquipmentSprite } from '@/components/art/Equipment';
import { ItemIcon } from '@/components/art/Items';
import { EQUIPMENT_MAP, FACILITIES } from '@/game/config/equipment';
import { EXERCISE_MAP } from '@/game/config/exercises';
import { ECONOMY } from '@/game/config/economy';
import { ITEMS, ITEM_MAP } from '@/game/config/items';
import { LOCATION_MAP, LOCATION_ORDER } from '@/game/config/locations';
import {
  equipmentCapacity,
  equipmentUpgradeCost,
  facilityUpgradeCost,
  incomeBreakdown,
  locationAppeal,
  locationCapacity,
  locationSatisfaction,
} from '@/game/systems/gym';
import { collectTips, moveEquipment, setDecoration, setTheme, switchLocation, upgradeEquipment, upgradeFacility } from '@/game/systems/gymActions';
import { dispatch, useGame, useGameStore } from '@/store/gameStore';
import { useNow } from '@/hooks/useNow';
import { formatCash } from '@/game/utils/format';
import { audio } from '@/services/audio';
import type { FacilityId } from '@/game/types';

export default function GymScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const now = useNow(1000);
  const game = useGame((g) => g);
  const loc = game.locations[game.currentLocation]!;
  const [selected, setSelected] = useState<string | null>(null);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [decoIndex, setDecoIndex] = useState<number | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const sceneW = Math.min(width - S.lg * 2, 560);
  const sat = locationSatisfaction(game, loc);
  const cap = locationCapacity(loc);
  const inc = incomeBreakdown(game, now).perLocation.find((p) => p.id === loc.id)?.gross ?? 0;
  const owned = LOCATION_ORDER.filter((id) => game.locations[id]);
  const placed = selected ? loc.slots[selected] : null;

  const onSlot = (slotId: string) => {
    if (moveFrom) {
      if (moveFrom !== slotId) {
        const r = dispatch((d, ctx) => moveEquipment(d, ctx, loc.id, moveFrom, slotId));
        if (r.ok) audio.play('whoosh');
      }
      setMoveFrom(null);
      return;
    }
    if (!loc.slots[slotId]) {
      router.push({ pathname: '/shop', params: { slot: slotId } });
      return;
    }
    setSelected(slotId);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: S.lg, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={styles.top}>
            <GText variant="title">My Gym</GText>
            <CurrencyBar />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {owned.map((id) => {
              const active = id === loc.id;
              return (
                <Pressable key={id} onPress={() => dispatch((d, ctx) => switchLocation(d, ctx, id))} accessibilityLabel={LOCATION_MAP[id].name}>
                  <View style={[styles.chip, active && { backgroundColor: C.blue, borderColor: C.blueLight }]}>
                    <Text style={styles.chipText}>{LOCATION_MAP[id].name}</Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable onPress={() => router.push('/expansion')} accessibilityLabel="Expand empire" testID="expand-button">
              <View style={[styles.chip, { backgroundColor: C.goldDark, borderColor: C.gold }]}>
                <Text style={styles.chipText}>＋ Expand</Text>
              </View>
            </Pressable>
          </ScrollView>

          {moveFrom ? (
            <Panel colors={GRADIENTS.gold} style={{ marginBottom: 8 }} padded={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 }}>
                <GText variant="small" color="#3A2A00" style={{ flex: 1 }}>Tap any slot to move the {EQUIPMENT_MAP[loc.slots[moveFrom]!.itemId].name} there.</GText>
                <GameButton title="Cancel" size="sm" color="gray" onPress={() => setMoveFrom(null)} />
              </View>
            </Panel>
          ) : null}

          <View style={styles.sceneWrap}>
            <GymScene location={loc} width={sceneW} editMode selectedSlot={moveFrom ?? selected} onSlotPress={onSlot} reducedMotion={game.settings.reducedMotion} barbellSkin={ITEM_MAP[game.skins.barbell]?.color} />
          </View>
          <GText variant="tiny" color={C.textMuted} style={{ textAlign: 'center', marginTop: 4 }}>Tap ＋ to buy equipment · tap equipment to upgrade or move it</GText>

          <View style={styles.statsRow}>
            <MiniStat icon="🙋" label="MEMBERS" value={`${loc.members.length}/${cap}`} />
            <MiniStat icon="😊" label="SATISFACTION" value={`${sat.total}%`} />
            <MiniStat icon="💵" label="INCOME" value={`${formatCash(inc)}/m`} />
            <MiniStat icon="✨" label="APPEAL" value={`${locationAppeal(loc)}`} />
          </View>

          <View style={styles.actions}>
            <ActionTile icon="🧑‍💼" label="Staff" onPress={() => router.push('/staff')} />
            <ActionTile icon="🙋" label="Members" onPress={() => router.push('/members')} />
            <ActionTile icon="🛒" label="Shop" onPress={() => router.push('/shop')} />
            <ActionTile icon="🏢" label="Expand" onPress={() => router.push('/expansion')} />
          </View>

          <Pressable
            onPress={() => {
              const amt = Math.floor(game.tipJar);
              if (dispatch((d, ctx) => collectTips(d, ctx)).ok) {
                audio.play('coin');
                useGameStore.getState().triggerCoinBurst(amt);
              }
            }}
            accessibilityLabel="Collect tip jar"
          >
            <Panel colors={game.tipJar >= 1 ? GRADIENTS.gold : GRADIENTS.panel} style={{ marginTop: S.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 30 }}>🫙</Text>
                <View style={{ flex: 1 }}>
                  <GText variant="h2" color={game.tipJar >= 1 ? '#3A2A00' : '#fff'} style={{ fontSize: 16 }}>Tip Jar: {formatCash(game.tipJar)}</GText>
                  <GText variant="tiny" color={game.tipJar >= 1 ? '#3A2A00' : C.textDim}>Members tip while you play. Holds up to {ECONOMY.gym.tipJarCapMinutes} min of income.</GText>
                </View>
                <GText variant="h2" color={game.tipJar >= 1 ? '#3A2A00' : C.textMuted}>{game.tipJar >= 1 ? 'TAP' : '…'}</GText>
              </View>
            </Panel>
          </Pressable>

          <SectionTitle>Facilities</SectionTitle>
          <View style={{ gap: 8 }}>
            {FACILITIES.map((f) => {
              const lvl = loc.facilities[f.id as FacilityId];
              const maxed = lvl >= ECONOMY.gym.facilityMaxLevel;
              const cost = facilityUpgradeCost(loc, f.id);
              return (
                <Panel key={f.id} padded={false}>
                  <View style={styles.facRow}>
                    <Text style={{ fontSize: 26 }}>{f.id === 'flooring' ? '🟫' : f.id === 'lighting' ? '💡' : f.id === 'mirrors' ? '🪞' : '🛎️'}</Text>
                    <View style={{ flex: 1 }}>
                      <GText variant="body">{f.name} <Text style={{ color: C.goldLight }}>Lv {lvl}</Text></GText>
                      <GText variant="tiny" color={C.textDim}>{f.description} +{ECONOMY.gym.satisfactionPerFacilityLevel[f.id as FacilityId]}% satisfaction / level</GText>
                      <ProgressBar value={lvl / ECONOMY.gym.facilityMaxLevel} height={8} color={C.blueLight} />
                    </View>
                    <GameButton
                      title={maxed ? 'MAX' : formatCash(cost)}
                      color="gold"
                      size="sm"
                      disabled={maxed || game.cash < cost}
                      onPress={() => dispatch((d, ctx) => upgradeFacility(d, ctx, loc.id, f.id)).ok && audio.play('upgrade')}
                      testID={`facility-${f.id}`}
                    />
                  </View>
                </Panel>
              );
            })}
          </View>

          <SectionTitle right={<Pressable onPress={() => router.push('/collect')}><GText variant="tiny" color={C.blueLight}>COLLECTION ›</GText></Pressable>}>Decorate</SectionTitle>
          <Panel>
            <GText variant="tiny" color={C.textDim}>Decorations add satisfaction by rarity (common +1 … legendary +5). Decoration bonus here: +{sat.decorations}%</GText>
            <View style={styles.decoRow}>
              {loc.decorations.map((d, i) => (
                <Pressable key={i} onPress={() => setDecoIndex(i)} style={styles.decoSlot} accessibilityLabel={`Decoration spot ${i + 1}`}>
                  {d ? <ItemIcon itemId={d} size={54} /> : <Text style={{ fontSize: 24, color: C.textMuted }}>＋</Text>}
                </Pressable>
              ))}
              <Pressable onPress={() => setThemeOpen(true)} style={[styles.decoSlot, { borderColor: C.purpleLight }]} accessibilityLabel="Gym theme">
                {loc.theme ? <ItemIcon itemId={loc.theme} size={54} /> : <Text style={{ fontSize: 22 }}>🎨</Text>}
              </Pressable>
            </View>
          </Panel>
        </View>
      </ScrollView>

      {/* Equipment details */}
      <Sheet visible={!!placed} onClose={() => setSelected(null)} title={placed ? EQUIPMENT_MAP[placed.itemId].name : ''}>
        {placed && selected ? (
          <View style={{ gap: 10 }}>
            <View style={{ alignItems: 'center' }}>
              <Svg width={160} height={140} viewBox="0 0 80 70">
                <EquipmentSprite id={placed.itemId} level={placed.level} skin={ITEM_MAP[game.skins.barbell]?.color} />
              </Svg>
              <Badge text={`LEVEL ${placed.level}/${ECONOMY.gym.maxEquipmentLevel}`} color={C.purple} />
            </View>
            <GText variant="small" color={C.textDim} style={{ textAlign: 'center' }}>{EQUIPMENT_MAP[placed.itemId].description}</GText>
            <View>
              <StatRow icon="🙋" label="Capacity" value={`${loc.members.filter((m) => m.slotId === selected).length}/${equipmentCapacity(placed)} members`} />
              <StatRow icon="💎" label="Member fee bonus" value={`+${Math.round(ECONOMY.gym.equipmentQualityPerLevel * (placed.level - 1) * 100)}%`} />
              {EQUIPMENT_MAP[placed.itemId].trainsExercise ? (
                <StatRow icon="💪" label={`${EXERCISE_MAP[EQUIPMENT_MAP[placed.itemId].trainsExercise!].name} training`} value={`+${placed.level * 2}% XP`} />
              ) : null}
              {placed.level < ECONOMY.gym.maxEquipmentLevel ? <StatRow icon="⬆️" label="Next level" value={`+${Math.round(ECONOMY.gym.equipmentQualityPerLevel * 100)}% fees${(placed.level) % ECONOMY.gym.capacityPerLevels === 0 ? ', +1 capacity' : ''}`} /> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <GameButton title="Move" icon="↔️" color="gray" style={{ flex: 1 }} onPress={() => { setMoveFrom(selected); setSelected(null); }} />
              <GameButton
                title={placed.level >= ECONOMY.gym.maxEquipmentLevel ? 'MAXED' : `Upgrade ${formatCash(equipmentUpgradeCost(loc, placed))}`}
                color="gold"
                style={{ flex: 2 }}
                disabled={placed.level >= ECONOMY.gym.maxEquipmentLevel || game.cash < equipmentUpgradeCost(loc, placed)}
                onPress={() => dispatch((d, ctx) => upgradeEquipment(d, ctx, loc.id, selected)).ok && audio.play('upgrade')}
                testID="upgrade-equipment"
              />
            </View>
          </View>
        ) : null}
      </Sheet>

      {/* Decoration picker */}
      <Sheet visible={decoIndex !== null} onClose={() => setDecoIndex(null)} title="Choose decoration">
        <ScrollView contentContainerStyle={styles.pickGrid}>
          <Pressable style={styles.pickItem} onPress={() => { dispatch((d, ctx) => setDecoration(d, ctx, loc.id, decoIndex!, null)); setDecoIndex(null); }}>
            <Text style={{ fontSize: 28 }}>🚫</Text>
            <GText variant="tiny">EMPTY</GText>
          </Pressable>
          {ITEMS.filter((i) => i.category === 'decoration').map((i) => {
            const own = game.inventory[i.id] !== undefined;
            return (
              <Pressable key={i.id} style={styles.pickItem} disabled={!own} onPress={() => { dispatch((d, ctx) => setDecoration(d, ctx, loc.id, decoIndex!, i.id)); audio.play('purchase'); setDecoIndex(null); }}>
                <ItemIcon itemId={i.id} size={56} locked={!own} />
                <GText variant="tiny" numberOfLines={1} color={own ? '#fff' : C.textMuted}>{i.name}</GText>
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>

      {/* Theme picker */}
      <Sheet visible={themeOpen} onClose={() => setThemeOpen(false)} title="Gym theme">
        <ScrollView contentContainerStyle={styles.pickGrid}>
          <Pressable style={styles.pickItem} onPress={() => { dispatch((d, ctx) => setTheme(d, ctx, loc.id, null)); setThemeOpen(false); }}>
            <Text style={{ fontSize: 28 }}>🏠</Text>
            <GText variant="tiny">DEFAULT</GText>
          </Pressable>
          {ITEMS.filter((i) => i.category === 'theme').map((i) => {
            const own = game.inventory[i.id] !== undefined;
            return (
              <Pressable key={i.id} style={styles.pickItem} disabled={!own} onPress={() => { dispatch((d, ctx) => setTheme(d, ctx, loc.id, i.id)); audio.play('purchase'); setThemeOpen(false); }}>
                <ItemIcon itemId={i.id} size={56} locked={!own} />
                <GText variant="tiny" numberOfLines={1} color={own ? '#fff' : C.textMuted}>{i.name}</GText>
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.mini}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={styles.miniValue} numberOfLines={1}>{value}</Text>
      <GText variant="tiny" color={C.textDim} style={{ fontSize: 9 }}>{label}</GText>
    </View>
  );
}

function ActionTile({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <GameButton color="purple" size="sm" style={{ flex: 1 }} onPress={onPress} accessibilityLabel={label}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
        <Text style={{ fontFamily: FONT.display, color: '#fff', fontSize: 13 }}>{label}</Text>
      </View>
    </GameButton>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, backgroundColor: C.panel, borderWidth: 2, borderColor: C.panelBorder },
  chipText: { fontFamily: FONT.display, color: '#fff', fontSize: 13 },
  sceneWrap: { borderRadius: R.xl, overflow: 'hidden', borderWidth: 3, borderColor: C.panelBorder, alignSelf: 'center' },
  statsRow: { flexDirection: 'row', gap: 6, marginTop: S.md },
  mini: { flex: 1, alignItems: 'center', backgroundColor: C.panel, borderRadius: R.md, paddingVertical: 8, borderWidth: 2, borderColor: C.panelBorder },
  miniValue: { fontFamily: FONT.display, color: '#fff', fontSize: 15 },
  actions: { flexDirection: 'row', gap: 6, marginTop: S.md },
  facRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  decoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  decoSlot: { width: 62, height: 62, borderRadius: 14, borderWidth: 2, borderColor: C.panelBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingBottom: 10 },
  pickItem: { width: 84, alignItems: 'center', gap: 2 },
});
