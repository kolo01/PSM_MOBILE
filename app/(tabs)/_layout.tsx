import { useEffect } from "react";
import { Redirect, Tabs, useRouter } from "expo-router";
import { CalendarDays, FileText, Home, Menu } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/auth-context";
import { colors } from "@/theme";

export default function TabsLayout() {
  const { hydrated, isPatient } = useAuth();

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!isPatient) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Accueil", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="dossier"
        options={{
          title: "Dossier",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rdv"
        options={{
          title: "RDV",
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "Plus", tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
