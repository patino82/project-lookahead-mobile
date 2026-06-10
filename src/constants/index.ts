export const COLORS = {
  // Apex Construct Premium Palette
  primary: '#e07b35',   // Brand Orange
  secondary: '#f0944f', // Brand Soft Orange
  background: '#0b0e12', // Cyber Dark
  surface: 'rgba(22, 28, 36, 0.82)', 
  surfaceSolid: '#161c24',
  glass: 'rgba(255, 255, 255, 0.05)',
  ink: '#e6e9ec',       // Cyber White
  text: '#e6e9ec',
  textSecondary: '#7a8199', // Muted Blue/Gray
  textMuted: 'rgba(255, 255, 255, 0.2)',
  textFaint: 'rgba(255, 255, 255, 0.4)',
  textDisabled: 'rgba(255, 255, 255, 0.6)',
  textInverse: '#ffffff',
  muted: '#7a8199',
  error: '#ef4444',
  success: '#10b981',   // Emerald
  warning: '#f59e0b',   // Amber
  info: '#60a5fa',
  accentPurple: '#a78bfa',
  orange: '#e07b35',
  amber: '#f59e0b',
  rose: '#ef4444',
  border: 'rgba(255, 255, 255, 0.08)', 
  borderStrong: 'rgba(255, 255, 255, 0.1)',
  soft: '#11151c',
  phaseSurface: '#10151c',
  brand: '#e07b35',
  brandSubtle: 'rgba(224, 123, 53, 0.1)',
  brandBorder: 'rgba(224, 123, 53, 0.2)',
  warningSubtle: 'rgba(245, 158, 11, 0.12)',
  warningBorder: 'rgba(245, 158, 11, 0.24)',
  errorSubtle: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.2)',
  modalScrim: 'rgba(0, 0, 0, 0.72)',
  
  // High-Fidelity Gradients
  heroOverlay: ['rgba(224, 123, 53, 0.05)', 'transparent'] as const,
  heroGradient: ['#0b0e12', '#0f1319'] as const,
  brandGradient: ['#e07b35', '#f0944f'] as const,
  glassGradient: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 60,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 26,
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const SHADOWS = {
  deep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 70,
    elevation: 20,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 36,
    elevation: 10,
  },
};
