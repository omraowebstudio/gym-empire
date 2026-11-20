// Stylised cartoon lifter rendered with SVG. A joint-based rig drives idle and exercise
// poses; physique stage scales limb thickness and shoulder width for visible progression.
import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, RadialGradient } from 'react-native-svg';
import type { Appearance, ExerciseId } from '@/game/types';
import { HAIR_COLORS, ITEM_MAP, SKIN_TONES } from '@/game/config/items';

type P = [number, number];

export interface Pose {
  side: boolean; // side view (bench, deadlift, leg press)
  neck: P;
  hip: P;
  lSh: P; rSh: P;
  lEl: P; rEl: P;
  lHa: P; rHa: P;
  lHip: P; rHip: P;
  lKn: P; rKn: P;
  lFt: P; rFt: P;
  headTilt?: number;
}

const BUILD = [
  { sw: 23, ww: 19, arm: 11, fore: 9, thigh: 15, calf: 11, neck: 11 },
  { sw: 26, ww: 19, arm: 13, fore: 10, thigh: 17, calf: 12, neck: 12 },
  { sw: 29, ww: 20, arm: 15, fore: 12, thigh: 19, calf: 13, neck: 14 },
  { sw: 32, ww: 21, arm: 18, fore: 14, thigh: 22, calf: 15, neck: 16 },
  { sw: 35, ww: 22, arm: 21, fore: 16, thigh: 25, calf: 17, neck: 18 },
  { sw: 39, ww: 23, arm: 24, fore: 18, thigh: 28, calf: 19, neck: 20 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lp = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Standing front pose. `breath` 0..1 subtly lifts shoulders. */
export function idlePose(stage: number, breath = 0): Pose {
  const b = BUILD[stage];
  const ny = 92 - breath * 1.5;
  return {
    side: false,
    neck: [100, ny], hip: [100, 160],
    lSh: [100 - b.sw, ny + 8], rSh: [100 + b.sw, ny + 8],
    lEl: [100 - b.sw - 6, 128], rEl: [100 + b.sw + 6, 128],
    lHa: [100 - b.sw - 7, 160], rHa: [100 + b.sw + 7, 160],
    lHip: [100 - 11, 162], rHip: [100 + 11, 162],
    lKn: [100 - 14, 202], rKn: [100 + 14, 202],
    lFt: [100 - 16, 242], rFt: [100 + 16, 242],
  };
}

/** Flex pose for celebrations. */
export function flexPose(stage: number): Pose {
  const b = BUILD[stage];
  const base = idlePose(stage);
  return {
    ...base,
    lEl: [100 - b.sw - 26, 92], rEl: [100 + b.sw + 26, 92],
    lHa: [100 - b.sw - 14, 62], rHa: [100 + b.sw + 14, 62],
  };
}

/** Exercise pose; p = 0 start position, 1 = fully moved. */
export function exercisePose(ex: ExerciseId, stage: number, p: number): Pose {
  const b = BUILD[stage];
  const sw = b.sw;
  switch (ex) {
    case 'squat': {
      const d = p * 42;
      return {
        side: false,
        neck: [100, 92 + d], hip: [100, 160 + d],
        lSh: [100 - sw, 100 + d], rSh: [100 + sw, 100 + d],
        lEl: [100 - sw - 18, 118 + d], rEl: [100 + sw + 18, 118 + d],
        lHa: [100 - sw - 12, 96 + d], rHa: [100 + sw + 12, 96 + d],
        lHip: [100 - 12, 162 + d], rHip: [100 + 12, 162 + d],
        lKn: [100 - 16 - p * 22, 204 + p * 8], rKn: [100 + 16 + p * 22, 204 + p * 8],
        lFt: [100 - 22, 242], rFt: [100 + 22, 242],
      };
    }
    case 'ohp': {
      const base = idlePose(stage);
      return {
        ...base,
        lHa: lp([100 - sw - 6, 98], [100 - sw + 2, 30], p), rHa: lp([100 + sw + 6, 98], [100 + sw - 2, 30], p),
        lEl: lp([100 - sw - 20, 124], [100 - sw - 6, 62], p), rEl: lp([100 + sw + 20, 124], [100 + sw + 6, 62], p),
      };
    }
    case 'curl': {
      const base = idlePose(stage);
      const ang = p * 2.4; // radians of forearm rotation
      const len = 32;
      const lE: P = [100 - sw - 4, 130];
      const rE: P = [100 + sw + 4, 130];
      return {
        ...base,
        lEl: lE, rEl: rE,
        lHa: [lE[0] - Math.sin(ang) * 6, lE[1] + Math.cos(ang) * len], rHa: [rE[0] + Math.sin(ang) * 6, rE[1] + Math.cos(ang) * len],
      };
    }
    case 'lateral': {
      const base = idlePose(stage);
      const a = p * 1.45; // abduction angle
      const up = 34;
      const fo = 32;
      const lS = base.lSh;
      const rS = base.rSh;
      const lE: P = [lS[0] - Math.sin(a) * up - 4, lS[1] + Math.cos(a) * up];
      const rE: P = [rS[0] + Math.sin(a) * up + 4, rS[1] + Math.cos(a) * up];
      return {
        ...base,
        lEl: lE, rEl: rE,
        lHa: [lE[0] - Math.sin(a) * fo, lE[1] + Math.cos(a) * fo - p * 4], rHa: [rE[0] + Math.sin(a) * fo, rE[1] + Math.cos(a) * fo - p * 4],
      };
    }
    case 'pulldown': {
      return {
        side: false,
        neck: [100, 112], hip: [100, 178],
        lSh: [100 - sw, 120], rSh: [100 + sw, 120],
        lEl: lp([100 - sw - 18, 82], [100 - sw - 26, 140], p), rEl: lp([100 + sw + 18, 82], [100 + sw + 26, 140], p),
        lHa: lp([100 - sw - 30, 42], [100 - sw - 22, 106], p), rHa: lp([100 + sw + 30, 42], [100 + sw + 22, 106], p),
        lHip: [100 - 12, 180], rHip: [100 + 12, 180],
        lKn: [100 - 22, 196], rKn: [100 + 22, 196],
        lFt: [100 - 22, 242], rFt: [100 + 22, 242],
      };
    }
    case 'bench': {
      // side view, lying on a bench, facing up; head on the left
      const sh: P = [72, 176];
      return {
        side: true,
        neck: [60, 176], hip: [132, 180], headTilt: -90,
        lSh: sh, rSh: sh,
        lEl: lp([96, 168], [76, 124], p), rEl: lp([96, 168], [76, 124], p),
        lHa: lp([78, 146], [74, 88], p), rHa: lp([78, 146], [74, 88], p),
        lHip: [132, 180], rHip: [132, 180],
        lKn: [166, 168], rKn: [170, 172],
        lFt: [172, 242], rFt: [178, 242],
      };
    }
    case 'deadlift': {
      // side view facing right
      return {
        side: true,
        neck: lp([128, 138], [100, 96], p), hip: lp([80, 180], [98, 164], p),
        lSh: lp([124, 146], [100, 104], p), rSh: lp([124, 146], [100, 104], p),
        lEl: lp([122, 186], [101, 136], p), rEl: lp([122, 186], [101, 136], p),
        lHa: lp([120, 222], [102, 166], p), rHa: lp([120, 222], [102, 166], p),
        lHip: lp([80, 180], [98, 164], p), rHip: lp([80, 180], [98, 164], p),
        lKn: lp([114, 212], [104, 204], p), rKn: lp([114, 212], [104, 204], p),
        lFt: [100, 244], rFt: [104, 244],
      };
    }
    case 'legpress': {
      // side view, reclined seat on the left, pushing a sled to the upper right
      return {
        side: true,
        neck: [52, 150], hip: [82, 206], headTilt: -40,
        lSh: [58, 160], rSh: [58, 160],
        lEl: [70, 190], rEl: [70, 190],
        lHa: [84, 206], rHa: [84, 206],
        lHip: [82, 206], rHip: [82, 206],
        lKn: lp([104, 156], [128, 176], p), rKn: lp([108, 158], [132, 178], p),
        lFt: lp([130, 182], [168, 158], p), rFt: lp([134, 184], [172, 160], p),
      };
    }
  }
}

export interface CharacterProps {
  appearance: Appearance;
  stage: number;
  pose?: Pose;
  size?: number;
  barbellColor?: string;
  dumbbellColor?: string;
  exercise?: ExerciseId | null;
  /** 0..1 for props that move with the exercise (e.g. leg press sled) */
  progress?: number;
  showShadow?: boolean;
}

export function Character({ appearance, stage, pose, size = 200, barbellColor = '#B8C0D4', dumbbellColor = '#C9D1E6', exercise = null, progress = 0, showShadow = true }: CharacterProps) {
  const st = Math.max(0, Math.min(5, stage));
  const b = BUILD[st];
  const ps = pose ?? idlePose(st);
  const skin = SKIN_TONES[appearance.skin] ?? SKIN_TONES[1];
  const skinDark = shade(skin, -38);
  const hair = HAIR_COLORS[appearance.hairColor] ?? HAIR_COLORS[0];
  const shirt = ITEM_MAP[appearance.shirt] ?? ITEM_MAP.shirt_tee_blue;
  const shorts = ITEM_MAP[appearance.shorts] ?? ITEM_MAP.shorts_navy;
  const shoes = ITEM_MAP[appearance.shoes] ?? ITEM_MAP.shoes_white;
  const acc = ITEM_MAP[appearance.accessory]?.art ?? 'none';
  const shirtArt = shirt.art ?? 'tee';
  const sleeves = shirtArt === 'tee' || shirtArt === 'hoodie' || shirtArt === 'compression';
  const longSleeve = shirtArt === 'hoodie' || shirtArt === 'compression';
  const shirtCol = shirt.color;
  const shirtCol2 = shirt.color2 ?? shade(shirtCol, -40);
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const gSkin = `skin${uid}`;
  const gShirt = `shirt${uid}`;
  const gShorts = `shorts${uid}`;
  const gHead = `head${uid}`;

  const [nx, ny] = ps.neck;
  const head: P = ps.side
    ? ps.headTilt === -90 ? [nx - 18, ny - 4] : ps.headTilt === -40 ? [nx - 12, ny - 18] : [nx + 4, ny - 24]
    : [nx, ny - 26];

  const limb = (a: P, c: P, w: number, color: string, key: string) => (
    <Line key={key} x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} stroke={color} strokeWidth={w} strokeLinecap="round" />
  );

  const shortsStroke = `url(#${gShorts})`;
  const thighEnd = (h: P, k: P): P => lp(h, k, 0.72);

  // --- Legs
  const legs = (
    <G>
      {limb(ps.lKn, ps.lFt, b.calf, `url(#${gSkin})`, 'lcalf')}
      {limb(ps.rKn, ps.rFt, b.calf, `url(#${gSkin})`, 'rcalf')}
      {limb(ps.lHip, ps.lKn, b.thigh, `url(#${gSkin})`, 'lthigh')}
      {limb(ps.rHip, ps.rKn, b.thigh, `url(#${gSkin})`, 'rthigh')}
      {limb(ps.lHip, thighEnd(ps.lHip, ps.lKn), b.thigh + 3, shortsStroke, 'lshort')}
      {limb(ps.rHip, thighEnd(ps.rHip, ps.rKn), b.thigh + 3, shortsStroke, 'rshort')}
      {[ps.lFt, ps.rFt].map((f, i) => (
        <G key={`shoe${i}`}>
          <Ellipse cx={f[0] + (ps.side ? 6 : i === 0 ? -3 : 3)} cy={f[1] + 2} rx={b.calf * 0.85 + 3} ry={6} fill={shoes.color} stroke={shade(shoes.color, -60)} strokeWidth={1.5} />
          <Ellipse cx={f[0] + (ps.side ? 4 : i === 0 ? -5 : 1)} cy={f[1] - 1} rx={4} ry={1.6} fill="rgba(255,255,255,0.6)" />
        </G>
      ))}
    </G>
  );

  // --- Torso
  const [hx, hy] = ps.hip;
  let torso: React.ReactNode;
  if (ps.side) {
    torso = (
      <G>
        <Line x1={nx} y1={ny + 6} x2={hx} y2={hy} stroke={`url(#${gSkin})`} strokeWidth={b.sw * 1.15} strokeLinecap="round" />
        <Line x1={nx} y1={ny + 8} x2={hx} y2={hy} stroke={`url(#${gShirt})`} strokeWidth={b.sw * 1.12 - (sleeves ? 0 : 3)} strokeLinecap="round" />
        <Line x1={hx} y1={hy} x2={lp(ps.hip, ps.neck, 0.12)[0]} y2={lp(ps.hip, ps.neck, 0.12)[1]} stroke={shortsStroke} strokeWidth={b.sw * 1.15} strokeLinecap="round" />
      </G>
    );
  } else {
    const shY = ps.lSh[1];
    const sw = (ps.rSh[0] - ps.lSh[0]) / 2;
    const ww = b.ww;
    const d = `M ${nx - sw} ${shY - 2} Q ${nx} ${shY - 10} ${nx + sw} ${shY - 2} Q ${nx + sw + 4} ${shY + 6} ${nx + sw - 4} ${shY + 20} L ${hx + ww} ${hy - 4} Q ${hx} ${hy + 6} ${hx - ww} ${hy - 4} L ${nx - sw + 4} ${shY + 20} Q ${nx - sw - 4} ${shY + 6} ${nx - sw} ${shY - 2} Z`;
    const tank = shirtArt === 'tank' || shirtArt === 'stringer';
    const tankInset = shirtArt === 'stringer' ? sw * 0.55 : sw * 0.35;
    const dShirt = tank
      ? `M ${nx - sw + tankInset} ${shY - 6} Q ${nx} ${shY + (shirtArt === 'stringer' ? 22 : 10)} ${nx + sw - tankInset} ${shY - 6} L ${nx + sw - 2} ${shY + 18} L ${hx + ww + 1} ${hy - 2} Q ${hx} ${hy + 8} ${hx - ww - 1} ${hy - 2} L ${nx - sw + 2} ${shY + 18} Z`
      : `M ${nx - sw - 1} ${shY - 2} Q ${nx - 8} ${shY - 6} ${nx} ${shY + 4} Q ${nx + 8} ${shY - 6} ${nx + sw + 1} ${shY - 2} Q ${nx + sw + 5} ${shY + 6} ${nx + sw - 3} ${shY + 20} L ${hx + ww + 1} ${hy - 2} Q ${hx} ${hy + 8} ${hx - ww - 1} ${hy - 2} L ${nx - sw + 3} ${shY + 20} Q ${nx - sw - 5} ${shY + 6} ${nx - sw - 1} ${shY - 2} Z`;
    torso = (
      <G>
        <Path d={d} fill={`url(#${gSkin})`} />
        <Path d={dShirt} fill={`url(#${gShirt})`} />
        {/* muscle definition visible through tanks/stringers */}
        {tank && st >= 2 ? (
          <Path d={`M ${nx - sw * 0.55} ${shY + 16} Q ${nx - 4} ${shY + 22} ${nx} ${shY + 16} Q ${nx + 4} ${shY + 22} ${nx + sw * 0.55} ${shY + 16}`} stroke="rgba(0,0,0,0.18)" strokeWidth={2} fill="none" />
        ) : null}
        {st >= 3 && shirtArt === 'compression' ? (
          <G opacity={0.25}>
            <Line x1={nx} y1={shY + 24} x2={nx} y2={hy - 8} stroke="#000" strokeWidth={1.5} />
            <Line x1={nx - 8} y1={shY + 34} x2={nx + 8} y2={shY + 34} stroke="#000" strokeWidth={1.2} />
            <Line x1={nx - 8} y1={shY + 46} x2={nx + 8} y2={shY + 46} stroke="#000" strokeWidth={1.2} />
          </G>
        ) : null}
        {shirt.color2 && shirtArt !== 'compression' ? (
          <Path d={`M ${hx - ww} ${hy - 14} L ${hx + ww} ${hy - 14} L ${hx + ww + 1} ${hy - 4} Q ${hx} ${hy + 4} ${hx - ww - 1} ${hy - 4} Z`} fill={shirt.color2} opacity={0.9} />
        ) : null}
        {shirtArt === 'hoodie' ? <Path d={`M ${nx - 14} ${shY - 4} Q ${nx} ${shY + 14} ${nx + 14} ${shY - 4}`} stroke={shade(shirtCol, -50)} strokeWidth={3} fill="none" /> : null}
        {/* waistband */}
        <Path d={`M ${hx - ww - 1} ${hy - 4} Q ${hx} ${hy + 6} ${hx + ww + 1} ${hy - 4} L ${hx + ww + 2} ${hy + 4} Q ${hx} ${hy + 14} ${hx - ww - 2} ${hy + 4} Z`} fill={shortsStroke} />
        {acc === 'belt' ? <Rect x={hx - ww - 3} y={hy - 12} width={(ww + 3) * 2} height={10} rx={3} fill="#7A4A2A" stroke="#4A2A12" strokeWidth={1.5} /> : null}
        {acc === 'chain' ? <Path d={`M ${nx - 12} ${shY - 2} Q ${nx} ${shY + 20} ${nx + 12} ${shY - 2}`} stroke="#FFC83D" strokeWidth={2.6} fill="none" strokeDasharray="3 1.5" /> : null}
      </G>
    );
  }

  // --- Arms
  const armColor = (sleeveLen: number) => (sleeveLen > 0 ? `url(#${gShirt})` : `url(#${gSkin})`);
  const arm = (sh: P, el: P, ha: P, key: string) => (
    <G key={key}>
      {limb(sh, el, b.arm, `url(#${gSkin})`, `${key}u`)}
      {limb(el, ha, b.fore, `url(#${gSkin})`, `${key}f`)}
      {sleeves ? limb(sh, lp(sh, el, longSleeve ? 1 : 0.5), b.arm + 2, armColor(1), `${key}s`) : null}
      {longSleeve ? limb(el, lp(el, ha, 0.75), b.fore + 2, armColor(1), `${key}s2`) : null}
      {/* bicep highlight */}
      {st >= 3 && !longSleeve ? <Circle cx={lp(sh, el, 0.62)[0]} cy={lp(sh, el, 0.62)[1]} r={b.arm * 0.22} fill="rgba(255,255,255,0.18)" /> : null}
      <Circle cx={ha[0]} cy={ha[1]} r={b.fore * 0.62} fill={skin} />
      {acc === 'wristbands' ? limb(lp(el, ha, 0.78), lp(el, ha, 0.92), b.fore + 3, '#FFC83D', `${key}wb`) : null}
    </G>
  );

  // --- Head
  const [cx, cy] = head;
  const hr = 22;
  const faceRight = ps.side && ps.headTilt === undefined;
  const headNode = (
    <G>
      {/* neck */}
      <Line x1={nx} y1={ny + 4} x2={lp(ps.neck, head, 0.6)[0]} y2={lp(ps.neck, head, 0.6)[1]} stroke={skinDark} strokeWidth={b.neck} strokeLinecap="round" />
      {hairBack(appearance.hair, cx, cy, hr, hair)}
      <Circle cx={cx} cy={cy} r={hr} fill={`url(#${gHead})`} />
      {/* ear */}
      {!ps.side ? (
        <>
          <Ellipse cx={cx - hr + 1} cy={cy + 3} rx={4} ry={6} fill={skinDark} />
          <Ellipse cx={cx + hr - 1} cy={cy + 3} rx={4} ry={6} fill={skinDark} />
        </>
      ) : null}
      {/* face */}
      {ps.side && ps.headTilt !== undefined ? (
        <G>
          <Circle cx={cx - 2} cy={cy - 6} r={2.6} fill="#1B1B2F" />
          <Path d={`M ${cx - 8} ${cy + 4} Q ${cx - 3} ${cy + 8} ${cx + 2} ${cy + 4}`} stroke="#5A2A1A" strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      ) : faceRight ? (
        <G>
          <Ellipse cx={cx + 9} cy={cy - 2} rx={3.4} ry={4.2} fill="#fff" />
          <Circle cx={cx + 10} cy={cy - 1.5} r={2.3} fill="#1B1B2F" />
          <Path d={`M ${cx + 5} ${cy - 9} L ${cx + 14} ${cy - 7}`} stroke={hair} strokeWidth={2.6} strokeLinecap="round" />
          <Path d={`M ${cx + 6} ${cy + 9} Q ${cx + 12} ${cy + 11} ${cx + 16} ${cy + 7}`} stroke="#5A2A1A" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Ellipse cx={cx - 8} cy={cy - 1} rx={4} ry={5} fill="#fff" />
          <Ellipse cx={cx + 8} cy={cy - 1} rx={4} ry={5} fill="#fff" />
          <Circle cx={cx - 7.5} cy={cy} r={2.6} fill="#1B1B2F" />
          <Circle cx={cx + 8.5} cy={cy} r={2.6} fill="#1B1B2F" />
          <Circle cx={cx - 6.5} cy={cy - 1} r={0.9} fill="#fff" />
          <Circle cx={cx + 9.5} cy={cy - 1} r={0.9} fill="#fff" />
          <Path d={`M ${cx - 13} ${cy - 8} L ${cx - 4} ${cy - 6.5}`} stroke={shade(hair, 10)} strokeWidth={2.6} strokeLinecap="round" />
          <Path d={`M ${cx + 13} ${cy - 8} L ${cx + 4} ${cy - 6.5}`} stroke={shade(hair, 10)} strokeWidth={2.6} strokeLinecap="round" />
          <Path d={`M ${cx - 7} ${cy + 9} Q ${cx} ${cy + 15} ${cx + 7} ${cy + 9}`} stroke="#5A2A1A" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Ellipse cx={cx - 13} cy={cy + 7} rx={3.5} ry={2} fill="#FF7A7A" opacity={0.35} />
          <Ellipse cx={cx + 13} cy={cy + 7} rx={3.5} ry={2} fill="#FF7A7A" opacity={0.35} />
        </G>
      )}
      {hairFront(appearance.hair, cx, cy, hr, hair, ps.side)}
      {accessoryHead(acc, cx, cy, hr, ITEM_MAP[appearance.accessory]?.color ?? '#fff', ps.side)}
      <Ellipse cx={cx - 7} cy={cy - 12} rx={7} ry={4} fill="rgba(255,255,255,0.28)" />
    </G>
  );

  // --- Equipment props
  const props = renderProps(exercise, ps, barbellColor, dumbbellColor, progress);

  const backArm = ps.side ? null : null;
  void backArm;

  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 200 260">
      <Defs>
        <LinearGradient id={gSkin} x1="0" y1="0" x2="200" y2="40" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={shade(skin, 18)} />
          <Stop offset="1" stopColor={shade(skin, -22)} />
        </LinearGradient>
        <LinearGradient id={gShirt} x1="40" y1="60" x2="160" y2="200" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={shade(shirtCol, 28)} />
          <Stop offset="0.6" stopColor={shirtCol} />
          <Stop offset="1" stopColor={shirtCol2} />
        </LinearGradient>
        <LinearGradient id={gShorts} x1="60" y1="150" x2="140" y2="230" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={shade(shorts.color, 25)} />
          <Stop offset="1" stopColor={shorts.color2 ?? shade(shorts.color, -30)} />
        </LinearGradient>
        <RadialGradient id={gHead} cx="0.4" cy="0.35" r="0.75">
          <Stop offset="0" stopColor={shade(skin, 22)} />
          <Stop offset="1" stopColor={shade(skin, -18)} />
        </RadialGradient>
      </Defs>
      {showShadow ? <Ellipse cx={100} cy={248} rx={58} ry={8} fill="rgba(0,0,0,0.28)" /> : null}
      {props.back}
      {legs}
      {torso}
      {ps.side ? arm(ps.rSh, ps.rEl, ps.rHa, 'ra') : null}
      {headNode}
      {!ps.side ? arm(ps.lSh, ps.lEl, ps.lHa, 'la') : null}
      {!ps.side ? arm(ps.rSh, ps.rEl, ps.rHa, 'ra') : null}
      {props.front}
    </Svg>
  );
}

function hairBack(style: string, cx: number, cy: number, r: number, color: string) {
  if (style === 'ponytail') return <Path d={`M ${cx + r - 4} ${cy - 6} Q ${cx + r + 18} ${cy + 4} ${cx + r + 8} ${cy + 26}`} stroke={color} strokeWidth={10} strokeLinecap="round" fill="none" />;
  if (style === 'curly') return <Circle cx={cx} cy={cy - 4} r={r + 6} fill={color} />;
  return null;
}

function hairFront(style: string, cx: number, cy: number, r: number, color: string, side: boolean) {
  const dark = shade(color, -30);
  switch (style) {
    case 'bald':
      return null;
    case 'buzz':
      return <Path d={`M ${cx - r + 2} ${cy - 4} Q ${cx} ${cy - r - 6} ${cx + r - 2} ${cy - 4} Q ${cx} ${cy - r + 4} ${cx - r + 2} ${cy - 4} Z`} fill={color} opacity={0.85} />;
    case 'spiky':
      return <Path d={`M ${cx - r} ${cy - 2} L ${cx - r + 2} ${cy - r - 4} L ${cx - 10} ${cy - r + 2} L ${cx - 6} ${cy - r - 10} L ${cx} ${cy - r + 1} L ${cx + 6} ${cy - r - 10} L ${cx + 10} ${cy - r + 2} L ${cx + r - 2} ${cy - r - 4} L ${cx + r} ${cy - 2} Q ${cx} ${cy - r + 8} ${cx - r} ${cy - 2} Z`} fill={color} stroke={dark} strokeWidth={1} />;
    case 'mohawk':
      return <Path d={`M ${cx - 6} ${cy - r + 4} Q ${cx - 8} ${cy - r - 18} ${cx} ${cy - r - 20} Q ${cx + 8} ${cy - r - 18} ${cx + 6} ${cy - r + 4} Z`} fill={color} stroke={dark} strokeWidth={1} />;
    case 'bun':
      return (
        <G>
          <Path d={`M ${cx - r} ${cy - 2} Q ${cx - r + 2} ${cy - r - 4} ${cx} ${cy - r - 2} Q ${cx + r - 2} ${cy - r - 4} ${cx + r} ${cy - 2} Q ${cx} ${cy - r + 6} ${cx - r} ${cy - 2} Z`} fill={color} />
          <Circle cx={cx} cy={cy - r - 8} r={9} fill={color} stroke={dark} strokeWidth={1} />
        </G>
      );
    case 'curly':
      return (
        <G>
          {[-14, -6, 2, 10].map((dx, i) => <Circle key={i} cx={cx + dx + 2} cy={cy - r + 2 - (i % 2) * 3} r={7} fill={color} />)}
        </G>
      );
    case 'ponytail':
    case 'short':
    default:
      return <Path d={`M ${cx - r} ${cy} Q ${cx - r - 2} ${cy - r - 4} ${cx + (side ? 6 : 2)} ${cy - r - 3} Q ${cx + r + 3} ${cy - r + 2} ${cx + r} ${cy - 2} Q ${cx + 8} ${cy - r + 10} ${cx - 6} ${cy - r + 8} Q ${cx - r + 6} ${cy - 10} ${cx - r} ${cy} Z`} fill={color} stroke={dark} strokeWidth={1} />;
  }
}

function accessoryHead(acc: string, cx: number, cy: number, r: number, color: string, side: boolean) {
  switch (acc) {
    case 'headband':
      return <Path d={`M ${cx - r + 1} ${cy - 9} Q ${cx} ${cy - 15} ${cx + r - 1} ${cy - 9}`} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />;
    case 'cap':
      return (
        <G>
          <Path d={`M ${cx - r} ${cy - 6} Q ${cx} ${cy - r - 14} ${cx + r} ${cy - 6} Z`} fill={color} />
          <Path d={side ? `M ${cx + 4} ${cy - 8} L ${cx + r + 14} ${cy - 5}` : `M ${cx - r + 2} ${cy - 6} Q ${cx} ${cy - 2} ${cx + r - 2} ${cy - 6}`} stroke={shade(color, -40)} strokeWidth={5} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'shades':
      return side ? (
        <Rect x={cx + 3} y={cy - 6} width={13} height={7} rx={3} fill={color} />
      ) : (
        <G>
          <Rect x={cx - 16} y={cy - 6} width={13} height={9} rx={4} fill={color} />
          <Rect x={cx + 3} y={cy - 6} width={13} height={9} rx={4} fill={color} />
          <Line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy - 3} stroke={color} strokeWidth={2} />
          <Rect x={cx - 14} y={cy - 5} width={5} height={2} rx={1} fill="rgba(255,255,255,0.5)" />
        </G>
      );
    case 'headphones':
      return (
        <G>
          <Path d={`M ${cx - r - 2} ${cy + 2} Q ${cx} ${cy - r - 18} ${cx + r + 2} ${cy + 2}`} stroke="#2A2F3B" strokeWidth={4} fill="none" />
          <Rect x={cx - r - 6} y={cy - 4} width={9} height={14} rx={4} fill={color} />
          <Rect x={cx + r - 3} y={cy - 4} width={9} height={14} rx={4} fill={color} />
        </G>
      );
    case 'crown':
      return <Path d={`M ${cx - 14} ${cy - r + 2} L ${cx - 16} ${cy - r - 14} L ${cx - 7} ${cy - r - 5} L ${cx} ${cy - r - 18} L ${cx + 7} ${cy - r - 5} L ${cx + 16} ${cy - r - 14} L ${cx + 14} ${cy - r + 2} Z`} fill={color} stroke="#B07A00" strokeWidth={1.5} />;
    default:
      return null;
  }
}

function Plates({ x, y, color, big = 22 }: { x: number; y: number; color: string; big?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={big} fill="#2A2F3B" stroke="#11141C" strokeWidth={2} />
      <Circle cx={x} cy={y} r={big * 0.72} fill="none" stroke={color} strokeWidth={3} />
      <Circle cx={x} cy={y} r={big * 0.2} fill={color} />
      <Ellipse cx={x - big * 0.35} cy={y - big * 0.4} rx={big * 0.25} ry={big * 0.12} fill="rgba(255,255,255,0.25)" />
    </G>
  );
}

function Barbell({ y, x1, x2, color }: { y: number; x1: number; x2: number; color: string }) {
  return (
    <G>
      <Line x1={x1 - 14} y1={y} x2={x2 + 14} y2={y} stroke={color} strokeWidth={5} strokeLinecap="round" />
      {[x1, x2].map((x, i) => (
        <G key={i}>
          <Rect x={x - 6} y={y - 24} width={12} height={48} rx={4} fill="#2A2F3B" stroke="#11141C" strokeWidth={1.5} />
          <Rect x={x + (i === 0 ? 6 : -11)} y={y - 18} width={5} height={36} rx={2} fill={color} />
          <Rect x={x - 4} y={y - 21} width={3} height={18} rx={1.5} fill="rgba(255,255,255,0.25)" />
        </G>
      ))}
    </G>
  );
}

function Dumbbell({ x, y, color, vertical = false }: { x: number; y: number; color: string; vertical?: boolean }) {
  return vertical ? (
    <G>
      <Line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke="#5A6075" strokeWidth={4} />
      <Rect x={x - 8} y={y - 18} width={16} height={8} rx={3} fill={color} stroke={shade(color, -60)} strokeWidth={1} />
      <Rect x={x - 8} y={y + 10} width={16} height={8} rx={3} fill={color} stroke={shade(color, -60)} strokeWidth={1} />
    </G>
  ) : (
    <G>
      <Line x1={x - 12} y1={y} x2={x + 12} y2={y} stroke="#5A6075" strokeWidth={4} />
      <Rect x={x - 18} y={y - 8} width={8} height={16} rx={3} fill={color} stroke={shade(color, -60)} strokeWidth={1} />
      <Rect x={x + 10} y={y - 8} width={8} height={16} rx={3} fill={color} stroke={shade(color, -60)} strokeWidth={1} />
    </G>
  );
}

function renderProps(ex: ExerciseId | null, ps: Pose, bar: string, db: string, progress: number): { back: React.ReactNode; front: React.ReactNode } {
  switch (ex) {
    case 'squat':
    case 'ohp':
      return { back: null, front: <Barbell y={(ps.lHa[1] + ps.rHa[1]) / 2 - 2} x1={ps.lHa[0] - 14} x2={ps.rHa[0] + 14} color={bar} /> };
    case 'curl':
      return { back: null, front: <G><Dumbbell x={ps.lHa[0]} y={ps.lHa[1]} color={db} /><Dumbbell x={ps.rHa[0]} y={ps.rHa[1]} color={db} /></G> };
    case 'lateral':
      return { back: null, front: <G><Dumbbell x={ps.lHa[0]} y={ps.lHa[1]} color={db} vertical /><Dumbbell x={ps.rHa[0]} y={ps.rHa[1]} color={db} vertical /></G> };
    case 'pulldown':
      return {
        back: (
          <G>
            <Rect x={20} y={4} width={8} height={244} rx={3} fill="#3A4152" />
            <Rect x={172} y={4} width={8} height={244} rx={3} fill="#3A4152" />
            <Rect x={20} y={4} width={160} height={10} rx={4} fill="#4A5266" />
            <Line x1={100} y1={14} x2={100} y2={(ps.lHa[1] + ps.rHa[1]) / 2} stroke="#9AA4BF" strokeWidth={2} />
            <Rect x={70} y={186} width={60} height={12} rx={5} fill="#2A2F3B" />
            <Rect x={94} y={198} width={12} height={46} fill="#3A4152" />
          </G>
        ),
        front: <Line x1={ps.lHa[0] - 16} y1={ps.lHa[1]} x2={ps.rHa[0] + 16} y2={ps.rHa[1]} stroke={bar} strokeWidth={5} strokeLinecap="round" />,
      };
    case 'bench':
      return {
        back: (
          <G>
            <Rect x={34} y={186} width={130} height={14} rx={6} fill="#7B4DFF" stroke="#36198F" strokeWidth={2} />
            <Rect x={44} y={200} width={8} height={44} fill="#3A4152" />
            <Rect x={146} y={200} width={8} height={44} fill="#3A4152" />
            <Rect x={58} y={60} width={6} height={130} fill="#4A5266" />
            <Rect x={52} y={84} width={18} height={6} rx={2} fill="#6B7390" />
          </G>
        ),
        front: <G><Line x1={ps.lHa[0]} y1={ps.lHa[1]} x2={ps.lHa[0] - 1} y2={ps.lHa[1]} stroke={bar} strokeWidth={6} /><Plates x={ps.lHa[0]} y={ps.lHa[1]} color={bar} /></G>,
      };
    case 'deadlift':
      return { back: null, front: <Plates x={ps.lHa[0]} y={ps.lHa[1] + 2} color={bar} big={24} /> };
    case 'legpress':
      return {
        back: (
          <G>
            <Path d="M 30 140 L 60 222 L 104 222 L 92 206 Z" fill="#2A2F3B" />
            <Rect x={24} y={130} width={16} height={84} rx={6} fill="#7B4DFF" transform="rotate(-22 32 172)" />
            <Line x1={100} y1={230} x2={196} y2={120} stroke="#4A5266" strokeWidth={8} strokeLinecap="round" />
          </G>
        ),
        front: (
          <G>
            <Rect x={(ps.lFt[0] + ps.rFt[0]) / 2 - 4} y={(ps.lFt[1] + ps.rFt[1]) / 2 - 30} width={14} height={56} rx={4} fill="#3A4152" stroke="#11141C" strokeWidth={1.5} transform={`rotate(-40 ${(ps.lFt[0] + ps.rFt[0]) / 2} ${(ps.lFt[1] + ps.rFt[1]) / 2})`} />
            <Plates x={(ps.lFt[0] + ps.rFt[0]) / 2 + 16 + progress * 2} y={(ps.lFt[1] + ps.rFt[1]) / 2 - 18} color={bar} big={16} />
          </G>
        ),
      };
    default:
      return { back: null, front: null };
  }
}

/** Small head-and-shoulders avatar for members, staff, opponents, leaderboards. */
export function Avatar({ seed, size = 44, shirt, ring }: { seed: number; size?: number; shirt?: string; ring?: string }) {
  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const hair = HAIR_COLORS[(seed >> 3) % HAIR_COLORS.length];
  const style = ['short', 'buzz', 'spiky', 'bun', 'curly', 'bald', 'ponytail', 'mohawk'][(seed >> 6) % 8];
  const shirtC = shirt ?? ['#3D7BFF', '#FF4D6D', '#5AD25A', '#FFC83D', '#8B5CFF', '#00C2A8'][(seed >> 9) % 6];
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Circle cx={30} cy={30} r={29} fill={ring ?? '#232B66'} />
      <Path d="M 8 60 Q 10 40 30 40 Q 50 40 52 60 Z" fill={shirtC} />
      {hairBack(style, 30, 26, 12, hair)}
      <Circle cx={30} cy={26} r={12} fill={skin} />
      <Circle cx={25.5} cy={26} r={1.7} fill="#1B1B2F" />
      <Circle cx={34.5} cy={26} r={1.7} fill="#1B1B2F" />
      <Path d="M 26 31 Q 30 34 34 31" stroke="#5A2A1A" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {hairFront(style, 30, 26, 12, hair, false)}
    </Svg>
  );
}
