import { useRouter } from "expo-router";
import { Activity, AlertCircle, FileText, Pill, ShieldCheck, TrendingUp } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Button, Text } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { usePatient } from "@/hooks/use-patient";
import { consentsApi, consultationsApi, ordonnancesApi, protocolsApi } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

export default function DashboardScreen() {
  const router = useRouter();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";

  const { data: consultations = [] } = useQuery({
    queryKey: ["consultations", patientId],
    queryFn: () => consultationsApi.list(patientId),
    enabled: !!patientId,
  });
  const { data: protocols = [] } = useQuery({
    queryKey: ["protocols", patientId],
    queryFn: () => protocolsApi.list(patientId),
    enabled: !!patientId,
  });
  const { data: consents = [] } = useQuery({
    queryKey: ["consents", patientId],
    queryFn: () => consentsApi.list(patientId),
    enabled: !!patientId,
  });
  const { data: ordonnances = [] } = useQuery({
    queryKey: ["ordonnances", patientId],
    queryFn: () => ordonnancesApi.list(patientId),
    enabled: !!patientId,
  });

  if (!currentPatient) return null;

  const trackedProtocol = protocols.find((p) => p.statut === "actif") ?? protocols[0];
  const tension = (trackedProtocol?.mesures ?? [])
    .slice()
    .reverse()
    .map((m) => ({ value: m.valeur, label: m.date.slice(5, 10) }));
  const lastConsult = consultations[0];
  const activeConsents = consents.filter((c) => c.statut === "actif").length;

  return (
    <Screen>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Carnet PSM</Text>
        <Text style={styles.heroTitle}>Bonjour {currentPatient.prenom}</Text>
        <Text style={styles.heroSubtitle}>Voici votre tableau de bord santé.</Text>
        <View style={styles.heroCard}>
          <Text style={styles.heroCardLabel}>N° CMU</Text>
          <Text style={styles.heroCardValue}>{currentPatient.idCmu ?? "—"}</Text>
          <View style={styles.heroCardRow}>
            <Text style={styles.heroCardMeta}>{currentPatient.psmId}</Text>
            <Text style={styles.heroCardMeta}>·</Text>
            <Text style={styles.heroCardMeta}>{currentPatient.groupeSanguin ?? "—"}</Text>
          </View>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.statsGrid}>
        <Stat icon={FileText} label="Consultations" value={consultations.length} />
        <Stat icon={Pill} label="Ordonnances" value={ordonnances.length} />
        <Stat icon={Activity} label="Protocoles actifs" value={protocols.filter((p) => p.statut === "actif").length} />
        <Stat icon={ShieldCheck} label="Accès accordés" value={activeConsents} />
      </View>

      {/* Allergies / pathologies */}
      {(currentPatient.allergies.length > 0 || currentPatient.pathologiesChroniques.length > 0) && (
        <View style={styles.alertBanner}>
          <AlertCircle size={18} color={colors.warning} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Informations critiques visibles aux soignants</Text>
            <View style={styles.badgeRow}>
              {currentPatient.allergies.map((a) => (
                <Badge key={a} variant="destructive" label={`Allergie : ${a}`} />
              ))}
              {currentPatient.pathologiesChroniques.map((p) => (
                <Badge key={p} variant="secondary" label={p} />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Chart */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardLabel}>Suivi tension artérielle</Text>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>7 derniers jours</Text>
              <TrendingUp size={16} color={colors.success} />
            </View>
          </View>
        </View>
        {tension.length > 0 ? (
          <View style={styles.chartWrap}>
            <LineChart
              data={tension}
              color={colors.primary}
              thickness={2.5}
              height={180}
              curved
              hideRules={false}
              yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
              dataPointsColor={colors.primary}
            />
          </View>
        ) : (
          <Text style={styles.emptyText}>Aucune mesure enregistrée pour l'instant.</Text>
        )}
      </View>

      {/* Latest consultation */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Dernière consultation</Text>
        {lastConsult ? (
          <>
            <Text style={styles.consultSpecialite}>{lastConsult.specialite}</Text>
            <Text style={styles.consultMeta}>
              {lastConsult.professionnel} · {lastConsult.date}
            </Text>
            <Text style={styles.consultDiagnostic}>{lastConsult.diagnostic}</Text>
          </>
        ) : (
          <Text style={styles.emptyText}>Aucune consultation enregistrée.</Text>
        )}
        <Button mode="outlined" style={styles.dossierBtn} onPress={() => router.push("/(tabs)/dossier")}>
          Ouvrir mon dossier
        </Button>
      </View>
    </Screen>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <Icon size={16} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  heroKicker: { color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "700" },
  heroSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  heroCard: {
    marginTop: spacing.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  heroCardLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, textTransform: "uppercase" },
  heroCardValue: { color: "#fff", fontSize: 14, fontFamily: "monospace" },
  heroCardRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  heroCardMeta: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 12, color: colors.mutedForeground },
  statValue: { fontSize: 26, fontWeight: "700", marginTop: spacing.xs },
  alertBanner: {
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: "rgba(217,119,6,0.3)",
    backgroundColor: "rgba(217,119,6,0.05)",
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  alertContent: { flex: 1, gap: spacing.sm },
  alertTitle: { fontSize: 13, fontWeight: "600" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { fontSize: 13, color: colors.mutedForeground },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  chartWrap: { marginTop: spacing.sm },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
  consultSpecialite: { fontSize: 15, fontWeight: "600", marginTop: 2 },
  consultMeta: { fontSize: 12, color: colors.mutedForeground },
  consultDiagnostic: { fontSize: 13, marginTop: spacing.xs },
  dossierBtn: { marginTop: spacing.sm, borderColor: colors.border },
});
