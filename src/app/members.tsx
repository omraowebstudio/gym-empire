import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S } from '@/theme';
import { Badge, GameButton, GText, Panel, ProgressBar, Screen, ScreenHeader, StatRow } from '@/components/ui';
import { Avatar } from '@/components/art/Character';
import { EQUIPMENT_MAP } from '@/game/config/equipment';
import { LOCATION_MAP } from '@/game/config/locations';
import { locationCapacity, locationSatisfaction, manualRecruitCost, memberFeePerMin, memberSatisfaction, recruitRatePerMin, satisfactionMultiplier, tierChances } from '@/game/systems/gym';
import { recruitMember } from '@/game/systems/gymActions';
import { dispatch, useGame } from '@/store/gameStore';
import { formatCash } from '@/game/utils/format';
import { audio } from '@/services/audio';

const TIER_COLOR = { basic: C.blue, plus: C.purple, vip: C.gold } as const;

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  const loc = game.locations[game.currentLocation]!;
  const cap = locationCapacity(loc);
  const sat = locationSatisfaction(game, loc);
  const chances = tierChances(game, loc);
  const cost = manualRecruitCost(loc);
  const full = loc.members.length >= cap;
  const satMult = satisfactionMultiplier(sat.total);
  const members = [...loc.members].sort((a, b) => b.joinedAt - a.joinedAt);
  return (
    <Screen>
      <ScreenHeader title="Members" subtitle={`${LOCATION_MAP[loc.id].name} · ${loc.members.length}/${cap}`} />
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24, gap: 8, width: '100%', maxWidth: 560, alignSelf: 'center' }}
        ListHeaderComponent={
          <View style={{ gap: S.md, marginBottom: S.sm }}>
            <Panel>
              <StatRow icon="😊" label="Gym satisfaction" value={`${sat.total}% (income ×${satMult.toFixed(2)})`} />
              <StatRow icon="🏗️" label="Facilities / Staff / Decor" value={`+${sat.facilities} / +${sat.staff} / +${sat.decorations}`} />
              {sat.crowding ? <StatRow icon="😤" label="Crowding penalty" value={`${sat.crowding}`} /> : null}
              <StatRow icon="📈" label="Auto sign-ups" value={full ? 'Gym full' : `${recruitRatePerMin(game, loc).toFixed(2)}/min`} />
              <StatRow icon="🎟️" label="Plan mix" value={`Basic ${Math.round(chances.basic * 100)}% · Plus ${Math.round(chances.plus * 100)}% · VIP ${Math.round(chances.vip * 100)}%`} />
              <GameButton
                title={full ? 'GYM FULL: ADD EQUIPMENT' : `RECRUIT NOW · ${formatCash(cost)}`}
                color={full ? 'gray' : 'green'}
                size="sm"
                style={{ marginTop: 10 }}
                disabled={full || game.cash < cost}
                onPress={() => dispatch((d, ctx) => recruitMember(d, ctx, loc.id)).ok && audio.play('coin')}
                testID="recruit-member"
              />
            </Panel>
          </View>
        }
        renderItem={({ item: m }) => {
          const ms = memberSatisfaction(game, loc, m);
          const eq = m.slotId ? loc.slots[m.slotId] : null;
          return (
            <Panel padded={false}>
              <View style={styles.row}>
                <Avatar seed={m.seed} size={46} shirt={TIER_COLOR[m.tier]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <GText variant="body">{m.name}</GText>
                    <Badge text={m.tier.toUpperCase()} color={TIER_COLOR[m.tier]} textColor={m.tier === 'vip' ? '#111' : '#fff'} />
                  </View>
                  <GText variant="tiny" color={C.textDim}>{eq ? `Training on: ${EQUIPMENT_MAP[eq.itemId].name} (Lv ${eq.level})` : 'Exploring the gym'}</GText>
                  <ProgressBar value={ms / 100} height={8} color={ms > 70 ? C.green : ms > 45 ? C.gold : C.red} />
                </View>
                <GText variant="tiny" color={C.goldLight}>{formatCash(memberFeePerMin(loc, m) * satMult)}/m</GText>
              </View>
            </Panel>
          );
        }}
        ListEmptyComponent={<Panel><GText variant="small" color={C.textDim}>No members yet. Add equipment to attract members.</GText></Panel>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
});
