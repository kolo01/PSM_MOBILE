import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { colors, radius, spacing } from "@/theme";

interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

/** Équivalent maison des Tabs Radix du web (@/components/ui/tabs). */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
}: SegmentedTabsProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  labelActive: {
    color: colors.foreground,
  },
});
