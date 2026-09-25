export const Colors = {
  background: '#05060A',
  backgroundElevated: '#0A0B14',
  surface: 'rgba(20, 22, 38, 0.6)',
  surfaceActive: 'rgba(30, 32, 55, 0.8)',
  border: 'rgba(80, 90, 140, 0.2)',
  borderActive: 'rgba(120, 130, 200, 0.4)',
  primary: '#4A7CFF',
  primaryGlow: '#6B9DFF',
  secondary: '#9B6DFF',
  secondaryGlow: '#B88FFF',
  accent: '#00E5FF',
  accentGlow: '#33EEFF',
  text: '#F0F2FF',
  textSecondary: '#8A8FB0',
  textMuted: '#5A5F7A',
  success: '#3DD68C',
  warning: '#FFB74D',
  error: '#FF5C7A',
  orbIdle: '#4A7CFF',
  orbListening: '#00E5FF',
  orbThinking: '#9B6DFF',
  orbSpeaking: '#4A7CFF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const FontSizes = {
  caption: 12,
  body: 15,
  bodyLarge: 17,
  title: 22,
  largeTitle: 30,
  huge: 42,
};

export const Fonts = {
  regular: 'Outfit-Regular',
  medium: 'Outfit-Medium',
  bold: 'Outfit-Bold',
  light: 'Outfit-Light',
};

export type AssistantStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'ready';

export const statusLabels: Record<AssistantStatus, string> = {
  idle: 'Ready',
  listening: "I'm listening",
  thinking: 'Thinking...',
  speaking: 'Speaking',
  ready: 'Ready',
};
