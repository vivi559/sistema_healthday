/**
 * Theme do Health Day
 * Mantém a estrutura original e adiciona as cores do app.
 */

import { Platform } from 'react-native';

// ─── Cores originais (mantidas) ───────────────────────────────────────────────
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Paleta Health Day ────────────────────────────────────────────────────────
export const HD = {
  // Primárias
  primary:        '#2DD4BF',  // teal — botões ativos, títulos, ícones
  primaryLight:   '#A7F3D0',  // teal claro — fundo de cards
  primaryDark:    '#0D9488',  // teal escuro — pressed/hover

  // Secundárias
  secondary:      '#F97316',  // laranja — títulos de seção, destaques
  secondaryLight: '#FED7AA',  // laranja claro — fundo de botões secundários
  accent:         '#EF4444',  // vermelho — agenda, alertas, lembretes

  // Fundos
  background:     '#F5F0EB',  // bege — fundo geral das telas
  bgDark:         '#1F2937',  // fundo modo escuro
  cardLight:      '#E8F8F5',  // card modo claro
  cardDark:       '#374151',  // card modo escuro

  // Tab bar
  tabBar:         '#9CA3AF',  // pill da tab bar
  tabBarActive:   '#2DD4BF',  // aba ativa
  tabBarIcon:     '#FFFFFF',  // ícone ativo

  // Texto
  textDark:       '#111827',
  textMedium:     '#374151',
  textLight:      '#6B7280',
  textWhite:      '#FFFFFF',

  // Inputs
  inputBorder:    '#F97316',  // borda laranja
  inputBg:        '#FFFFFF',
  placeholder:    '#9CA3AF',

  // Macros (dieta)
  carbo:          '#2DD4BF',
  protein:        '#F97316',
  fat:            '#EF4444',
  kcal:           '#8B5CF6',

  // Dias de treino
  dayInactive:    '#4B5563',
  dayActive:      '#2DD4BF',

  // Utilitários
  white:          '#FFFFFF',
  black:          '#000000',
  divider:        '#E5E7EB',
  shadow:         'rgba(0,0,0,0.1)',
  transparent:    'transparent',
};

// ─── Temas claro / escuro Health Day ─────────────────────────────────────────
export const lightTheme = {
  background: HD.background,
  card:       HD.cardLight,
  text:       HD.textDark,
  subtext:    HD.textLight,
  border:     HD.divider,
  tabBar:     HD.tabBar,
};

export const darkTheme = {
  background: HD.bgDark,
  card:       HD.cardDark,
  text:       HD.textWhite,
  subtext:    '#9CA3AF',
  border:     '#4B5563',
  tabBar:     '#1F2937',
};