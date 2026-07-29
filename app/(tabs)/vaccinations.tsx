import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Syringe } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { Select } from "@/components/ui/select";
import { usePatient } from "@/hooks/use-patient";
import { CreateVaccinPayload, Vaccin, VaccinType, vaccinationsApi } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

const VACCIN_TYPES: VaccinType[] = [
  "DTP",
  "Hépatite B",
  "Fièvre jaune",
  "Méningite",
  "COVID",
  "Rougeole",
  "Polio",
  "Rotavirus",
  "Autre",
];

function statusOf(rappel?: string): { label: string; variant: "success" | "warning" | "destructive" } | null {
  if (!rappel) return null;
  const diffDays = (new Date(rappel).getTime() - Date.now()) / 86_400_000;
  if (diffDays < 0) return { label: "En retard", variant: "destructive" };
  if (diffDays < 30) return { label: "Bientôt dû", variant: "warning" };
  return { label: "À jour", variant: "success" };
}

const emptyForm = { nom: "", type: "Autre" as VaccinType, date: "", lot: "", professionnel: "", etablissement: "", rappel: "" };

export default function VaccinationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const {
    data: vaccins = [],
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["vaccinations", patientId],
    queryFn: () => vaccinationsApi.list(patientId),
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateVaccinPayload) => vaccinationsApi.create(patientId, dto),
    onSuccess: (created: Vaccin) => {
      queryClient.setQueryData<Vaccin[]>(["vaccinations", patientId], (prev = []) => [created, ...prev]);
      Toast.show({ type: "success", text1: "Vaccination ajoutée" });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: () => Toast.show({ type: "error", text1: "Échec de l'ajout" }),
  });

  if (!currentPatient) return null;

  const allUpToDate = vaccins.every((v) => statusOf(v.rappel)?.variant !== "destructive");
  const canSubmit = !!form.nom.trim() && !!form.date.trim();

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <Syringe size={22} color={colors.primary} />
        <Text style={styles.title}>Vaccinations</Text>
      </View>

      {vaccins.length > 0 && (
        <Badge
          variant={allUpToDate ? "success" : "warning"}
          label={allUpToDate ? "Calendrier vaccinal à jour" : "Rappels en attente"}
        />
      )}

      <View style={styles.list}>
        {vaccins.map((v) => {
          const status = statusOf(v.rappel);
          return (
            <View key={v.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.flex1}>
                  <Text style={styles.cardTitle}>{v.nom}</Text>
                  <Text style={styles.cardMetaSmall}>{v.type}</Text>
                </View>
                <Text style={styles.dateText}>{v.date}</Text>
              </View>
              {(v.professionnel || v.etablissement) && (
                <Text style={styles.cardMetaSmall}>
                  {[v.professionnel, v.etablissement].filter(Boolean).join(" · ")}
                </Text>
              )}
              {v.lot && <Text style={styles.cardMetaSmall}>Lot {v.lot}</Text>}
              <View style={styles.badgeRow}>
                {status && <Badge variant={status.variant} label={status.label} />}
                {v.imported && <Badge variant="warning" label="Document importé" />}
              </View>
            </View>
          );
        })}
        {vaccins.length === 0 && <Text style={styles.emptyText}>Aucune vaccination enregistrée.</Text>}
      </View>

      {showForm ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Nouvelle vaccination</Text>
          <TextInput
            mode="outlined"
            label="Nom du vaccin"
            value={form.nom}
            onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))}
          />
          <Select
            label="Type"
            value={form.type}
            options={VACCIN_TYPES}
            onChange={(v) => setForm((f) => ({ ...f, type: v as VaccinType }))}
          />
          <TextInput
            mode="outlined"
            label="Date d'injection"
            value={form.date}
            onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
            placeholder="AAAA-MM-JJ"
          />
          <TextInput
            mode="outlined"
            label="Lot (optionnel)"
            value={form.lot}
            onChangeText={(v) => setForm((f) => ({ ...f, lot: v }))}
          />
          <TextInput
            mode="outlined"
            label="Professionnel (optionnel)"
            value={form.professionnel}
            onChangeText={(v) => setForm((f) => ({ ...f, professionnel: v }))}
          />
          <TextInput
            mode="outlined"
            label="Établissement (optionnel)"
            value={form.etablissement}
            onChangeText={(v) => setForm((f) => ({ ...f, etablissement: v }))}
          />
          <TextInput
            mode="outlined"
            label="Prochain rappel (optionnel)"
            value={form.rappel}
            onChangeText={(v) => setForm((f) => ({ ...f, rappel: v }))}
            placeholder="AAAA-MM-JJ"
          />
          <View style={styles.formActions}>
            <Button mode="outlined" style={styles.flex1} onPress={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              style={styles.flex1}
              loading={createMutation.isPending}
              disabled={!canSubmit || createMutation.isPending}
              onPress={() =>
                createMutation.mutate({
                  nom: form.nom.trim(),
                  type: form.type,
                  date: form.date.trim(),
                  lot: form.lot.trim() || undefined,
                  professionnel: form.professionnel.trim() || undefined,
                  etablissement: form.etablissement.trim() || undefined,
                  rappel: form.rappel.trim() || undefined,
                })
              }
            >
              Enregistrer
            </Button>
          </View>
        </View>
      ) : (
        <Button mode="outlined" style={styles.outlineBtn} onPress={() => setShowForm(true)}>
          Déclarer une vaccination
        </Button>
      )}
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
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  flex1: { flex: 1 },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  cardMetaSmall: { fontSize: 12, color: colors.mutedForeground },
  dateText: { fontSize: 13, color: colors.mutedForeground },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase" },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  outlineBtn: { borderColor: colors.border },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
});
