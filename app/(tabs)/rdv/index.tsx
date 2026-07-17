import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Phone, Plus, Video, X } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import { Badge } from "@/components/ui/badge";
import { OtpConfirmDialog } from "@/components/ui/otp-confirm-dialog";
import { Screen } from "@/components/ui/screen";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { usePatient } from "@/hooks/use-patient";
import { rdvApi, type Rdv } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

type Tab = "prochains" | "historique";

const STATUT_VARIANT: Record<Rdv["statut"], "success" | "warning" | "outline"> = {
  Confirmé: "success",
  "En attente": "warning",
  Annulé: "outline",
  Passé: "outline",
};

export default function RdvListScreen() {
  const router = useRouter();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("prochains");
  const [cancelTarget, setCancelTarget] = useState<Rdv | null>(null);

  const { data: rdvs = [], refetch, isFetching } = useQuery({
    queryKey: ["rdv", patientId],
    queryFn: () => rdvApi.list(patientId),
    enabled: !!patientId,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => rdvApi.updateStatut(patientId, id, "Annulé"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rdv", patientId] });
      Toast.show({ type: "success", text1: "RDV annulé. Le secrétariat est notifié." });
    },
    onError: () => Toast.show({ type: "error", text1: "Échec de l'annulation" }),
  });

  if (!currentPatient) return null;

  const upcoming = rdvs.filter((r) => r.statut !== "Passé");
  const past = rdvs.filter((r) => r.statut === "Passé");
  const list = tab === "prochains" ? upcoming : past;

  return (
    <Screen refreshing={isFetching} onRefresh={refetch}>
      <View style={styles.headerRow}>
        <View style={styles.flex1}>
          <View style={styles.titleRow}>
            <CalendarDays size={22} color={colors.primary} />
            <Text style={styles.title}>Mes rendez-vous</Text>
          </View>
          <Text style={styles.subtitle}>
            Vous recevrez un rappel SMS la veille à 18h et 2h avant le RDV.
          </Text>
        </View>
      </View>

      <Button
        mode="contained"
        buttonColor={colors.primary}
        icon={() => <Plus size={16} color="#fff" />}
        onPress={() => router.push("/(tabs)/rdv/nouveau")}
      >
        Prendre un rendez-vous
      </Button>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "prochains", label: `Prochains (${upcoming.length})` },
          { value: "historique", label: "Historique" },
        ]}
      />

      <View style={styles.list}>
        {list.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>
                  {r.specialite} · {r.professionnel}
                </Text>
                <View style={styles.rowGap}>
                  {r.type === "Téléconsultation" ? (
                    <Video size={12} color={colors.mutedForeground} />
                  ) : (
                    <MapPin size={12} color={colors.mutedForeground} />
                  )}
                  <Text style={styles.cardMetaSmall}>{r.etablissement}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(r.date).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
                </Text>
              </View>
              <Badge variant={STATUT_VARIANT[r.statut]} label={r.statut} />
            </View>

            {tab === "prochains" && r.statut !== "Annulé" && (
              <View style={styles.actionsRow}>
                {r.type === "Téléconsultation" && r.lien && (
                  <Button mode="contained" buttonColor={colors.primary} compact>
                    Rejoindre
                  </Button>
                )}
                <Button
                  mode="outlined"
                  compact
                  icon={() => <Phone size={14} color={colors.foreground} />}
                  style={styles.outlineBtn}
                >
                  Secrétariat
                </Button>
                <Button
                  mode="outlined"
                  compact
                  textColor={colors.destructive}
                  style={styles.destructiveBtn}
                  icon={() => <X size={14} color={colors.destructive} />}
                  onPress={() => setCancelTarget(r)}
                >
                  Annuler
                </Button>
              </View>
            )}
            {tab === "historique" && <Badge variant="outline" label="Voir compte-rendu" />}
          </View>
        ))}
        {list.length === 0 && (
          <Text style={styles.emptyText}>
            {tab === "prochains" ? "Aucun rendez-vous à venir." : "Aucun historique."}
          </Text>
        )}
      </View>

      <Text style={styles.footerNote}>
        Les RDV sont créés par votre professionnel ou via la solution de prise de RDV connectée à
        PSM.
      </Text>

      {cancelTarget && (
        <OtpConfirmDialog
          visible={!!cancelTarget}
          onDismiss={() => setCancelTarget(null)}
          destinataire={currentPatient.telephone}
          title="Confirmer l'annulation"
          description="Un code OTP a été envoyé par SMS pour confirmer l'annulation de ce rendez-vous."
          onConfirmed={() => cancelMutation.mutate(cancelTarget.id)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row" },
  flex1: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  list: { gap: spacing.md },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  cardMetaSmall: { fontSize: 12, color: colors.mutedForeground },
  dateText: { fontSize: 13, fontWeight: "500", marginTop: 4 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  outlineBtn: { borderColor: colors.border },
  destructiveBtn: { borderColor: "rgba(192,0,12,0.4)" },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", padding: spacing.xl },
  footerNote: {
    fontSize: 11,
    color: colors.mutedForeground,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
});
