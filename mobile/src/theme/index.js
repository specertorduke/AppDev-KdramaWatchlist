export const colors = {
  bg: '#07070E',
  nav: '#0B0B13',
  panel: '#11111B',
  panel2: '#151521',
  text: '#F0EEE8',
  muted: '#8D8B98',
  pink: '#F5A9C4',
  pinkBright: '#F5A9C4',
  pinkDark: '#E085A6',
  red: '#F5A9C4',
  redBright: '#F5A9C4',
  line: 'rgba(255,255,255,0.08)',
  gold: '#FFD76A',
  blue: '#60A5FA',
  green: '#10B981',
  purple: '#8B5CF6',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#EF4444',
  border: 'rgba(255,255,255,0.08)',
  surface: '#11111B',
  surfaceAlt: '#151521',
  primary: '#F5A9C4',
  primaryDark: '#E085A6',
  textMuted: '#8D8B98',
};

export const spacing = {
  xs: 6,
  sm: 9,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const fonts = {
  thin: 'Poppins_100Thin',
  extraLight: 'Poppins_200ExtraLight',
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
  black: 'Poppins_900Black',
};

export const typography = {
  h1: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.muted,
  },
  micro: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.muted,
  },
};
