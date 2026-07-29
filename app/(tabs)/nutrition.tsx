import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Salad } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { usePatient } from "@/hooks/use-patient";
import { nutritionApi, vitalsApi } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

export default function NutritionScreen() {
  const router = useRouter();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";

  const {
    data: prescription,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["nutrition", patientId],
    queryFn: () => nutritionApi.get(patientId),
    enabled: !!patientId,
  });
  const { data: poidsReadings = [] } = useQuery({
    queryKey: ["vitals", patientId, "poids"],
    queryFn: () => vitalsApi.list(patientId, "poids"),
    enabled: !!patientId,
  });

  if (!currentPatient) return null;

  const latestPoids = poidsReadings[0];

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <Salad size={22} color={colors.primary} />
        <Text style={styles.title}>Suivi & nutrition</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Programme prescrit</Text>
        {prescription ? (
          <>
            <Text style={styles.cardTitle}>{prescription.regime}</Text>
            <Text style={styles.cardMeta}>{prescription.instructions}</Text>
            {prescription.alimentsDeconseilles.length > 0 && (
              <View style={styles.badgeRow}>
                {prescription.alimentsDeconseilles.map((a) => (
                  <Badge key={a} variant="destructive" label={a} />
                ))}
              </View>
            )}
            <Text style={styles.cardMetaSmall}>
              Prescrit par {prescription.prescripteur} · {prescription.date}
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>Aucun programme nutritionnel prescrit.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Poids & IMC</Text>
        {latestPoids ? (
          <>
            <Text style={styles.statValue}>{latestPoids.valeur} kg</Text>
            <Text style={styles.cardMetaSmall}>Dernière mesure le {latestPoids.date}</Text>
            {prescription?.objectifPoids && (
              <Text style={styles.cardMeta}>Objectif : {prescription.objectifPoids} kg</Text>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>Aucune mesure de poids enregistrée.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Activité physique</Text>
        {prescription?.objectifPas ? (
          <Text style={styles.cardMeta}>Objectif : {prescription.objectifPas} pas / jour</Text>
        ) : (
          <Text style={styles.emptyText}>Non suivie pour le moment.</Text>
        )}
        <Badge variant="outline" label="Bientôt disponible" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Hydratation</Text>
        <Text style={styles.emptyText}>Non suivie pour le moment.</Text>
        <Badge variant="outline" label="Bientôt disponible" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Journal alimentaire</Text>
        <Text style={styles.emptyText}>Auto-déclaration à venir.</Text>
        <Badge variant="outline" label="Bientôt disponible" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: -spacing.sm },
  backText: { color: colors.mutedForeground, fontSize: 13 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 20, fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase" },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  cardMeta: { fontSize: 13, color: colors.mutedForeground },
  cardMetaSmall: { fontSize: 12, color: colors.mutedForeground },
  statValue: { fontSize: 22, fontWeight: "700" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
});
