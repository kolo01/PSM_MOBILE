import { MD3LightTheme } from "react-native-paper";

/** Charte PSM — repris de my-health-journal-next/src/app/globals.css (valeurs oklch converties). */
export const colors = {
  primary: "#C0000C",
  primaryHover: "#D4000E",
  primaryForeground: "#FFFFFF",
  secondary: "#0A0A0A",
  secondaryForeground: "#FAFAFA",
  background: "#FFFFFF",
  foreground: "#0A0A0A",
  card: "#FFFFFF",
  muted: "#F2F2F2",
  mutedForeground: "#666666",
  border: "#E8E8E8",
  destructive: "#C0000C",
  destructiveForeground: "#FFFFFF",
  success: "#1E9E5A",
  successForeground: "#FFFFFF",
  warning: "#D97706",
  warningForeground: "#FFFFFF",
} as const;

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.primaryForeground,
    background: colors.background,
    surface: colors.card,
    error: colors.destructive,
    outline: colors.border,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;
