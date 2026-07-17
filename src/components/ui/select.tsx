import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu, Text } from "react-native-paper";
import { colors, radius, spacing } from "@/theme";

interface SelectProps {
  label: string;
  value: string;
  placeholder?: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

/** Équivalent maison du Select Radix du web, basé sur react-native-paper Menu. */
export function Select({ label, value, placeholder = "Choisir…", options, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setOpen(true)}
            style={styles.trigger}
            contentStyle={styles.triggerContent}
            textColor={value ? colors.foreground : colors.mutedForeground}
          >
            {value || placeholder}
          </Button>
        }
      >
        {options.map((opt) => (
          <Menu.Item
            key={opt}
            title={opt}
            onPress={() => {
              onChange(opt);
              setOpen(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", marginBottom: spacing.xs, color: colors.foreground },
  trigger: { borderColor: colors.border, borderRadius: radius.sm },
  triggerContent: { justifyContent: "flex-start" },
});
