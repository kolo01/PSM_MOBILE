import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { colors, radius } from "@/theme";

type BadgeVariant = "default" | "outline" | "secondary" | "success" | "warning" | "destructive";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <View style={[styles.base, VARIANT_STYLES[variant].container]}>
      <Text style={[styles.text, VARIANT_STYLES[variant].text]}>{label}</Text>
    </View>
  );
}

const VARIANT_STYLES: Record<BadgeVariant, { container: object; text: object }> = {
  default: { container: { backgroundColor: colors.primary }, text: { color: colors.primaryForeground } },
  secondary: { container: { backgroundColor: colors.muted }, text: { color: colors.foreground } },
  outline: {
    container: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
    text: { color: colors.foreground },
  },
  success: { container: { backgroundColor: "#E4F7EC" }, text: { color: colors.success } },
  warning: { container: { backgroundColor: "#FCF1E3" }, text: { color: colors.warning } },
  destructive: {
    container: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.destructive },
    text: { color: colors.destructive },
  },
};

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
