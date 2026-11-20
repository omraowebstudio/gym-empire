import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, FONT, R } from '@/theme';
import { GText, Segmented } from './ui';
import { ItemIcon } from './art/Items';
import { HAIR_COLORS, HAIR_STYLES, ITEMS, SKIN_TONES } from '@/game/config/items';
import { unlockText } from '@/game/systems/collectionText';
import type { Appearance } from '@/game/types';
import { audio } from '@/services/audio';

type Tab = 'body' | 'shirt' | 'shorts' | 'shoes' | 'accessory';

export function CharacterEditor({ value, onChange, owns }: { value: Appearance; onChange: (a: Appearance) => void; owns: (itemId: string) => boolean }) {
  const [tab, setTab] = useState<Tab>('body');
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const set = (patch: Partial<Appearance>) => {
    audio.play('click', 0.4);
    setLockedMsg(null);
    onChange({ ...value, ...patch });
  };
  return (
    <View style={{ gap: 10 }}>
      <Segmented
        value={tab}
        onChange={(t) => { setTab(t); setLockedMsg(null); }}
        options={[
          { id: 'body', label: 'Body' },
          { id: 'shirt', label: 'Shirt' },
          { id: 'shorts', label: 'Shorts' },
          { id: 'shoes', label: 'Shoes' },
          { id: 'accessory', label: 'Extra' },
        ]}
      />
      {tab === 'body' ? (
        <View style={{ gap: 10 }}>
          <GText variant="tiny" color={C.textDim}>SKIN TONE</GText>
          <View style={styles.row}>
            {SKIN_TONES.map((c, i) => (
              <Pressable key={c} onPress={() => set({ skin: i })} accessibilityLabel={`Skin tone ${i + 1}`} style={[styles.swatch, { backgroundColor: c }, value.skin === i && styles.sel]} />
            ))}
          </View>
          <GText variant="tiny" color={C.textDim}>HAIRSTYLE</GText>
          <View style={styles.row}>
            {HAIR_STYLES.map((h) => (
              <Pressable key={h.id} onPress={() => set({ hair: h.id })} style={[styles.pill, value.hair === h.id && styles.pillSel]} accessibilityLabel={h.name}>
                <Text style={styles.pillText}>{h.name}</Text>
              </Pressable>
            ))}
          </View>
          <GText variant="tiny" color={C.textDim}>HAIR COLOUR</GText>
          <View style={styles.row}>
            {HAIR_COLORS.map((c, i) => (
              <Pressable key={c} onPress={() => set({ hairColor: i })} accessibilityLabel={`Hair colour ${i + 1}`} style={[styles.swatch, { backgroundColor: c }, value.hairColor === i && styles.sel]} />
            ))}
          </View>
        </View>
      ) : (
        <ScrollView horizontal={false} contentContainerStyle={styles.grid}>
          {ITEMS.filter((i) => i.category === tab).map((i) => {
            const own = owns(i.id);
            const sel = value[tab] === i.id;
            return (
              <Pressable
                key={i.id}
                onPress={() => (own ? set({ [tab]: i.id } as Partial<Appearance>) : setLockedMsg(`${i.name}: ${unlockText(i.unlock)}`))}
                style={[styles.itemCell, sel && styles.itemSel]}
                accessibilityLabel={`${i.name}${own ? '' : ' locked'}`}
              >
                <ItemIcon itemId={i.id} size={60} locked={!own} />
                <Text style={[styles.itemName, { color: own ? '#fff' : C.textMuted }]} numberOfLines={1}>{i.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {lockedMsg ? <GText variant="small" color={C.goldLight} style={{ textAlign: 'center' }}>🔒 {lockedMsg}</GText> : null}
    </View>
  );
}



const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  sel: { borderColor: C.gold, transform: [{ scale: 1.12 }] },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: R.pill, backgroundColor: C.panel, borderWidth: 2, borderColor: C.panelBorder },
  pillSel: { backgroundColor: C.blue, borderColor: C.blueLight },
  pillText: { fontFamily: FONT.display, color: '#fff', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  itemCell: { width: 78, alignItems: 'center', padding: 4, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  itemSel: { borderColor: C.gold, backgroundColor: 'rgba(255,200,61,0.12)' },
  itemName: { fontFamily: FONT.body, fontSize: 10 },
});
