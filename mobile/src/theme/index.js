export const colors = {
  // Backgrounds
  background: '#0B0F19',
  card: '#161F30',
  cardHover: '#1E2B42',
  surface: '#121927',
  
  // Brand / Accents
  primary: '#E50914', // Drama Red / Coral accent
  primaryHover: '#FF2E3B',
  primarySoft: 'rgba(229, 9, 20, 0.15)',
  secondary: '#6366F1', // Indigo / K-Wave
  secondarySoft: 'rgba(99, 102, 241, 0.15)',
  accent: '#F59E0B', // Star / Rating Gold
  
  // Status Colors
  watching: '#3B82F6',
  planToWatch: '#8B5CF6',
  completed: '#10B981',
  dropped: '#EF4444',
  
  // Neutrals & Typography
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#1E293B',
  borderLight: '#334155',
  
  // States
  white: '#FFFFFF',
  black: '#000000',
  danger: '#F43F5E',
  success: '#10B981',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
};
