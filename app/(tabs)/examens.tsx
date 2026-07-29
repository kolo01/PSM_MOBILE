import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, FlaskConical } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { usePatient } from "@/hooks/use-patient";
import { documentsApi, examsApi } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

type Tab = "bio" | "imagerie" | "fonctionnels" | "autres";

export default function ExamensScreen() {
  const router = useRouter();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";
  const [tab, setTab] = useState<Tab>("bio");

  const { data: exams, refetch, isRefetching } = useQuery({
    queryKey: ["exams", patientId],
    queryFn: () => examsApi.list(patientId),
    enabled: !!patientId,
  });
  const { data: importedDocs = [] } = useQuery({
    queryKey: ["documents", patientId],
    queryFn: () => documentsApi.list(patientId),
    enabled: !!patientId,
  });

  if (!currentPatient) return null;

  const bio = exams?.bio ?? [];
  const imagerie = exams?.imagerie ?? [];
  const fonctionnels = exams?.fonctionnels ?? [];
  const autres = exams?.autres ?? [];
  const importedBio = importedDocs.filter((d) => d.type === "biologie");
  const importedImagerie = importedDocs.filter((d) => d.type === "imagerie");

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <FlaskConical size={22} color={colors.primary} />
        <Text style={styles.title}>Examens</Text>
      </View>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "bio", label: "Biologie" },
          { value: "imagerie", label: "Imagerie" },
          { value: "fonctionnels", label: "Explorations" },
          { value: "autres", label: "Autres" },
        ]}
      />

      {tab === "bio" && (
        <View style={styles.list}>
          {bio.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{b.labo}</Text>
                <Text style={styles.dateText}>{b.date}</Text>
              </View>
              {b.items.map((i) => (
                <View key={i.nom} style={styles.examRow}>
                  <Text style={styles.examLabel}>{i.nom}</Text>
                  <Text style={[styles.examValue, i.alerte && styles.examValueAlert]}>
                    {i.valeur} <Text style={styles.examNorme}>({i.norme})</Text>
                  </Text>
                </View>
              ))}
            </View>
          ))}
          {importedBio.map((d) => (
            <ImportedRow key={d.id} praticien={d.praticien} date={d.date} filename={d.filename} note={d.note} />
          ))}
          {bio.length === 0 && importedBio.length === 0 && (
            <Text style={styles.emptyText}>Aucun bilan biologique enregistré.</Text>
          )}
        </View>
      )}

      {tab === "imagerie" && (
        <View style={styles.list}>
          {imagerie.map((im) => (
            <View key={im.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{im.type}</Text>
                <Text style={styles.dateText}>{im.date}</Text>
              </View>
              <Text style={styles.cardMetaSmall}>
                {im.radiologue} · {im.etablissement}
              </Text>
              {im.imageUrl && <Badge variant="secondary" label="DICOM disponible" />}
              <Text style={styles.conclusionText}>{im.conclusion}</Text>
            </View>
          ))}
          {importedImagerie.map((d) => (
            <ImportedRow key={d.id} praticien={d.praticien} date={d.date} filename={d.filename} note={d.note} />
          ))}
          {imagerie.length === 0 && importedImagerie.length === 0 && (
            <Text style={styles.emptyText}>Aucun examen d'imagerie enregistré.</Text>
          )}
        </View>
      )}

      {tab === "fonctionnels" && (
        <View style={styles.list}>
          {fonctionnels.map((f) => (
            <View key={f.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{f.type}</Text>
                <Text style={styles.dateText}>{f.date}</Text>
              </View>
              <Text style={styles.cardMetaSmall}>{f.professionnel}</Text>
              <Text style={styles.conclusionText}>{f.conclusion}</Text>
            </View>
          ))}
          {fonctionnels.length === 0 && (
            <Text style={styles.emptyText}>Aucune exploration fonctionnelle enregistrée.</Text>
          )}
        </View>
      )}

      {tab === "autres" && (
        <View style={styles.list}>
          {autres.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{a.titre}</Text>
                <Text style={styles.dateText}>{a.date}</Text>
              </View>
              <Text style={styles.cardMetaSmall}>{a.auteur}</Text>
              <Text style={styles.conclusionText}>{a.description}</Text>
            </View>
          ))}
          {autres.length === 0 && <Text style={styles.emptyText}>Aucun autre examen enregistré.</Text>}
        </View>
      )}
    </Screen>
  );
}

function ImportedRow({
  praticien,
  date,
  filename,
  note,
}: {
  praticien?: string;
  date: string;
  filename: string;
  note?: string;
}) {
  return (
    <View style={styles.importedCard}>
      <Text style={styles.cardTitle}>{praticien || "Document importé"}</Text>
      <Text style={styles.cardMetaSmall}>
        {date} · {filename}
      </Text>
      {note && <Text style={styles.noteText}>{note}</Text>}
      <Badge variant="warning" label="Document importé" />
    </View>
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
  examRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  examLabel: { fontSize: 13 },
  examValue: { fontSize: 13, fontFamily: "monospace" },
  examValueAlert: { color: colors.destructive, fontWeight: "700" },
  examNorme: { fontSize: 11, color: colors.mutedForeground, fontFamily: "monospace" },
  conclusionText: { fontSize: 13, marginTop: 2 },
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
