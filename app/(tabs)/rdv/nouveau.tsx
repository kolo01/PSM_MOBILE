import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Home as HomeIcon,
  MapPin,
  Receipt,
  Search,
  Video,
} from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Checkbox, RadioButton, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { Badge } from "@/components/ui/badge";
import { Screen } from "@/components/ui/screen";
import { Select } from "@/components/ui/select";
import { usePatient } from "@/hooks/use-patient";
import {
  fetchCreneauxDisponibles,
  searchPros,
  VILLES_CI,
  type ProSearchResult,
} from "@/lib/api/annuaire";
import { rdvBookingApi, type MoyenPaiement, type RdvBookingDraft } from "@/lib/api/dossier";
import { SPECIALITES } from "@/lib/constants";
import { colors, radius, spacing } from "@/theme";

const STEPS = ["Rechercher un professionnel", "Choisir un créneau", "Confirmer et payer", "Confirmation"];

const CRENEAU_ICON = {
  Présentiel: MapPin,
  Téléconsultation: Video,
  "Visite à domicile": HomeIcon,
} as const;

const PAIEMENT_OPTIONS: { value: MoyenPaiement; label: string }[] = [
  { value: "moov_money", label: "Moov Money" },
  { value: "orange_money", label: "Orange Money" },
  { value: "wave", label: "Wave" },
  { value: "carte", label: "Carte bancaire" },
];

export default function NouveauRdvScreen() {
  const router = useRouter();
  const { data: currentPatient } = usePatient();
  const patientId = currentPatient?.id ?? "";
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);

  // Écran 1
  const [specialite, setSpecialite] = useState("");
  const [ville, setVille] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [nomPro, setNomPro] = useState("");
  const [results, setResults] = useState<ProSearchResult[] | null>(null);
  const [selectedPro, setSelectedPro] = useState<ProSearchResult | null>(null);

  const searchMutation = useMutation({
    mutationFn: () => searchPros({ specialite, ville, etablissement, nom: nomPro }),
    onSuccess: setResults,
    onError: () => Toast.show({ type: "error", text1: "Échec de la recherche" }),
  });

  // Écran 2
  const { data: creneaux = [], isFetching: loadingCreneaux } = useQuery({
    queryKey: ["creneaux", selectedPro?.id],
    queryFn: () => fetchCreneauxDisponibles(selectedPro!.id),
    enabled: !!selectedPro,
  });
  const [creneauId, setCreneauId] = useState("");
  const [motif, setMotif] = useState("");

  // Écran 3
  const [booking, setBooking] = useState<RdvBookingDraft | null>(null);
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>("moov_money");
  const [confirmChecked, setConfirmChecked] = useState(false);

  const bookMutation = useMutation({
    mutationFn: () => rdvBookingApi.create(patientId, { creneauId, motif: motif || undefined }),
    onSuccess: (draft) => {
      setBooking(draft);
      setStep(3);
    },
    onError: () => Toast.show({ type: "error", text1: "Ce créneau n'est plus disponible" }),
  });

  // Écran 4
  const [receiptRef, setReceiptRef] = useState<string | null>(null);
  const payMutation = useMutation({
    mutationFn: () => rdvBookingApi.pay(patientId, booking!.id, { moyenPaiement }),
    onSuccess: ({ recu }) => {
      setReceiptRef(recu.reference);
      queryClient.invalidateQueries({ queryKey: ["rdv", patientId] });
      setStep(4);
    },
    onError: () => Toast.show({ type: "error", text1: "Échec du paiement — réessayez" }),
  });

  if (!currentPatient) return null;

  return (
    <Screen>
      <Pressable
        style={styles.backRow}
        onPress={() => (step === 1 ? router.back() : setStep(step - 1))}
      >
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <CalendarDays size={22} color={colors.primary} />
        <Text style={styles.title}>Prendre un rendez-vous</Text>
      </View>

      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <Badge
            key={s}
            label={`${i + 1}. ${s}`}
            variant={i + 1 === step ? "default" : i + 1 < step ? "secondary" : "outline"}
          />
        ))}
      </View>

      {step === 1 && (
        <View style={styles.card}>
          <Select
            label="Spécialité *"
            value={specialite}
            placeholder="Choisir une spécialité"
            options={SPECIALITES}
            onChange={setSpecialite}
          />
          <Select
            label="Ville / région *"
            value={ville}
            placeholder="Choisir une ville"
            options={VILLES_CI}
            onChange={setVille}
          />
          <TextInput
            mode="outlined"
            label="Établissement"
            value={etablissement}
            onChangeText={setEtablissement}
            placeholder="Laisser vide si exercice libéral"
          />
          <TextInput
            mode="outlined"
            label="Nom du professionnel"
            value={nomPro}
            onChangeText={setNomPro}
            placeholder="Recherche optionnelle"
          />
          <Button
            mode="contained"
            buttonColor={colors.primary}
            icon={() => <Search size={16} color="#fff" />}
            disabled={!specialite || !ville || searchMutation.isPending}
            loading={searchMutation.isPending}
            onPress={() => searchMutation.mutate()}
          >
            Rechercher
          </Button>

          {results && (
            <View style={styles.list}>
              {results.length === 0 && (
                <Text style={styles.emptyText}>Aucun professionnel vérifié ne correspond à ces critères.</Text>
              )}
              {results.map((p) => (
                <View key={p.id} style={styles.proRow}>
                  <View style={styles.flex1}>
                    <View style={styles.rowGap}>
                      <Text style={styles.proName}>{p.nom}</Text>
                      {p.verifie && <BadgeCheck size={14} color={colors.primary} />}
                    </View>
                    <Text style={styles.cardMetaSmall}>{p.specialite}</Text>
                    <Text style={styles.cardMetaSmall}>
                      {p.etablissement ?? "Exercice libéral"} · {p.ville}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    buttonColor={colors.primary}
                    compact
                    onPress={() => {
                      setSelectedPro(p);
                      setCreneauId("");
                      setStep(2);
                    }}
                  >
                    Créneaux
                  </Button>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {step === 2 && selectedPro && (
        <View style={styles.card}>
          <Text style={styles.proName}>{selectedPro.nom}</Text>
          <Text style={styles.cardMetaSmall}>
            {selectedPro.specialite} · {selectedPro.etablissement ?? "Exercice libéral"}
          </Text>

          <Text style={styles.label}>Date et heure *</Text>
          {loadingCreneaux && <Text style={styles.emptyText}>Chargement des créneaux…</Text>}
          {!loadingCreneaux && creneaux.length === 0 && (
            <Text style={styles.emptyText}>Aucun créneau disponible pour ce professionnel actuellement.</Text>
          )}
          <View style={styles.creneauxGrid}>
            {creneaux.map((c) => {
              const Icon = CRENEAU_ICON[c.type];
              const active = creneauId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCreneauId(c.id)}
                  style={[styles.creneauItem, active && styles.creneauItemActive]}
                >
                  <Text style={styles.creneauDate}>
                    {new Date(c.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </Text>
                  <View style={styles.rowGap}>
                    <Icon size={12} color={colors.mutedForeground} />
                    <Text style={styles.cardMetaSmall}>
                      {c.type} · {c.dureeMin} min
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            mode="outlined"
            label="Motif du rendez-vous"
            value={motif}
            onChangeText={(v) => setMotif(v.slice(0, 200))}
            placeholder="Suivi, renouvellement d'ordonnance, examen..."
            multiline
          />
          <Text style={styles.charCount}>{motif.length}/200</Text>

          <Button
            mode="contained"
            buttonColor={colors.primary}
            disabled={!creneauId || bookMutation.isPending}
            loading={bookMutation.isPending}
            onPress={() => bookMutation.mutate()}
          >
            Continuer
          </Button>
        </View>
      )}

      {step === 3 && booking && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Récapitulatif</Text>
          <View style={styles.recapBox}>
            <Text style={styles.proName}>
              {booking.specialite} · {booking.professionnel}
            </Text>
            <Text style={styles.cardMetaSmall}>{booking.etablissement}</Text>
            <Text style={styles.dateText}>
              {new Date(booking.date).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
            </Text>
            {booking.motif && <Text style={styles.cardMetaSmall}>Motif : {booking.motif}</Text>}
          </View>

          <View style={styles.montantRow}>
            <Text style={styles.montantLabel}>Frais de mise en relation</Text>
            <Text style={styles.montantValue}>{booking.montantXof} FCFA</Text>
          </View>

          <Text style={styles.label}>Moyen de paiement *</Text>
          <RadioButton.Group onValueChange={(v) => setMoyenPaiement(v as MoyenPaiement)} value={moyenPaiement}>
            {PAIEMENT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={styles.radioRow}
                onPress={() => setMoyenPaiement(opt.value)}
              >
                <RadioButton value={opt.value} color={colors.primary} />
                <Text style={styles.flex1}>{opt.label}</Text>
                {opt.value === "moov_money" && <Badge variant="secondary" label="Par défaut" />}
              </Pressable>
            ))}
          </RadioButton.Group>

          <Pressable style={styles.checkboxRow} onPress={() => setConfirmChecked((v) => !v)}>
            <Checkbox status={confirmChecked ? "checked" : "unchecked"} color={colors.primary} />
            <Text style={styles.flex1}>Je confirme ce rendez-vous</Text>
          </Pressable>

          <Button
            mode="contained"
            buttonColor={colors.primary}
            disabled={!confirmChecked || payMutation.isPending}
            loading={payMutation.isPending}
            onPress={() => payMutation.mutate()}
          >
            Confirmer et payer
          </Button>
        </View>
      )}

      {step === 4 && booking && (
        <View style={[styles.card, styles.centerCard]}>
          <CheckCircle2 size={48} color={colors.success} />
          <Text style={styles.confirmText}>
            Votre rendez-vous est confirmé pour le{" "}
            {new Date(booking.date).toLocaleDateString("fr-FR", { dateStyle: "long" })} à{" "}
            {new Date(booking.date).toLocaleTimeString("fr-FR", { timeStyle: "short" })} avec{" "}
            {booking.professionnel}.
          </Text>
          {receiptRef && (
            <View style={styles.rowGap}>
              <Receipt size={14} color={colors.mutedForeground} />
              <Text style={styles.cardMetaSmall}>Reçu {receiptRef} disponible dans l'historique</Text>
            </View>
          )}
          <Button mode="contained" buttonColor={colors.primary} onPress={() => router.replace("/(tabs)/rdv")}>
            Voir mes rendez-vous
          </Button>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: -spacing.sm },
  backText: { color: colors.mutedForeground, fontSize: 13 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 20, fontWeight: "700" },
  stepsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  centerCard: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl },
  list: { gap: spacing.sm },
  proRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  flex1: { flex: 1 },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 6 },
  proName: { fontWeight: "600", fontSize: 15 },
  cardMetaSmall: { fontSize: 12, color: colors.mutedForeground },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingVertical: spacing.md },
  label: { fontSize: 12, fontWeight: "600" },
  creneauxGrid: { gap: spacing.sm },
  creneauItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  creneauItemActive: { borderColor: colors.primary, backgroundColor: "rgba(192,0,12,0.05)" },
  creneauDate: { fontWeight: "600", fontSize: 13, marginBottom: 4 },
  charCount: { fontSize: 11, color: colors.mutedForeground, textAlign: "right" },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase" },
  recapBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  dateText: { fontWeight: "600", fontSize: 13 },
  montantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  montantLabel: { fontSize: 13, fontWeight: "500" },
  montantValue: { fontSize: 18, fontWeight: "700" },
  radioRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: 4 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  confirmText: { textAlign: "center", fontSize: 15, fontWeight: "600" },
});
