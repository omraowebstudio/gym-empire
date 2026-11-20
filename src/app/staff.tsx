import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S } from '@/theme';
import { Badge, GameButton, GText, Panel, ProgressBar, Screen, ScreenHeader, SectionTitle, Sheet } from '@/components/ui';
import { Avatar } from '@/components/art/Character';
import { STAFF, STAFF_MAP } from '@/game/config/staff';
import { ECONOMY } from '@/game/config/economy';
import { empireScale, staffHireCost, staffSlots, staffUpgradeCost, staffSalaryPerMin } from '@/game/systems/gym';
import { fireStaff, hireStaff, upgradeStaff } from '@/game/systems/gymActions';
import { dispatch, useGame } from '@/store/gameStore';
import { formatCash } from '@/game/utils/format';
import { audio } from '@/services/audio';
import type { Staff } from '@/game/types';

function effectText(s: { type: Staff['type']; level: number }) {
  const d = STAFF_MAP[s.type];
  const parts: string[] = [];
  if (d.satisfactionPerLevel) parts.push(`+${d.satisfactionPerLevel * s.level}% satisfaction`);
  if (d.trainingXpPerLevel) parts.push(`+${Math.round(d.trainingXpPerLevel * s.level * 100)}% training XP`);
  if (d.recruitPerLevel) parts.push(`+${Math.round(d.recruitPerLevel * s.level * 100)}% sign-ups`);
  if (d.premiumChancePerLevel) parts.push(`+${Math.round(d.premiumChancePerLevel * s.level * 100)}% Plus/VIP`);
  if (d.incomePerLevel) parts.push(`+${Math.round(d.incomePerLevel * s.level * 100)}% income`);
  if (d.offlineHoursPerLevel) parts.push(`+${d.offlineHoursPerLevel * s.level}h offline cap`);
  return parts.join(' · ');
}

export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const game = useGame((g) => g);
  const [confirmFire, setConfirmFire] = useState<Staff | null>(null);
  const slots = staffSlots(game);
  const locked = game.level < ECONOMY.staff.unlockLevel;
  const scale = empireScale(game);
  return (
    <Screen>
      <ScreenHeader title="Staff Management" subtitle={`${game.staff.length}/${slots} positions · salaries ${formatCash(staffSalaryPerMin(game))}/min`} />
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          {locked ? (
            <Panel><GText variant="body">🔒 Staff unlock at player level {ECONOMY.staff.unlockLevel}. Keep training and building!</GText></Panel>
          ) : null}
          <SectionTitle>Hire</SectionTitle>
          <View style={{ gap: 8 }}>
            {STAFF.map((d) => {
              const cost = staffHireCost(game, d.type);
              return (
                <Panel key={d.type} padded={false}>
                  <View style={styles.row}>
                    <View style={[styles.icon, { backgroundColor: d.color }]}><Text style={{ fontSize: 24 }}>{d.type === 'trainer' ? '🏋️' : d.type === 'receptionist' ? '🛎️' : d.type === 'cleaner' ? '🧽' : '💼'}</Text></View>
                    <View style={{ flex: 1 }}>
                      <GText variant="h2" style={{ fontSize: 16 }}>{d.name}</GText>
                      <GText variant="tiny" color={C.textDim}>{d.description}</GText>
                      <GText variant="tiny" color={C.goldLight}>Lv1: {effectText({ type: d.type, level: 1 })} · salary {formatCash(d.baseSalaryPerMin * scale)}/min</GText>
                    </View>
                    <GameButton title="HIRE" subtitle={formatCash(cost)} color="green" size="sm" disabled={locked || game.staff.length >= slots || game.cash < cost} onPress={() => dispatch((d2, ctx) => hireStaff(d2, ctx, d.type)).ok && audio.play('purchase')} testID={`hire-${d.type}`} />
                  </View>
                </Panel>
              );
            })}
          </View>
          {game.staff.length >= slots && !locked ? <GText variant="tiny" color={C.goldLight} style={{ marginTop: 6 }}>All positions filled. Each new gym location adds {ECONOMY.staff.slotsPerLocation} staff positions.</GText> : null}

          <SectionTitle>Your Team</SectionTitle>
          {game.staff.length === 0 ? <Panel><GText variant="small" color={C.textDim}>No employees yet.</GText></Panel> : null}
          <View style={{ gap: 8 }}>
            {game.staff.map((s) => {
              const d = STAFF_MAP[s.type];
              const maxed = s.level >= ECONOMY.staff.maxLevel;
              const cost = staffUpgradeCost(game, s.type, s.level);
              return (
                <Panel key={s.id} padded={false}>
                  <View style={styles.row}>
                    <Avatar seed={s.seed} size={52} shirt={d.color} ring={C.panel2} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <GText variant="body">{s.name}</GText>
                        <Badge text={d.name.toUpperCase()} color={d.color} textColor="#111" />
                      </View>
                      <ProgressBar value={s.level / ECONOMY.staff.maxLevel} height={8} label={`LV ${s.level}`} color={d.color} />
                      <GText variant="tiny" color={C.textDim}>{effectText(s)}</GText>
                      <GText variant="tiny" color={C.textMuted}>Salary {formatCash(d.baseSalaryPerMin * s.level * scale)}/min</GText>
                    </View>
                    <View style={{ gap: 6 }}>
                      <GameButton title={maxed ? 'MAX' : 'TRAIN'} subtitle={maxed ? undefined : formatCash(cost)} color="gold" size="sm" disabled={maxed || game.cash < cost} onPress={() => dispatch((d2, ctx) => upgradeStaff(d2, ctx, s.id)).ok && audio.play('upgrade')} />
                      <GameButton title="Let go" color="gray" size="sm" sound="none" onPress={() => setConfirmFire(s)} />
                    </View>
                  </View>
                </Panel>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <Sheet visible={!!confirmFire} onClose={() => setConfirmFire(null)} title="Let go?">
        <GText variant="body" style={{ textAlign: 'center' }}>{confirmFire?.name} will leave your team. Hiring and training costs are not refunded.</GText>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <GameButton title="Keep" color="green" style={{ flex: 1 }} onPress={() => setConfirmFire(null)} />
          <GameButton title="Let go" color="red" style={{ flex: 1 }} onPress={() => { dispatch((d, ctx) => fireStaff(d, ctx, confirmFire!.id)); setConfirmFire(null); }} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
