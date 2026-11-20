// Cartoon 2.5D equipment sprites. Each sprite is drawn in an 80x70 box, anchored at its
// bottom centre (40, 66), with a top face + front face for a chunky pseudo-3D look.
import React from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { EquipmentId } from '@/game/types';
import { EQUIPMENT_MAP } from '@/game/config/equipment';

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const METAL = '#4A5266';
const METAL_D = '#2A2F3B';
const METAL_L = '#7A84A0';

function Plate({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={r * 0.45} ry={r} fill={METAL_D} />
      <Ellipse cx={x + 1.5} cy={y} rx={r * 0.38} ry={r * 0.86} fill={color} />
      <Ellipse cx={x + 1.5} cy={y - r * 0.35} rx={r * 0.15} ry={r * 0.2} fill="rgba(255,255,255,0.35)" />
    </G>
  );
}

export function EquipmentSprite({ id, level = 1, skin }: { id: EquipmentId; level?: number; skin?: string }) {
  const def = EQUIPMENT_MAP[id];
  const col = def.color;
  const bar = skin ?? '#B8C0D4';
  const tier = level >= 10 ? 'gold' : level >= 6 ? 'silver' : 'base';
  const trim = tier === 'gold' ? '#FFC83D' : tier === 'silver' ? '#DDE3F2' : col;
  let body: React.ReactNode;
  switch (id) {
    case 'flat_bench':
      body = (
        <G>
          <Rect x={18} y={50} width={6} height={16} fill={METAL_D} />
          <Rect x={56} y={50} width={6} height={16} fill={METAL_D} />
          <Path d="M 10 44 L 70 44 L 66 36 L 14 36 Z" fill={shade(col, 40)} />
          <Rect x={10} y={44} width={60} height={9} rx={3} fill={col} />
          <Rect x={14} y={38} width={20} height={3} rx={1.5} fill="rgba(255,255,255,0.4)" />
        </G>
      );
      break;
    case 'dumbbell_rack':
      body = (
        <G>
          <Path d="M 8 40 L 72 40 L 68 32 L 12 32 Z" fill={METAL_L} />
          <Rect x={8} y={40} width={64} height={8} rx={2} fill={METAL} />
          <Rect x={12} y={48} width={5} height={18} fill={METAL_D} />
          <Rect x={63} y={48} width={5} height={18} fill={METAL_D} />
          {[16, 28, 40, 52, 64].map((x, i) => (
            <G key={i}>
              <Line x1={x - 4} y1={34} x2={x + 4} y2={34} stroke={METAL_D} strokeWidth={2} />
              <Rect x={x - 6} y={29 - i * 0.4} width={4} height={9 + i * 0.6} rx={1.5} fill={i % 2 ? col : shade(col, -30)} />
              <Rect x={x + 2} y={29 - i * 0.4} width={4} height={9 + i * 0.6} rx={1.5} fill={i % 2 ? col : shade(col, -30)} />
            </G>
          ))}
        </G>
      );
      break;
    case 'barbell_station':
      body = (
        <G>
          <Path d="M 4 62 L 76 62 L 70 54 L 10 54 Z" fill="#6B4A2E" />
          <Rect x={4} y={62} width={72} height={4} fill="#4A3220" />
          <Line x1={6} y1={46} x2={74} y2={46} stroke={bar} strokeWidth={3} strokeLinecap="round" />
          <Plate x={16} y={46} r={11} color={col} />
          <Plate x={64} y={46} r={11} color={col} />
        </G>
      );
      break;
    case 'squat_rack':
      body = (
        <G>
          <Rect x={10} y={8} width={6} height={58} fill={METAL} />
          <Rect x={64} y={8} width={6} height={58} fill={METAL} />
          <Rect x={18} y={2} width={6} height={56} fill={METAL_D} />
          <Rect x={56} y={2} width={6} height={56} fill={METAL_D} />
          <Rect x={10} y={4} width={60} height={5} rx={2} fill={METAL_L} />
          <Rect x={8} y={62} width={64} height={4} fill={METAL_D} />
          <Line x1={4} y1={26} x2={76} y2={26} stroke={bar} strokeWidth={3} strokeLinecap="round" />
          <Plate x={8} y={26} r={9} color={col} />
          <Plate x={72} y={26} r={9} color={col} />
          <Rect x={10} y={8} width={2} height={50} fill="rgba(255,255,255,0.25)" />
          <Rect x={30} y={60} width={20} height={3} fill={trim} />
        </G>
      );
      break;
    case 'treadmill':
      body = (
        <G>
          <Path d="M 6 58 L 70 58 L 74 50 L 14 50 Z" fill={METAL_D} />
          <Path d="M 10 56 L 68 56 L 71 51 L 16 51 Z" fill="#1B1F2A" />
          <Rect x={6} y={58} width={64} height={6} rx={2} fill={METAL} />
          <Rect x={58} y={20} width={5} height={34} fill={METAL} />
          <Rect x={50} y={14} width={22} height={12} rx={3} fill={col} />
          <Rect x={53} y={16} width={10} height={6} rx={1} fill="#9EF0FF" />
          <Rect x={52} y={16} width={6} height={2} fill="rgba(255,255,255,0.5)" />
        </G>
      );
      break;
    case 'plate_tree':
      body = (
        <G>
          <Ellipse cx={40} cy={62} rx={20} ry={5} fill={METAL_D} />
          <Rect x={37} y={10} width={6} height={52} fill={METAL} />
          <Plate x={30} y={50} r={10} color={col} />
          <Plate x={50} y={46} r={12} color={shade(col, -20)} />
          <Plate x={30} y={28} r={8} color={shade(col, 20)} />
          <Plate x={50} y={24} r={9} color={col} />
        </G>
      );
      break;
    case 'cable_machine':
      body = (
        <G>
          <Rect x={6} y={4} width={8} height={62} fill={METAL} />
          <Rect x={66} y={4} width={8} height={62} fill={METAL} />
          <Rect x={6} y={2} width={68} height={6} rx={2} fill={METAL_L} />
          <Rect x={4} y={34} width={12} height={22} rx={2} fill={col} />
          <Rect x={64} y={34} width={12} height={22} rx={2} fill={col} />
          <Line x1={14} y1={8} x2={30} y2={44} stroke="#C9D1E6" strokeWidth={1.5} />
          <Line x1={66} y1={8} x2={50} y2={44} stroke="#C9D1E6" strokeWidth={1.5} />
          <Circle cx={30} cy={45} r={3} fill={trim} />
          <Circle cx={50} cy={45} r={3} fill={trim} />
          <Rect x={4} y={62} width={72} height={4} fill={METAL_D} />
        </G>
      );
      break;
    case 'lat_pulldown':
      body = (
        <G>
          <Rect x={50} y={4} width={8} height={62} fill={METAL} />
          <Rect x={20} y={4} width={40} height={6} rx={2} fill={METAL_L} />
          <Line x1={24} y1={10} x2={24} y2={24} stroke="#C9D1E6" strokeWidth={1.5} />
          <Line x1={8} y1={24} x2={40} y2={24} stroke={bar} strokeWidth={3} strokeLinecap="round" />
          <Rect x={14} y={44} width={24} height={7} rx={3} fill={col} />
          <Rect x={23} y={51} width={6} height={15} fill={METAL_D} />
          <Rect x={52} y={36} width={14} height={22} rx={2} fill={shade(col, -30)} />
          <Rect x={14} y={34} width={24} height={4} rx={2} fill={shade(col, 20)} />
        </G>
      );
      break;
    case 'leg_press':
      body = (
        <G>
          <Path d="M 4 66 L 76 66 L 76 60 L 4 60 Z" fill={METAL_D} />
          <Line x1={20} y1={58} x2={70} y2={12} stroke={METAL} strokeWidth={6} strokeLinecap="round" />
          <Path d="M 8 58 L 24 58 L 16 30 L 6 34 Z" fill={col} />
          <Rect x={52} y={14} width={20} height={20} rx={3} fill={METAL_L} transform="rotate(-42 62 24)" />
          <Plate x={70} y={22} r={8} color={trim} />
        </G>
      );
      break;
    case 'smith_machine':
      body = (
        <G>
          <Rect x={8} y={4} width={8} height={62} fill={METAL} />
          <Rect x={64} y={4} width={8} height={62} fill={METAL} />
          <Rect x={8} y={2} width={64} height={6} rx={2} fill={METAL_L} />
          <Line x1={4} y1={30} x2={76} y2={30} stroke={bar} strokeWidth={3} strokeLinecap="round" />
          <Plate x={8} y={30} r={8} color={col} />
          <Plate x={72} y={30} r={8} color={col} />
          <Rect x={26} y={50} width={28} height={7} rx={3} fill={shade(col, -20)} />
          <Rect x={4} y={62} width={72} height={4} fill={METAL_D} />
        </G>
      );
      break;
    case 'rowing_machine':
      body = (
        <G>
          <Line x1={6} y1={58} x2={74} y2={50} stroke={METAL} strokeWidth={5} strokeLinecap="round" />
          <Circle cx={66} cy={40} r={13} fill={col} stroke={METAL_D} strokeWidth={3} />
          <Circle cx={66} cy={40} r={5} fill={METAL_L} />
          <Rect x={18} y={48} width={16} height={6} rx={3} fill={METAL_D} />
          <Rect x={4} y={60} width={10} height={6} fill={METAL_D} />
        </G>
      );
      break;
    case 'power_platform':
      body = (
        <G>
          <Path d="M 2 58 L 78 58 L 72 44 L 8 44 Z" fill="#7A5232" />
          <Path d="M 22 58 L 58 58 L 55 44 L 25 44 Z" fill="#9C6B42" />
          <Rect x={2} y={58} width={76} height={8} fill="#4A3220" />
          <Line x1={4} y1={38} x2={76} y2={38} stroke={bar} strokeWidth={3} strokeLinecap="round" />
          <Plate x={14} y={38} r={13} color={col} />
          <Plate x={66} y={38} r={13} color={col} />
          <Rect x={30} y={47} width={20} height={3} fill={trim} />
        </G>
      );
      break;
    case 'hack_squat':
      body = (
        <G>
          <Path d="M 10 66 L 70 66 L 66 58 L 14 58 Z" fill={METAL_D} />
          <Line x1={22} y1={58} x2={52} y2={6} stroke={METAL} strokeWidth={7} strokeLinecap="round" />
          <Line x1={44} y1={58} x2={70} y2={12} stroke={METAL} strokeWidth={7} strokeLinecap="round" />
          <Rect x={30} y={20} width={16} height={30} rx={4} fill={col} transform="rotate(30 38 35)" />
          <Plate x={64} y={22} r={9} color={trim} />
        </G>
      );
      break;
    case 'cryo_pod':
      body = (
        <G>
          <Ellipse cx={40} cy={62} rx={30} ry={5} fill={METAL_D} />
          <Rect x={16} y={8} width={48} height={56} rx={24} fill="#E8F6FF" stroke={col} strokeWidth={3} />
          <Rect x={24} y={16} width={32} height={34} rx={16} fill={col} opacity={0.65} />
          <Rect x={28} y={20} width={8} height={20} rx={4} fill="rgba(255,255,255,0.7)" />
          <Circle cx={40} cy={56} r={3} fill="#3DFFB0" />
        </G>
      );
      break;
  }
  return (
    <G>
      <Ellipse cx={40} cy={66} rx={34} ry={5} fill="rgba(0,0,0,0.3)" />
      {body}
      {tier !== 'base' ? <Circle cx={72} cy={6} r={4} fill={trim} stroke="#fff" strokeWidth={1} /> : null}
    </G>
  );
}

/** Mini member figure (top-down-ish) drawn in a 20x30 box, anchored bottom-centre (10, 28). */
export function MemberFigure({ seed, tier }: { seed: number; tier: 'basic' | 'plus' | 'vip' }) {
  const skins = ['#FFDCC2', '#F3C29B', '#D9A066', '#B97A48', '#8D5A34', '#5E3A22'];
  const shirts = tier === 'vip' ? ['#FFC83D', '#FFD24D'] : tier === 'plus' ? ['#8B5CFF', '#A27BFF'] : ['#3D7BFF', '#FF4D6D', '#5AD25A', '#00C2A8', '#FF8A3D'];
  const hair = ['#1E1A18', '#5A3A22', '#A8642E', '#E6C27A', '#D94A3D'][(seed >> 4) % 5];
  const skin = skins[seed % skins.length];
  const shirt = shirts[(seed >> 2) % shirts.length];
  return (
    <G>
      <Ellipse cx={10} cy={28} rx={8} ry={2.5} fill="rgba(0,0,0,0.3)" />
      <Rect x={6} y={18} width={3.5} height={10} rx={1.7} fill="#2A2F3B" />
      <Rect x={10.5} y={18} width={3.5} height={10} rx={1.7} fill="#2A2F3B" />
      <Rect x={3.5} y={9} width={13} height={12} rx={5} fill={shirt} />
      <Circle cx={10} cy={6} r={5.2} fill={skin} />
      <Path d="M 4.8 5.5 Q 10 -1 15.2 5.5 Q 10 2.8 4.8 5.5 Z" fill={hair} />
      {tier === 'vip' ? <Path d="M 6.5 1.5 L 7.5 -1.5 L 10 0.5 L 12.5 -1.5 L 13.5 1.5 Z" fill="#FFC83D" /> : null}
    </G>
  );
}
