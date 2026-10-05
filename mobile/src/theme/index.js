export const darkColors = {
  bg: '#07070E',
  nav: '#0B0B13',
  panel: '#11111B',
  panel2: '#151521',
  card: '#161424',
  text: '#F0EEE8',
  textSecondary: '#A3A1AC',
  muted: '#8D8B98',
  pink: '#eb5b78',
  pinkBright: '#eb5b78',
  pinkDark: '#d44865',
  red: '#eb5b78',
  redBright: '#eb5b78',
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
  inputBg: '#161424',
  inputBorder: 'rgba(255,255,255,0.1)',
  primary: '#eb5b78',
  primaryDark: '#d44865',
  accent: '#eb5b78',
  textMuted: '#8D8B98',
  tabBarBg: '#161424',
  tabBarInactive: 'rgba(255,255,255,0.45)',
  tabBarActive: '#eb5b78',
  headerBg: '#07070E',
  modalCard: '#161424',
};
export const warmColors = {
  bg: '#FBF5EC',        // Soothing warm cream background
  nav: '#F3E8D8',       // Warm sand cream for nav
  panel: '#FFFFFF',     // Clean panel surfaces
  panel2: '#F3E8D8',
  card: '#FFFFFF',      // White cards on cream bg for crisp hierarchy
  text: '#2C221A',      // High contrast deep warm brown, very easy on eyes
  textSecondary: '#5F5145',
  muted: '#7D6F63',     // Readable warm muted brown
  pink: '#E05B73',      // Warm coral rose accent
  pinkBright: '#E05B73',
  pinkDark: '#C7475F',
  red: '#E05B73',
  redBright: '#E05B73',
  line: 'rgba(44, 34, 26, 0.08)',
  gold: '#B87A04',      // Readable warm gold
  blue: '#2B6CB0',      // Muted warm blue
  green: '#276749',     // Muted warm green
  purple: '#6B46C1',    // Warm purple
  white: '#FFFFFF',
  black: '#000000',
  danger: '#DC2626',
  border: 'rgba(44, 34, 26, 0.10)',
  surface: '#FFFFFF',
  surfaceAlt: '#F3E8D8',
  inputBg: '#F3E8D8',
  inputBorder: 'rgba(44, 34, 26, 0.15)',
  primary: '#E05B73',
  primaryDark: '#C7475F',
  accent: '#E05B73',
  textMuted: '#7D6F63',
  tabBarBg: '#FFFFFF',
  tabBarInactive: '#8A7C70',
  tabBarActive: '#E05B73',
  headerBg: '#FBF5EC',
  modalCard: '#FFFFFF',
};

export const lightColors = {
  bg: '#F5F6FA',        // Clean crisp daylight background
  nav: '#FFFFFF',
  panel: '#FFFFFF',
  panel2: '#ECEEF4',
  card: '#FFFFFF',
  text: '#111019',      // Deep dark ink for excellent contrast
  textSecondary: '#4A4858',
  muted: '#6B697A',     // Readable daylight muted
  pink: '#eb5b78',
  pinkBright: '#eb5b78',
  pinkDark: '#d44865',
  red: '#eb5b78',
  redBright: '#eb5b78',
  line: 'rgba(0,0,0,0.07)',
  gold: '#B87A04',
  blue: '#1D4ED8',
  green: '#047857',
  purple: '#6D28D9',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#DC2626',
  border: 'rgba(0,0,0,0.08)',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEEF4',
  inputBg: '#ECEEF4',
  inputBorder: 'rgba(0,0,0,0.1)',
  primary: '#eb5b78',
  primaryDark: '#d44865',
  accent: '#eb5b78',
  textMuted: '#6B697A',
  tabBarBg: '#FFFFFF',
  tabBarInactive: '#7D7A8C',
  tabBarActive: '#eb5b78',
  headerBg: '#F5F6FA',
  modalCard: '#FFFFFF',
};

export const colors = darkColors;

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
