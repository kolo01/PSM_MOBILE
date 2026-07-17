import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, ShieldCheck, Stethoscope } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { usePatient } from "@/hooks/use-patient";
import { consultationsApi, documentsApi, examsApi } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

type Tab = "consultations" | "antecedents" | "examens";

export default function DossierScreen() {
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";
  const [tab, setTab] = useState<Tab>("consultations");

  const { data: consultations = [] } = useQuery({
    queryKey: ["consultations", patientId],
    queryFn: () => consultationsApi.list(patientId),
    enabled: !!patientId,
  });
  const { data: importedDocs = [] } = useQuery({
    queryKey: ["documents", patientId],
    queryFn: () => documentsApi.list(patientId),
    enabled: !!patientId,
  });
  const { data: exams } = useQuery({
    queryKey: ["exams", patientId],
    queryFn: () => examsApi.list(patientId),
    enabled: !!patientId,
  });

  if (!currentPatient) return null;

  const lastBio = exams?.bio?.[0];
  const lastFonctionnel = exams?.fonctionnels?.[0];

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <FileText size={22} color={colors.primary} />
          <Text style={styles.title}>Mon dossier médical</Text>
        </View>
        <Text style={styles.subtitle}>
          Dossier longitudinal — toutes vos données cliniques signées électroniquement.
        </Text>
      </View>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "consultations", label: "Consultations" },
          { value: "antecedents", label: "Antécédents" },
          { value: "examens", label: "Examens" },
        ]}
      />

      {tab === "consultations" && (
        <View style={styles.list}>
          {consultations.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.flex1}>
                  <View style={styles.rowGap}>
                    <Stethoscope size={16} color={colors.primary} />
                    <Text style={styles.cardTitle}>{c.specialite}</Text>
                  </View>
                  <Text style={styles.cardMeta}>{c.professionnel}</Text>
                  <View style={styles.rowGap}>
                    <Building2 size={12} color={colors.mutedForeground} />
                    <Text style={styles.cardMetaSmall}>{c.etablissement}</Text>
                  </View>
                </View>
                <View style={styles.alignEnd}>
                  <Text style={styles.dateText}>{c.date}</Text>
                  <Badge variant="success" label="Signature vérifiée" />
                </View>
              </View>
              <View style={styles.blockGroup}>
                <Block label="Motif" value={c.motif} />
                <Block label="Diagnostic" value={c.diagnostic} />
                <Block label="Conduite à tenir" value={c.conduite} />
                {c.ordonnance && <Block label="Ordonnance" value={c.ordonnance.join(" · ")} />}
              </View>
            </View>
          ))}
          {importedDocs
            .filter((d) => d.type === "compte_rendu" || d.type === "autre")
            .map((d) => (
              <View key={d.id} style={styles.importedCard}>
                <Text style={styles.cardTitle}>{d.praticien || "Document importé"}</Text>
                <Text style={styles.cardMetaSmall}>
                  {d.date} · {d.filename}
                </Text>
                {d.note && <Text style={styles.noteText}>{d.note}</Text>}
                {d.validatedBy && (
                  <View style={styles.validatedRow}>
                    <ShieldCheck size={12} color={colors.success} />
                    <Text style={styles.validatedText}>Validé par {d.validatedBy}</Text>
                  </View>
                )}
              </View>
            ))}
          {consultations.length === 0 && (
            <Text style={styles.emptyText}>Aucune consultation enregistrée.</Text>
          )}
        </View>
      )}

      {tab === "antecedents" && (
        <View style={styles.list}>
          <Card title="Pathologies chroniques">
            <View style={styles.badgeRow}>
              {currentPatient.pathologiesChroniques.map((p) => (
                <Badge key={p} variant="secondary" label={p} />
              ))}
              {currentPatient.pathologiesChroniques.length === 0 && (
                <Text style={styles.emptyText}>Aucune.</Text>
              )}
            </View>
          </Card>
          <Card title="Allergies">
            <View style={styles.badgeRow}>
              {currentPatient.allergies.map((a) => (
                <Badge key={a} variant="destructive" label={a} />
              ))}
              {currentPatient.allergies.length === 0 && <Text style={styles.emptyText}>Aucune.</Text>}
            </View>
          </Card>
          <Card title="Antécédents familiaux">
            <Text style={styles.emptyText}>
              Non renseignés — à ajouter par un professionnel de santé lors d'une consultation.
            </Text>
          </Card>
        </View>
      )}

      {tab === "examens" && (
        <View style={styles.list}>
          {lastBio && (
            <Card title={`Bilan biologique — ${lastBio.date}`}>
              {lastBio.items.map((i) => (
                <View key={i.nom} style={styles.examRow}>
                  <Text style={styles.examLabel}>{i.nom}</Text>
                  <Text style={styles.examValue}>{i.valeur}</Text>
                </View>
              ))}
            </Card>
          )}
          {lastFonctionnel && (
            <Card title={`${lastFonctionnel.type} — ${lastFonctionnel.date}`}>
              <Text style={styles.cardMeta}>{lastFonctionnel.conclusion}</Text>
            </Card>
          )}
          {!lastBio && !lastFonctionnel && (
            <Text style={styles.emptyText}>Aucun examen enregistré.</Text>
          )}
        </View>
      )}
    </Screen>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={styles.blockValue}>{value}</Text>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitleStandalone}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, color: colors.mutedForeground },
  list: { gap: spacing.md },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  flex1: { flex: 1 },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  cardTitleStandalone: { fontWeight: "600", fontSize: 15, marginBottom: spacing.xs },
  cardMeta: { fontSize: 13, color: colors.mutedForeground },
  cardMetaSmall: { fontSize: 12, color: colors.mutedForeground },
  alignEnd: { alignItems: "flex-end", gap: 4 },
  dateText: { fontSize: 13, fontWeight: "500" },
  blockGroup: { gap: spacing.sm, marginTop: spacing.xs },
  blockLabel: { fontSize: 10, color: colors.mutedForeground, textTransform: "uppercase" },
  blockValue: { fontSize: 13, marginTop: 2 },
  importedCard: {
    borderWidth: 1,
    borderColor: "rgba(217,119,6,0.2)",
    backgroundColor: "rgba(217,119,6,0.05)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
  },
  noteText: { fontSize: 12, marginTop: 2 },
  validatedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  validatedText: { fontSize: 11, color: colors.success },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  examRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  examLabel: { fontSize: 13 },
  examValue: { fontSize: 13, fontFamily: "monospace" },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
});
