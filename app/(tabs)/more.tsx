import { useRouter } from "expo-router";
import {
  FlaskConical,
  History,
  LogOut,
  Pill,
  Salad,
  Shield,
  ShieldCheck,
  Syringe,
  User,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { useAuth } from "@/auth/auth-context";
import { usePatient } from "@/hooks/use-patient";
import { colors, radius, spacing } from "@/theme";

const PHASE_2_SCREENS = [
  { icon: Pill, label: "Ordonnances" },
  { icon: FlaskConical, label: "Examens" },
  { icon: Salad, label: "Suivi & nutrition" },
  { icon: Syringe, label: "Vaccinations" },
  { icon: Shield, label: "Assurances" },
  { icon: ShieldCheck, label: "Mes accès" },
  { icon: History, label: "Journal" },
  { icon: User, label: "Profil" },
];

export default function MoreScreen() {
  const { logout } = useAuth();
  const { data: currentPatient } = usePatient();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    Toast.show({ type: "success", text1: "Déconnecté" });
    router.replace("/login");
  };

  return (
    <Screen>
      <View>
        <Text style={styles.title}>
          {currentPatient?.prenom} {currentPatient?.nom}
        </Text>
        <Text style={styles.subtitle}>{currentPatient?.psmId}</Text>
      </View>

      <View style={styles.list}>
        {PHASE_2_SCREENS.map(({ icon: Icon, label }) => (
          <View key={label} style={styles.row}>
            <View style={styles.rowGap}>
              <Icon size={18} color={colors.mutedForeground} />
              <Text style={styles.rowLabel}>{label}</Text>
            </View>
            <Badge variant="outline" label="Bientôt disponible" />
          </View>
        ))}
      </View>

      <Button
        mode="outlined"
        textColor={colors.destructive}
        style={styles.logoutBtn}
        icon={() => <LogOut size={16} color={colors.destructive} />}
        onPress={handleLogout}
      >
        Déconnexion
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 12, color: colors.mutedForeground, fontFamily: "monospace" },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowGap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowLabel: { fontSize: 14 },
  logoutBtn: { borderColor: "rgba(192,0,12,0.4)", marginTop: spacing.md },
});
