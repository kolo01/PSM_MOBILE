import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Shield } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { Select } from "@/components/ui/select";
import { usePatient } from "@/hooks/use-patient";
import { Assurance, AssuranceStatut, AssuranceType, CreateAssurancePayload, assurancesApi } from "@/lib/api/dossier";
import { colors, radius, spacing } from "@/theme";

const TYPE_LABELS: Record<AssuranceType, string> = {
  privee: "Assurance privée",
  mutuelle: "Mutuelle",
  cmu: "CMU",
  employeur: "Employeur",
  voyage: "Voyage",
  autre: "Autre",
};
const TYPE_OPTIONS = Object.values(TYPE_LABELS);

const STATUT_LABELS: Record<AssuranceStatut, { label: string; variant: "success" | "warning" | "destructive" }> = {
  actif: { label: "Actif", variant: "success" },
  expire: { label: "Expiré", variant: "destructive" },
  renouvellement: { label: "En renouvellement", variant: "warning" },
};

const emptyForm = {
  typeLabel: TYPE_LABELS.mutuelle,
  organisme: "",
  numAdherent: "",
  dateDebut: "",
  dateFin: "",
  tauxGeneral: "",
  contactTel: "",
};

export default function AssurancesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const {
    data: assurances = [],
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["assurances", patientId],
    queryFn: () => assurancesApi.list(patientId),
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateAssurancePayload) => assurancesApi.create(patientId, dto),
    onSuccess: (created: Assurance) => {
      queryClient.setQueryData<Assurance[]>(["assurances", patientId], (prev = []) => [created, ...prev]);
      Toast.show({ type: "success", text1: "Couverture ajoutée" });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: () => Toast.show({ type: "error", text1: "Échec de l'ajout" }),
  });

  if (!currentPatient) return null;

  const canSubmit =
    !!form.organisme.trim() &&
    !!form.numAdherent.trim() &&
    !!form.dateDebut.trim() &&
    !!form.dateFin.trim() &&
    !!form.tauxGeneral.trim() &&
    !!form.contactTel.trim();

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <Shield size={22} color={colors.primary} />
        <Text style={styles.title}>Assurances</Text>
      </View>

      <View style={styles.list}>
        {assurances.map((a) => {
          const statut = STATUT_LABELS[a.statut];
          return (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.flex1}>
                  <Text style={styles.cardTitle}>{a.organisme}</Text>
                  <Text style={styles.cardMetaSmall}>{TYPE_LABELS[a.type]}</Text>
                </View>
                <Badge variant={statut.variant} label={statut.label} />
              </View>
              <Text style={styles.readValueMono}>N° adhérent : {a.numAdherent}</Text>
              <Text style={styles.cardMetaSmall}>Échéance : {a.dateFin}</Text>
              <Text style={styles.cardMeta}>
                Taux : {a.tauxGeneral}%{a.tauxCategories?.hospi ? ` · Hospi ${a.tauxCategories.hospi}%` : ""}
              </Text>
              {a.beneficiaires.length > 0 && (
                <Text style={styles.cardMetaSmall}>Bénéficiaires : {a.beneficiaires.join(", ")}</Text>
              )}
              <Text style={styles.cardMetaSmall}>Contact : {a.contactTel}</Text>
            </View>
          );
        })}
        {assurances.length === 0 && <Text style={styles.emptyText}>Aucune couverture enregistrée.</Text>}
      </View>

      {showForm ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Nouvelle couverture</Text>
          <Select
            label="Type"
            value={form.typeLabel}
            options={TYPE_OPTIONS}
            onChange={(v) => setForm((f) => ({ ...f, typeLabel: v }))}
          />
          <TextInput
            mode="outlined"
            label="Organisme"
            value={form.organisme}
            onChangeText={(v) => setForm((f) => ({ ...f, organisme: v }))}
          />
          <TextInput
            mode="outlined"
            label="N° adhérent"
            value={form.numAdherent}
            onChangeText={(v) => setForm((f) => ({ ...f, numAdherent: v }))}
          />
          <TextInput
            mode="outlined"
            label="Date de début"
            value={form.dateDebut}
            onChangeText={(v) => setForm((f) => ({ ...f, dateDebut: v }))}
            placeholder="AAAA-MM-JJ"
          />
          <TextInput
            mode="outlined"
            label="Date de fin"
            value={form.dateFin}
            onChangeText={(v) => setForm((f) => ({ ...f, dateFin: v }))}
            placeholder="AAAA-MM-JJ"
          />
          <TextInput
            mode="outlined"
            label="Taux de prise en charge (%)"
            value={form.tauxGeneral}
            onChangeText={(v) => setForm((f) => ({ ...f, tauxGeneral: v }))}
            keyboardType="numeric"
          />
          <TextInput
            mode="outlined"
            label="Téléphone de contact"
            value={form.contactTel}
            onChangeText={(v) => setForm((f) => ({ ...f, contactTel: v }))}
            keyboardType="phone-pad"
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
              onPress={() => {
                const type = (Object.keys(TYPE_LABELS) as AssuranceType[]).find(
                  (k) => TYPE_LABELS[k] === form.typeLabel,
                )!;
                createMutation.mutate({
                  type,
                  organisme: form.organisme.trim(),
                  numAdherent: form.numAdherent.trim(),
                  dateDebut: form.dateDebut.trim(),
                  dateFin: form.dateFin.trim(),
                  tauxGeneral: Number(form.tauxGeneral),
                  contactTel: form.contactTel.trim(),
                });
              }}
            >
              Enregistrer
            </Button>
          </View>
        </View>
      ) : (
        <Button mode="outlined" style={styles.outlineBtn} onPress={() => setShowForm(true)}>
          Ajouter une couverture
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
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  flex1: { flex: 1 },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  cardMeta: { fontSize: 13, color: colors.mutedForeground },
  cardMetaSmall: { fontSize: 12, color: colors.mutedForeground },
  readValueMono: { fontSize: 13, fontFamily: "monospace" },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase" },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  outlineBtn: { borderColor: colors.border },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
});
