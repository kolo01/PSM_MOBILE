import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, History, ShieldCheck } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Screen } from "@/components/ui/screen";
import { usePatient } from "@/hooks/use-patient";
import { journalApi } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

export default function JournalScreen() {
  const router = useRouter();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";

  const { data: entries = [], refetch, isRefetching } = useQuery({
    queryKey: ["journal", patientId],
    queryFn: () => journalApi.list(patientId),
    enabled: !!patientId,
  });

  if (!currentPatient) return null;

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <History size={22} color={colors.primary} />
        <Text style={styles.title}>Journal d'accès</Text>
      </View>
      <Text style={styles.subtitle}>Historique des consultations et modifications de votre dossier.</Text>

      <View style={styles.list}>
        {entries.map((e) => (
          <View key={e.id} style={styles.row}>
            <View style={styles.iconWrap}>
              <ShieldCheck size={16} color={colors.primary} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.rowTitle}>{e.action}</Text>
              <Text style={styles.rowSubtitle}>
                {e.acteur} — {e.ressource}
              </Text>
              <Text style={styles.rowDate}>{e.createdAt.replace("T", " · ").slice(0, 19)}</Text>
            </View>
          </View>
        ))}
        {entries.length === 0 && <Text style={styles.emptyText}>Aucune entrée dans le journal.</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: -spacing.sm },
  backText: { color: colors.mutedForeground, fontSize: 13 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, color: colors.mutedForeground },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  rowDate: { fontSize: 11, color: colors.mutedForeground, fontFamily: "monospace", marginTop: 4 },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
});
