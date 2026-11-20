import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, R, S } from '@/theme';
import { Badge, CurrencyBar, GameButton, GText, Panel, ProgressBar, Screen, Sheet } from '@/components/ui';
import { ItemIcon } from '@/components/art/Items';
import { Character, idlePose } from '@/components/art/Character';
import { CATEGORY_INFO, ITEMS, RARITY_INFO, type ItemDef } from '@/game/config/items';
import { unlockText } from '@/game/systems/collectionText';
import { buyItemWithGems } from '@/game/systems/retention';
import { equipSkin, setAppearance } from '@/game/systems/shop';
import { setTheme } from '@/game/systems/gymActions';
import { overallStrength, physiqueStage } from '@/game/systems/stats';
import { dispatch, useGame } from '@/store/gameStore';
import { audio } from '@/services/audio';
import type { ItemCategory } from '@/game/types';

const CATS: ('all' | ItemCategory)[] = ['all', 'shirt', 'shorts', 'shoes', 'accessory', 'barbell', 'dumbbell', 'decoration', 'theme', 'trophy'];

export default function CollectScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  const [cat, setCat] = useState<'all' | ItemCategory>('all');
  const [preview, setPreview] = useState<ItemDef | null>(null);
  const items = useMemo(
    () => ITEMS.filter((i) => cat === 'all' || i.category === cat).sort((a, b) => RARITY_INFO[a.rarity].order - RARITY_INFO[b.rarity].order),
    [cat],
  );
  const ownedCount = ITEMS.filter((i) => game.inventory[i.id] !== undefined).length;
  const achUnclaimed = Object.values(game.achievements).filter((a) => !a.claimed).length;
  const stage = physiqueStage(overallStrength(game));

  const equip = (item: ItemDef) => {
    let r;
    if (['shirt', 'shorts', 'shoes', 'accessory'].includes(item.category)) {
      r = dispatch((d, ctx) => setAppearance(d, ctx, { [item.category]: item.id }));
    } else if (item.category === 'barbell' || item.category === 'dumbbell') {
      r = dispatch((d, ctx) => equipSkin(d, ctx, item.id));
    } else if (item.category === 'theme') {
      r = dispatch((d, ctx) => setTheme(d, ctx, d.currentLocation, item.id));
    } else if (item.category === 'decoration') {
      router.push('/gym');
      setPreview(null);
      return;
    }
    if (r?.ok) {
      audio.play('purchase');
      setPreview(null);
    }
  };

  const isEquipped = (item: ItemDef) =>
    game.profile.appearance.shirt === item.id || game.profile.appearance.shorts === item.id || game.profile.appearance.shoes === item.id ||
    game.profile.appearance.accessory === item.id || game.skins.barbell === item.id || game.skins.dumbbell === item.id ||
    game.locations[game.currentLocation]?.theme === item.id;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: S.lg, paddingBottom: 30 }} showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        <View style={styles.top}>
          <GText variant="title">Collection</GText>
          <CurrencyBar />
        </View>
        <View style={{ gap: S.sm, marginBottom: S.sm }}>
          <Panel>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <GText variant="h2" style={{ fontSize: 17 }}>Collection Book</GText>
              <GText variant="number" color={C.goldLight}>{ownedCount}/{ITEMS.length}</GText>
            </View>
            <ProgressBar value={ownedCount / ITEMS.length} />
            <View style={styles.rarityRow}>
              {(['common', 'rare', 'epic', 'legendary'] as const).map((r) => {
                const all = ITEMS.filter((i) => i.rarity === r);
                const own = all.filter((i) => game.inventory[i.id] !== undefined).length;
                return <Badge key={r} text={`${RARITY_INFO[r].label} ${own}/${all.length}`} color={RARITY_INFO[r].color} textColor="#111" />;
              })}
            </View>
          </Panel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <GameButton title="Achievements" subtitle={achUnclaimed ? `${achUnclaimed} to claim!` : undefined} icon="🏅" color={achUnclaimed ? 'gold' : 'purple'} size="sm" style={{ flex: 1 }} onPress={() => router.push('/achievements')} testID="open-achievements" />
            <GameButton title="Customize" icon="👕" color="blue" size="sm" style={{ flex: 1 }} onPress={() => router.push('/customize')} />
          </View>
        </View>
        <View style={{ backgroundColor: C.bg, paddingVertical: 6 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {CATS.map((c) => (
              <Pressable key={c} onPress={() => setCat(c)} accessibilityLabel={c}>
                <View style={[styles.chip, cat === c && { backgroundColor: C.blue, borderColor: C.blueLight }]}>
                  <Text style={styles.chipText}>{c === 'all' ? '⭐ All' : `${CATEGORY_INFO[c].icon} ${CATEGORY_INFO[c].label}`}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View style={styles.grid}>
          {items.map((i) => {
            const own = game.inventory[i.id] !== undefined;
            return (
              <Pressable key={i.id} style={styles.cell} onPress={() => setPreview(i)} accessibilityLabel={`${i.name}${own ? '' : ' locked'}`}>
                <ItemIcon itemId={i.id} size={72} locked={!own} />
                <Text style={[styles.cellText, { color: own ? '#fff' : C.textMuted }]} numberOfLines={1}>{i.name}</Text>
                {own && isEquipped(i) ? <View style={styles.equipped}><Text style={styles.equippedText}>✓</Text></View> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Sheet visible={!!preview} onClose={() => setPreview(null)}>
        {preview ? (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Badge text={RARITY_INFO[preview.rarity].label} color={RARITY_INFO[preview.rarity].color} textColor="#111" />
            <GText variant="title" style={{ textAlign: 'center' }}>{preview.name}</GText>
            {['shirt', 'shorts', 'shoes', 'accessory'].includes(preview.category) ? (
              <Character appearance={{ ...game.profile.appearance, [preview.category]: preview.id }} stage={stage} size={130} pose={idlePose(stage)} />
            ) : (
              <ItemIcon itemId={preview.id} size={140} locked={false} />
            )}
            <GText variant="small" color={C.textDim}>{CATEGORY_INFO[preview.category].label}</GText>
            {preview.description ? <GText variant="small" color={C.textDim}>{preview.description}</GText> : null}
            {game.inventory[preview.id] !== undefined ? (
              preview.category === 'trophy' ? (
                <GText variant="body" color={C.goldLight}>🏆 Earned! Displayed in your trophy case.</GText>
              ) : (
                <GameButton title={isEquipped(preview) ? 'EQUIPPED' : preview.category === 'decoration' ? 'PLACE IN GYM' : 'EQUIP'} color="green" disabled={isEquipped(preview)} onPress={() => equip(preview)} style={{ alignSelf: 'stretch' }} testID="equip-item" />
              )
            ) : (
              <>
                <Panel style={{ alignSelf: 'stretch' }}>
                  <GText variant="tiny" color={C.goldLight}>HOW TO UNLOCK</GText>
                  <GText variant="body">🔒 {unlockText(preview.unlock)}</GText>
                </Panel>
                {preview.unlock.kind === 'gems' ? (
                  <GameButton
                    title={`Buy for ${preview.unlock.cost} 💎`}
                    color="blue"
                    disabled={game.gems < preview.unlock.cost}
                    onPress={() => {
                      if (dispatch((d, ctx) => buyItemWithGems(d, ctx, preview.id)).ok) audio.play('purchase');
                    }}
                    style={{ alignSelf: 'stretch' }}
                    testID="buy-item-gems"
                  />
                ) : null}
                {preview.unlock.kind === 'iap' ? <GameButton title="View in Shop" color="purple" onPress={() => { setPreview(null); router.push('/premium'); }} style={{ alignSelf: 'stretch' }} /> : null}
              </>
            )}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}


const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  rarityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, backgroundColor: C.panel, borderWidth: 2, borderColor: C.panelBorder },
  chipText: { fontFamily: FONT.display, color: '#fff', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 },
  cell: { width: 84, alignItems: 'center', gap: 3 },
  cellText: { fontFamily: FONT.body, fontSize: 10, textAlign: 'center' },
  equipped: { position: 'absolute', top: -4, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  equippedText: { color: '#063D1F', fontFamily: FONT.heavy, fontSize: 11 },
});
