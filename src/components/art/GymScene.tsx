// The living gym view: perspective room, themed walls/floor, lighting, mirrors, reception,
// decorations, placed equipment and animated members. Slot hit areas are RN Pressables so
// they work identically on iOS, Android and web.
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import type { LocationState } from '@/game/types';
import { LOCATION_MAP, slotPosition, type LocationTheme } from '@/game/config/locations';
import { ITEM_MAP } from '@/game/config/items';
import { EquipmentSprite, MemberFigure } from './Equipment';
import { DecoArt } from './Items';
import { C, FONT } from '@/theme';

const VW = 360;
const VH = 300;
const HORIZON = 112;

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function themeFor(loc: LocationState): LocationTheme {
  const base = LOCATION_MAP[loc.id].theme;
  const t = loc.theme ? ITEM_MAP[loc.theme] : null;
  if (!t) return base;
  const c1 = t.color;
  const c2 = t.color2 ?? shade(c1, -60);
  return {
    wallTop: shade(c2, 30), wallBottom: c2, floorA: shade(c2, -10), floorB: shade(c2, -24), accent: c1, trim: shade(c2, -50), light: shade(c1, 80),
  };
}

/** Maps a normalised slot position to scene coordinates with perspective. */
export function projectSlot(x: number, y: number) {
  const py = 136 + y * 140;
  const f = (py - HORIZON) / (VH - HORIZON);
  const xl = 46 - 46 * f;
  const xr = 314 + 46 * f;
  return { px: xl + x * (xr - xl), py, s: 0.56 + 0.5 * f };
}

const FLOOR_DECOS = new Set(['plant', 'cooler', 'bag', 'statue', 'boombox', 'chalk']);

interface Props {
  location: LocationState;
  width: number;
  editMode?: boolean;
  selectedSlot?: string | null;
  onSlotPress?: (slotId: string) => void;
  barbellSkin?: string;
  reducedMotion?: boolean;
  showMembers?: boolean;
  showSign?: boolean;
}

function GymSceneInner({ location, width, editMode, selectedSlot, onSlotPress, barbellSkin, reducedMotion, showMembers = true, showSign = true }: Props) {
  const k = width / VW;
  const height = VH * k;
  const th = themeFor(location);
  const def = LOCATION_MAP[location.id];
  const fac = location.facilities;
  const slots = useMemo(
    () => Object.keys(location.slots).map((id) => ({ id, ...projectSlot(slotPosition(location.id, id).x, slotPosition(location.id, id).y) })).sort((a, b) => a.py - b.py),
    [location.id, location.slots],
  );
  const lightCount = 2 + Math.floor(fac.lighting / 3);
  const lightOpacity = 0.15 + fac.lighting * 0.06;
  const mirrorCount = fac.mirrors === 0 ? 0 : Math.min(4, Math.ceil(fac.mirrors / 2.5));
  const floorRows = 7;
  const floorCols = 8;

  // Floor tiles with perspective
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < floorRows; r++) {
    const y0 = HORIZON + ((VH - HORIZON) * Math.pow(r / floorRows, 1.25));
    const y1 = HORIZON + ((VH - HORIZON) * Math.pow((r + 1) / floorRows, 1.25));
    const f0 = (y0 - HORIZON) / (VH - HORIZON);
    const f1 = (y1 - HORIZON) / (VH - HORIZON);
    const l0 = 46 - 46 * f0, r0 = 314 + 46 * f0, l1 = 46 - 46 * f1, r1 = 314 + 46 * f1;
    for (let c = 0; c < floorCols; c++) {
      const a = c / floorCols, b = (c + 1) / floorCols;
      const pts = `${l0 + a * (r0 - l0)},${y0} ${l0 + b * (r0 - l0)},${y0} ${l1 + b * (r1 - l1)},${y1} ${l1 + a * (r1 - l1)},${y1}`;
      tiles.push(<Polygon key={`t${r}-${c}`} points={pts} fill={(r + c) % 2 ? th.floorA : th.floorB} />);
    }
  }
  const floorShine = fac.flooring > 0;

  const wallDecos = location.decorations.map((d, i) => ({ d, i })).filter(({ d }) => d && !FLOOR_DECOS.has(ITEM_MAP[d]?.art ?? ''));
  const floorDecos = location.decorations.map((d, i) => ({ d, i })).filter(({ d }) => d && FLOOR_DECOS.has(ITEM_MAP[d]?.art ?? ''));

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`}>
        <Defs>
          <LinearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={th.wallTop} />
            <Stop offset="1" stopColor={th.wallBottom} />
          </LinearGradient>
          <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={th.light} stopOpacity={0.9} />
            <Stop offset="1" stopColor={th.light} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="mirror" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E6F4FF" />
            <Stop offset="0.5" stopColor="#9CC8F0" />
            <Stop offset="1" stopColor="#6FA0D0" />
          </LinearGradient>
          <LinearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {/* back wall */}
        <Rect x={0} y={0} width={VW} height={HORIZON + 2} fill="url(#wall)" />
        {/* side walls */}
        <Polygon points={`0,0 46,0 46,${HORIZON} 0,${VH}`} fill={shade(th.wallBottom, -20)} />
        <Polygon points={`${VW},0 314,0 314,${HORIZON} ${VW},${VH}`} fill={shade(th.wallBottom, -20)} />
        {/* location-specific wall features */}
        {location.id === 'garage' ? (
          <G>
            <Rect x={200} y={22} width={100} height={84} rx={3} fill={shade(th.wallTop, -15)} stroke={th.trim} strokeWidth={2} />
            {[0, 1, 2, 3, 4].map((i) => <Line key={i} x1={202} y1={36 + i * 15} x2={298} y2={36 + i * 15} stroke={th.trim} strokeWidth={1.5} opacity={0.6} />)}
          </G>
        ) : (
          <G>
            {[0, 1, 2].map((i) => (
              <G key={i}>
                <Rect x={70 + i * 80} y={18} width={52} height={30} rx={4} fill="#9ED8FF" opacity={0.75} />
                <Line x1={96 + i * 80} y1={18} x2={96 + i * 80} y2={48} stroke={th.trim} strokeWidth={2} />
                <Rect x={74 + i * 80} y={21} width={14} height={4} rx={2} fill="#fff" opacity={0.6} />
              </G>
            ))}
          </G>
        )}
        {/* mirrors */}
        {Array.from({ length: mirrorCount }).map((_, i) => {
          const w = 230 / Math.max(1, mirrorCount);
          return (
            <G key={`m${i}`}>
              <Rect x={56 + i * w + 4} y={56} width={w - 8} height={50} rx={2} fill="url(#mirror)" stroke={th.trim} strokeWidth={2} />
              <Line x1={56 + i * w + 12} y1={98} x2={56 + i * w + 26} y2={62} stroke="#fff" strokeWidth={3} opacity={0.5} />
            </G>
          );
        })}
        {/* wall decorations */}
        {wallDecos.map(({ d, i }, n) => {
          const it = ITEM_MAP[d as string];
          const x = 52 + ((n + 0.5) * 256) / Math.max(1, wallDecos.length) - 18;
          return (
            <G key={`wd${i}`} transform={`translate(${x} ${location.id === 'garage' ? 54 : 60}) scale(0.95)`}>
              <DecoArt art={it.art ?? ''} color={it.color} color2={it.color2} />
            </G>
          );
        })}
        {/* baseboard / accent stripe */}
        <Rect x={46} y={HORIZON - 6} width={268} height={6} fill={th.accent} />
        {/* ceiling lights */}
        {Array.from({ length: lightCount }).map((_, i) => {
          const x = 46 + ((i + 0.5) * 268) / lightCount;
          return (
            <G key={`l${i}`}>
              <Line x1={x} y1={0} x2={x} y2={8} stroke={th.trim} strokeWidth={2} />
              <Path d={`M ${x - 12} 14 Q ${x} 2 ${x + 12} 14 Z`} fill={th.trim} />
              <Ellipse cx={x} cy={15} rx={8} ry={3} fill={th.light} />
              <Ellipse cx={x} cy={40} rx={44} ry={36} fill="url(#glow)" opacity={lightOpacity} />
            </G>
          );
        })}
        {/* floor */}
        {tiles}
        <Polygon points={`46,${HORIZON} 314,${HORIZON} 360,${VH} 0,${VH}`} fill="url(#floorFade)" opacity={0.6} />
        {floorShine ? <Ellipse cx={180} cy={210} rx={110 + fac.flooring * 4} ry={40} fill="#fff" opacity={0.03 + fac.flooring * 0.008} /> : null}
        {/* rubber mats under equipment for upgraded flooring */}
        {fac.flooring >= 3
          ? slots.filter((s) => location.slots[s.id]).map((s) => <Ellipse key={`mat${s.id}`} cx={s.px} cy={s.py - 2 * s.s} rx={38 * s.s} ry={10 * s.s} fill="#11141C" opacity={0.35} />)
          : null}
        {/* reception desk */}
        {fac.reception > 0 ? (
          <G transform="translate(8 236)">
            <Path d="M 0 22 L 70 22 L 74 6 L 6 6 Z" fill={shade(th.accent, 30)} />
            <Rect x={0} y={22} width={70} height={30} rx={3} fill={th.accent} />
            <Rect x={4} y={28} width={62} height={4} fill="rgba(255,255,255,0.3)" />
            <Rect x={44} y={-6} width={16} height={12} rx={2} fill="#2A2F3B" />
            <Rect x={46} y={-4} width={12} height={7} fill="#9EF0FF" />
          </G>
        ) : null}
        {/* equipment, back to front */}
        {slots.map((s) => {
          const placed = location.slots[s.id];
          if (!placed) {
            return editMode ? (
              <G key={s.id}>
                <Ellipse cx={s.px} cy={s.py - 4 * s.s} rx={30 * s.s} ry={10 * s.s} fill={selectedSlot === s.id ? C.gold : '#fff'} opacity={selectedSlot === s.id ? 0.55 : 0.18} stroke="#fff" strokeWidth={1.5} strokeDasharray="4 3" />
              </G>
            ) : null;
          }
          return (
            <G key={s.id} transform={`translate(${s.px - 40 * s.s} ${s.py - 66 * s.s}) scale(${s.s})`}>
              {selectedSlot === s.id ? <Ellipse cx={40} cy={64} rx={40} ry={9} fill={C.gold} opacity={0.6} /> : null}
              <EquipmentSprite id={placed.itemId} level={placed.level} skin={barbellSkin} />
            </G>
          );
        })}
        {/* floor decorations at the front corners */}
        {floorDecos.map(({ d, i }, n) => {
          const it = ITEM_MAP[d as string];
          const x = n % 2 === 0 ? 300 - Math.floor(n / 2) * 30 : 86 + Math.floor(n / 2) * 30;
          return (
            <G key={`fd${i}`} transform={`translate(${x} 250) scale(1.1)`}>
              <DecoArt art={it.art ?? ''} color={it.color} color2={it.color2} />
            </G>
          );
        })}
      </Svg>
      {/* animated members */}
      {showMembers
        ? location.members.slice(0, 40).map((m, idx) => {
            const slot = m.slotId ? slots.find((s) => s.id === m.slotId) : null;
            if (!slot) return null;
            const siblings = location.members.filter((x) => x.slotId === m.slotId);
            const j = siblings.findIndex((x) => x.id === m.id);
            const offset = (j - (siblings.length - 1) / 2) * 20 * slot.s;
            const left = (slot.px + offset - 10 * slot.s * 1.2) * k;
            const top = (slot.py - 6 * slot.s - 28 * slot.s * 1.2 + 10 * slot.s) * k;
            return (
              <MemberSprite key={m.id} left={left} top={top} scale={slot.s * 1.2 * k} seed={m.seed} tier={m.tier} delay={idx * 137} still={!!reducedMotion} />
            );
          })
        : null}
      {showSign ? (
        <View style={[styles.sign, { top: 4 * k }]} pointerEvents="none">
          <Text style={[styles.signText, { fontSize: Math.max(11, 13 * k) }]} numberOfLines={1}>{def.name.toUpperCase()}</Text>
        </View>
      ) : null}
      {/* hit areas */}
      {onSlotPress
        ? slots.map((s) => {
            const placed = location.slots[s.id];
            if (!placed && !editMode) return null;
            const w = 64 * s.s * k;
            const h = 60 * s.s * k;
            return (
              <Pressable
                key={`hit${s.id}`}
                accessibilityRole="button"
                accessibilityLabel={placed ? `Equipment slot ${s.id}` : `Empty slot ${s.id}`}
                testID={`slot-${s.id}`}
                onPress={() => onSlotPress(s.id)}
                style={{ position: 'absolute', left: s.px * k - w / 2, top: (s.py - 58 * s.s) * k, width: w, height: h, alignItems: 'center', justifyContent: 'center' }}
              >
                {!placed && editMode ? (
                  <View style={[styles.plus, { transform: [{ scale: Math.max(0.7, s.s * k) }] }]}>
                    <Text style={styles.plusText}>+</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })
        : null}
    </View>
  );
}

function MemberSprite({ left, top, scale, seed, tier, delay, still }: { left: number; top: number; scale: number; seed: number; tier: 'basic' | 'plus' | 'vip'; delay: number; still: boolean }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    y.value = withDelay(
      delay % 1200,
      withRepeat(withSequence(withTiming(-3, { duration: 380 + (seed % 200), easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 380 + (seed % 200), easing: Easing.in(Easing.quad) })), -1),
    );
  }, [still, delay, seed, y]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top, width: 20 * scale, height: 30 * scale }, st]}>
      <Svg width={20 * scale} height={30 * scale} viewBox="0 -3 20 33">
        <MemberFigure seed={seed} tier={tier} />
      </Svg>
    </Animated.View>
  );
}

export const GymScene = React.memo(GymSceneInner);

const styles = StyleSheet.create({
  sign: { position: 'absolute', alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  signText: { fontFamily: FONT.display, color: '#fff', backgroundColor: 'rgba(5,8,26,0.55)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', letterSpacing: 1 },
  plus: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  plusText: { fontFamily: FONT.display, fontSize: 22, color: '#063D1F', lineHeight: 26 },
});

// re-export for screens that need it
export { VW as SCENE_W, VH as SCENE_H };
