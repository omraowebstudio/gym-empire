// GYM EMPIRE design system tokens.
export const C = {
  // brand
  blue: '#2F7BFF',
  blueLight: '#5FA0FF',
  blueDark: '#1A4FD1',
  purple: '#7B4DFF',
  purpleLight: '#A27BFF',
  purpleDark: '#4E26C9',
  gold: '#FFC83D',
  goldLight: '#FFE07A',
  goldDark: '#D9951A',
  green: '#3DDC84',
  greenDark: '#1FA85C',
  red: '#FF4D6D',
  redDark: '#C92A48',
  orange: '#FF8A3D',
  pink: '#FF5CC8',
  teal: '#00C2A8',
  // surfaces
  bg: '#0B1023',
  bg2: '#12183A',
  panel: '#1A2150',
  panel2: '#232B66',
  panelBorder: '#33408A',
  charcoal: '#1C1F2B',
  // text
  text: '#FFFFFF',
  textDim: '#AEB7E0',
  textMuted: '#7A84B8',
  shadow: '#05081A',
} as const;

export const GRADIENTS = {
  bg: ['#141B45', '#0B1023'] as const,
  blue: ['#5FA0FF', '#2F7BFF', '#1A4FD1'] as const,
  purple: ['#A27BFF', '#7B4DFF', '#4E26C9'] as const,
  gold: ['#FFE580', '#FFC83D', '#E39A12'] as const,
  green: ['#7BF0AE', '#3DDC84', '#1FA85C'] as const,
  red: ['#FF8AA0', '#FF4D6D', '#C92A48'] as const,
  gray: ['#6B7399', '#4A527A', '#363D60'] as const,
  panel: ['#2A3478', '#1A2150'] as const,
  panelLight: ['#34408F', '#232B66'] as const,
  hero: ['#3D2BB8', '#1A2A8F', '#0F1650'] as const,
};

export const FONT = {
  display: 'LilitaOne',
  body: 'Nunito-Bold',
  heavy: 'Nunito-Black',
} as const;

export const R = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const TEXT_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.45)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 0,
} as const;
