export const COLORS = {
  primary: '#38B6FF',        // GCR Sky Blue
  primaryDark: '#0FA2F5',
  slateDark: '#2C3E50',      // Charcoal / Slate Navy
  slateLight: '#607274',
  background: '#F4F8FA',     // Soft frost background
  cardBg: 'rgba(255, 255, 255, 0.92)',
  white: '#FFFFFF',
  accentGreen: '#00C853',
  border: 'rgba(56, 182, 255, 0.15)',
  shadow: '#2C3E50',
};

export const SHADOWS = {
  soft: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};
