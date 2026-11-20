// Collectible item art: clothing, accessories, equipment skins, decorations, themes, trophies.
import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { ITEM_MAP, RARITY_INFO } from '@/game/config/items';

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Decoration art in a 40x40 box. Exported for use inside the gym scene. */
export function DecoArt({ art, color, color2 }: { art: string; color: string; color2?: string }) {
  switch (art) {
    case 'poster':
      return (
        <G>
          <Rect x={8} y={2} width={24} height={32} rx={2} fill="#fff" />
          <Rect x={10} y={4} width={20} height={20} fill={color} />
          <Path d="M 14 20 L 20 9 L 26 20 Z" fill="#FFC83D" />
          <Rect x={11} y={26} width={18} height={2.5} fill="#2A2F3B" />
          <Rect x={13} y={30} width={14} height={2} fill="#9AA4BF" />
        </G>
      );
    case 'plant':
      return (
        <G>
          <Path d="M 20 26 Q 8 18 10 6 Q 18 12 20 26" fill="#3DBF6A" />
          <Path d="M 20 26 Q 32 18 30 6 Q 22 12 20 26" fill="#5AD25A" />
          <Path d="M 20 26 Q 18 12 20 2 Q 22 12 20 26" fill="#2E9E5A" />
          <Path d="M 12 26 L 28 26 L 26 38 L 14 38 Z" fill="#C46A3A" />
          <Rect x={11} y={25} width={18} height={4} rx={1.5} fill="#E08A55" />
        </G>
      );
    case 'chalk':
      return (
        <G>
          <Rect x={18} y={20} width={4} height={18} fill="#4A5266" />
          <Ellipse cx={20} cy={38} rx={9} ry={2.5} fill="#2A2F3B" />
          <Path d="M 6 14 L 34 14 L 30 24 L 10 24 Z" fill="#4A5266" />
          <Ellipse cx={20} cy={14} rx={14} ry={4} fill="#F2F4FA" />
          <Circle cx={14} cy={11} r={2} fill="#fff" />
        </G>
      );
    case 'cooler':
      return (
        <G>
          <Rect x={11} y={18} width={18} height={20} rx={3} fill="#E8ECF5" />
          <Rect x={13} y={2} width={14} height={18} rx={6} fill={color} opacity={0.85} />
          <Rect x={15} y={5} width={3} height={10} rx={1.5} fill="rgba(255,255,255,0.6)" />
          <Rect x={17} y={24} width={6} height={3} fill="#2F7BFF" />
        </G>
      );
    case 'bag':
      return (
        <G>
          <Line x1={20} y1={0} x2={20} y2={6} stroke="#9AA4BF" strokeWidth={1.5} />
          <Rect x={12} y={6} width={16} height={32} rx={7} fill={color} />
          <Rect x={12} y={10} width={16} height={3} fill={shade(color, -40)} />
          <Rect x={12} y={31} width={16} height={3} fill={shade(color, -40)} />
          <Rect x={14} y={14} width={3} height={14} rx={1.5} fill="rgba(255,255,255,0.3)" />
        </G>
      );
    case 'banner':
      return (
        <G>
          <Line x1={6} y1={3} x2={34} y2={3} stroke="#C9A227" strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M 9 3 L 31 3 L 31 34 L 20 28 L 9 34 Z" fill={color} />
          <Path d="M 20 10 L 22 15 L 27 15 L 23 18 L 25 23 L 20 20 L 15 23 L 17 18 L 13 15 L 18 15 Z" fill="#FFC83D" />
        </G>
      );
    case 'shelf':
      return (
        <G>
          <Rect x={2} y={28} width={36} height={4} rx={1} fill="#7A4A2A" />
          {[8, 20, 32].map((x, i) => (
            <G key={i}>
              <Path d={`M ${x - 4} ${12 + i % 2 * 3} L ${x + 4} ${12 + i % 2 * 3} L ${x + 3} ${20} Q ${x} ${23} ${x - 3} ${20} Z`} fill={i === 1 ? '#FFC83D' : '#C9D1E6'} />
              <Rect x={x - 1} y={22} width={2} height={3} fill={i === 1 ? '#D9951A' : '#9AA4BF'} />
              <Rect x={x - 3.5} y={25} width={7} height={3} fill={i === 1 ? '#D9951A' : '#9AA4BF'} />
            </G>
          ))}
        </G>
      );
    case 'neon':
      return (
        <G>
          <Rect x={1} y={8} width={38} height={22} rx={5} fill="#12062A" stroke={color} strokeWidth={1.5} />
          <SvgText x={20} y={24} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">{color === '#FFD24D' ? '♛' : 'LIFT'}</SvgText>
          <Rect x={1} y={8} width={38} height={22} rx={5} fill={color} opacity={0.12} />
        </G>
      );
    case 'boombox':
      return (
        <G>
          <Path d="M 12 14 Q 20 4 28 14" stroke="#4A5266" strokeWidth={2.5} fill="none" />
          <Rect x={3} y={14} width={34} height={22} rx={4} fill={color} />
          <Circle cx={12} cy={25} r={6} fill="#11141C" stroke={color2 ?? '#3DE0FF'} strokeWidth={2} />
          <Circle cx={28} cy={25} r={6} fill="#11141C" stroke={color2 ?? '#3DE0FF'} strokeWidth={2} />
          <Rect x={17} y={17} width={6} height={3} fill={color2 ?? '#3DE0FF'} />
        </G>
      );
    case 'statue':
      return (
        <G>
          <Rect x={10} y={32} width={20} height={6} rx={1} fill="#8C7A4F" />
          <Circle cx={20} cy={9} r={4} fill={color} />
          <Path d="M 14 14 L 26 14 L 24 26 L 16 26 Z" fill={color} />
          <Path d="M 14 15 L 8 8 M 26 15 L 32 8" stroke={color} strokeWidth={4} strokeLinecap="round" />
          <Line x1={4} y1={7} x2={36} y2={7} stroke={shade(color, -40)} strokeWidth={2} />
          <Path d="M 17 26 L 16 32 M 23 26 L 24 32" stroke={color} strokeWidth={4} strokeLinecap="round" />
        </G>
      );
    default:
      return <Circle cx={20} cy={20} r={12} fill={color} />;
  }
}

/** Icon for any collectible, drawn in a 64x64 box with a rarity-coloured backdrop. */
export function ItemIcon({ itemId, size = 64, locked = false, plain = false }: { itemId: string; size?: number; locked?: boolean; plain?: boolean }) {
  const item = ITEM_MAP[itemId];
  if (!item) return null;
  const rar = RARITY_INFO[item.rarity];
  const c = item.color;
  const c2 = item.color2 ?? shade(c, -50);
  const gid = `it${itemId}`;
  let art: React.ReactNode = null;
  switch (item.category) {
    case 'shirt': {
      const a = item.art ?? 'tee';
      if (a === 'tank' || a === 'stringer') {
        const inset = a === 'stringer' ? 12 : 8;
        art = <Path d={`M ${18 + inset / 2} 12 Q 32 ${a === 'stringer' ? 30 : 22} ${46 - inset / 2} 12 L 48 22 L 46 52 L 18 52 L 16 22 Z`} fill={c} stroke={shade(c, -60)} strokeWidth={1.5} />;
      } else {
        art = (
          <G>
            <Path d="M 22 12 L 14 16 L 8 28 L 16 32 L 18 26 L 18 52 L 46 52 L 46 26 L 48 32 L 56 28 L 50 16 L 42 12 Q 32 20 22 12 Z" fill={c} stroke={shade(c, -60)} strokeWidth={1.5} />
            {a === 'hoodie' ? <Path d="M 24 12 Q 32 26 40 12" stroke={shade(c, -50)} strokeWidth={3} fill="none" /> : null}
            {item.color2 ? <Rect x={18} y={40} width={28} height={6} fill={item.color2} /> : null}
          </G>
        );
      }
      break;
    }
    case 'shorts':
      art = (
        <G>
          <Path d="M 16 14 L 48 14 L 52 48 L 36 48 L 32 30 L 28 48 L 12 48 Z" fill={c} stroke={shade(c, -60)} strokeWidth={1.5} />
          <Rect x={16} y={14} width={32} height={6} fill={shade(c, -30)} />
          {item.color2 ? <Path d="M 20 26 L 26 34 M 38 26 L 44 34" stroke={item.color2} strokeWidth={3} /> : null}
        </G>
      );
      break;
    case 'shoes':
      art = (
        <G>
          <Path d="M 8 40 Q 8 24 20 24 L 30 24 Q 36 34 54 36 Q 58 38 58 44 L 8 44 Z" fill={c} stroke={shade(c, -70)} strokeWidth={1.5} />
          <Rect x={8} y={44} width={50} height={6} rx={3} fill={shade(c, -40)} />
          <Path d="M 26 28 L 32 34 M 30 26 L 36 32" stroke={shade(c, -70)} strokeWidth={2} />
        </G>
      );
      break;
    case 'accessory': {
      const a = item.art;
      if (a === 'none') art = <Circle cx={32} cy={32} r={16} fill="none" stroke="#9AA4BF" strokeWidth={3} strokeDasharray="4 4" />;
      else if (a === 'headband') art = <Ellipse cx={32} cy={32} rx={20} ry={10} fill="none" stroke={c} strokeWidth={7} />;
      else if (a === 'cap') art = <G><Path d="M 12 38 Q 32 4 52 38 Z" fill={c} /><Path d="M 30 38 L 58 42" stroke={shade(c, -40)} strokeWidth={6} strokeLinecap="round" /></G>;
      else if (a === 'wristbands') art = <G><Rect x={12} y={22} width={16} height={20} rx={5} fill={c} /><Rect x={36} y={22} width={16} height={20} rx={5} fill={c} /></G>;
      else if (a === 'belt') art = <G><Rect x={6} y={24} width={52} height={16} rx={4} fill={c} /><Rect x={26} y={22} width={12} height={20} rx={2} fill="none" stroke="#C9D1E6" strokeWidth={3} /></G>;
      else if (a === 'headphones') art = <G><Path d="M 14 38 Q 32 4 50 38" stroke="#2A2F3B" strokeWidth={5} fill="none" /><Rect x={8} y={32} width={12} height={18} rx={5} fill={c} /><Rect x={44} y={32} width={12} height={18} rx={5} fill={c} /></G>;
      else if (a === 'shades') art = <G><Rect x={8} y={24} width={20} height={14} rx={6} fill={c} /><Rect x={36} y={24} width={20} height={14} rx={6} fill={c} /><Line x1={28} y1={29} x2={36} y2={29} stroke={c} strokeWidth={3} /><Rect x={11} y={26} width={8} height={3} rx={1.5} fill="rgba(255,255,255,0.5)" /></G>;
      else if (a === 'chain') art = <Path d="M 14 16 Q 32 54 50 16" stroke={c} strokeWidth={5} fill="none" strokeDasharray="5 2" />;
      else if (a === 'crown') art = <Path d="M 12 46 L 10 18 L 22 30 L 32 12 L 42 30 L 54 18 L 52 46 Z" fill={c} stroke="#B07A00" strokeWidth={2} />;
      break;
    }
    case 'barbell':
      art = (
        <G>
          <Line x1={4} y1={32} x2={60} y2={32} stroke={c} strokeWidth={4} strokeLinecap="round" />
          {[12, 52].map((x) => <Rect key={x} x={x - 5} y={16} width={10} height={32} rx={3} fill={item.color2 ?? '#2A2F3B'} stroke={c} strokeWidth={2} />)}
        </G>
      );
      break;
    case 'dumbbell':
      art = (
        <G>
          <Line x1={18} y1={32} x2={46} y2={32} stroke="#7A84A0" strokeWidth={5} />
          {[14, 50].map((x) => <Rect key={x} x={x - 7} y={18} width={14} height={28} rx={4} fill={c} stroke={shade(c, -60)} strokeWidth={1.5} />)}
          <Rect x={9} y={21} width={3} height={14} rx={1.5} fill="rgba(255,255,255,0.4)" />
        </G>
      );
      break;
    case 'decoration':
      art = <G transform="translate(12 12)"><DecoArt art={item.art ?? ''} color={c} color2={item.color2} /></G>;
      break;
    case 'theme':
      art = (
        <G>
          <Rect x={8} y={10} width={48} height={22} rx={3} fill={c2} />
          <Path d="M 8 32 L 56 32 L 60 54 L 4 54 Z" fill={shade(c2, -20)} />
          <Rect x={14} y={14} width={10} height={14} rx={2} fill={c} opacity={0.9} />
          <Circle cx={44} cy={20} r={5} fill={c} />
          <Line x1={8} y1={32} x2={56} y2={32} stroke={c} strokeWidth={2} />
        </G>
      );
      break;
    case 'trophy':
      art = (
        <G>
          <Path d="M 20 10 L 44 10 L 42 30 Q 32 40 22 30 Z" fill={c} stroke={shade(c, -60)} strokeWidth={1.5} />
          <Path d="M 20 14 Q 10 14 12 22 Q 14 28 22 28" stroke={c} strokeWidth={3} fill="none" />
          <Path d="M 44 14 Q 54 14 52 22 Q 50 28 42 28" stroke={c} strokeWidth={3} fill="none" />
          <Rect x={29} y={34} width={6} height={8} fill={shade(c, -40)} />
          <Rect x={20} y={42} width={24} height={8} rx={2} fill={c2} />
          <Rect x={24} y={13} width={4} height={12} rx={2} fill="rgba(255,255,255,0.45)" />
        </G>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(rar.color, 30)} stopOpacity={plain ? 0 : 0.55} />
          <Stop offset="1" stopColor={rar.color} stopOpacity={plain ? 0 : 0.25} />
        </LinearGradient>
      </Defs>
      {!plain ? <Rect x={1} y={1} width={62} height={62} rx={14} fill={`url(#${gid})`} stroke={rar.color} strokeWidth={2} /> : null}
      <G opacity={locked ? 0.35 : 1}>{art}</G>
      {locked ? (
        <G>
          <Rect x={22} y={30} width={20} height={16} rx={3} fill="#1A2150" stroke="#AEB7E0" strokeWidth={2} />
          <Path d="M 26 30 L 26 25 Q 32 17 38 25 L 38 30" stroke="#AEB7E0" strokeWidth={3} fill="none" />
        </G>
      ) : null}
    </Svg>
  );
}
