import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Pill } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { usePatient } from "@/hooks/use-patient";
import { documentsApi, ordonnancesApi } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

export default function OrdonnancesScreen() {
  const router = useRouter();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";

  const { data: ordonnances = [], refetch, isRefetching } = useQuery({
    queryKey: ["ordonnances", patientId],
    queryFn: () => ordonnancesApi.list(patientId),
    enabled: !!patientId,
  });
  const { data: importedDocs = [] } = useQuery({
    queryKey: ["documents", patientId],
    queryFn: () => documentsApi.list(patientId),
    enabled: !!patientId,
  });

  if (!currentPatient) return null;

  const importedOrdonnances = importedDocs.filter((d) => d.type === "ordonnance");

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <Pill size={22} color={colors.primary} />
        <Text style={styles.title}>Ordonnances</Text>
      </View>

      <View style={styles.list}>
        {ordonnances.map((o) => (
          <View key={o.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{o.prescripteur}</Text>
              <Text style={styles.dateText}>{o.date}</Text>
            </View>
            <View style={styles.medList}>
              {o.medicaments.map((m, i) => (
                <View key={`${o.id}-${i}`} style={styles.medRow}>
                  <Text style={styles.medNom}>{m.nom}</Text>
                  <Text style={styles.medDetail}>
                    {m.posologie} · {m.duree}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {importedOrdonnances.map((d) => (
          <View key={d.id} style={styles.importedCard}>
            <Text style={styles.cardTitle}>{d.praticien || "Ordonnance importée"}</Text>
            <Text style={styles.cardMetaSmall}>
              {d.date} · {d.filename}
            </Text>
            {d.note && <Text style={styles.noteText}>{d.note}</Text>}
            <Badge variant="warning" label="Document importé" />
          </View>
        ))}

        {ordonnances.length === 0 && importedOrdonnances.length === 0 && (
          <Text style={styles.emptyText}>Aucune ordonnance enregistrée.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: -spacing.sm },
  backText: { color: colors.mutedForeground, fontSize: 13 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 20, fontWeight: "700" },
  list: { gap: spacing.md },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  cardMetaSmall: { fontSize: 12, color: colors.mutedForeground },
  dateText: { fontSize: 13, color: colors.mutedForeground },
  medList: { gap: spacing.xs, marginTop: spacing.xs },
  medRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  medNom: { fontSize: 14, fontWeight: "500" },
  medDetail: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  importedCard: {
    borderWidth: 1,
    borderColor: "rgba(217,119,6,0.2)",
    backgroundColor: "rgba(217,119,6,0.05)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  noteText: { fontSize: 12, marginTop: 2 },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
});
