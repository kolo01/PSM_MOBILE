import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, IdCard } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { OtpConfirmDialog } from "@/components/ui/otp-confirm-dialog";
import { Screen } from "@/components/ui/screen";
import { Select } from "@/components/ui/select";
import { usePatient } from "@/hooks/use-patient";
import { VILLES_CI } from "@/lib/api/annuaire";
import { updatePatient, updatePatientTelephone } from "@/lib/api/patients";
import { colors, radius, spacing } from "@/theme";

const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const SEXES = ["Masculin", "Féminin"] as const;

function toTags(text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ProfilScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentPatient } = usePatient();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [sexe, setSexe] = useState<"M" | "F">("M");
  const [idCmu, setIdCmu] = useState("");
  const [region, setRegion] = useState("");
  const [groupeSanguin, setGroupeSanguin] = useState("");
  const [allergies, setAllergies] = useState("");
  const [pathologies, setPathologies] = useState("");

  const [newTelephone, setNewTelephone] = useState("");
  const [pendingTelephone, setPendingTelephone] = useState("");
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);

  useEffect(() => {
    if (!currentPatient) return;
    setNom(currentPatient.nom);
    setPrenom(currentPatient.prenom);
    setDateNaissance(currentPatient.dateNaissance);
    setSexe(currentPatient.sexe);
    setIdCmu(currentPatient.idCmu ?? "");
    setRegion(currentPatient.region ?? "");
    setGroupeSanguin(currentPatient.groupeSanguin ?? "");
    setAllergies(currentPatient.allergies.join(", "));
    setPathologies(currentPatient.pathologiesChroniques.join(", "));
  }, [currentPatient]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePatient(currentPatient!.id, {
        nom,
        prenom,
        dateNaissance,
        sexe,
        idCmu: idCmu || undefined,
        region: region || undefined,
        groupeSanguin: groupeSanguin || undefined,
        allergies: toTags(allergies),
        pathologiesChroniques: toTags(pathologies),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["patients", "me"], updated);
      Toast.show({ type: "success", text1: "Profil mis à jour" });
    },
    onError: () => Toast.show({ type: "error", text1: "Échec de la mise à jour" }),
  });

  if (!currentPatient) return null;

  const canSave = !!nom.trim() && !!prenom.trim() && !!dateNaissance.trim();

  return (
    <Screen>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <IdCard size={22} color={colors.primary} />
        <Text style={styles.title}>Mon profil</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Identité</Text>
        <View style={styles.readRow}>
          <Text style={styles.readLabel}>N° PSM</Text>
          <Text style={styles.readValueMono}>{currentPatient.psmId}</Text>
        </View>
        <TextInput mode="outlined" label="Nom" value={nom} onChangeText={setNom} />
        <TextInput mode="outlined" label="Prénom" value={prenom} onChangeText={setPrenom} />
        <TextInput
          mode="outlined"
          label="Date de naissance"
          value={dateNaissance}
          onChangeText={setDateNaissance}
          placeholder="AAAA-MM-JJ"
        />
        <Select
          label="Sexe"
          value={sexe === "M" ? "Masculin" : "Féminin"}
          options={SEXES}
          onChange={(v) => setSexe(v === "Masculin" ? "M" : "F")}
        />
        <TextInput mode="outlined" label="N° CMU" value={idCmu} onChangeText={setIdCmu} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Contact</Text>
        <View style={styles.readRow}>
          <View style={styles.flex1}>
            <Text style={styles.readLabel}>Téléphone actuel</Text>
            <Text style={styles.readValueMono}>{currentPatient.telephone}</Text>
          </View>
        </View>
        <TextInput
          mode="outlined"
          label="Nouveau numéro"
          value={newTelephone}
          onChangeText={setNewTelephone}
          placeholder={currentPatient.telephone}
          keyboardType="phone-pad"
        />
        <Button
          mode="outlined"
          style={styles.outlineBtn}
          disabled={!newTelephone.trim() || newTelephone.replace(/\s+/g, "") === currentPatient.telephone}
          onPress={() => {
            setPendingTelephone(newTelephone.replace(/\s+/g, ""));
            setPhoneDialogOpen(true);
          }}
        >
          Envoyer un code de confirmation
        </Button>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Santé</Text>
        <Select
          label="Groupe sanguin"
          value={groupeSanguin}
          placeholder="Non renseigné"
          options={GROUPES_SANGUINS}
          onChange={setGroupeSanguin}
        />
        <Select
          label="Région"
          value={region}
          placeholder="Non renseignée"
          options={VILLES_CI}
          onChange={setRegion}
        />
        <TextInput
          mode="outlined"
          label="Allergies"
          value={allergies}
          onChangeText={setAllergies}
          placeholder="Séparées par des virgules"
        />
        <TextInput
          mode="outlined"
          label="Pathologies chroniques"
          value={pathologies}
          onChangeText={setPathologies}
          placeholder="Séparées par des virgules"
        />
      </View>

      <Button
        mode="contained"
        buttonColor={colors.primary}
        loading={saveMutation.isPending}
        disabled={!canSave || saveMutation.isPending}
        onPress={() => saveMutation.mutate()}
      >
        Enregistrer
      </Button>

      <OtpConfirmDialog
        visible={phoneDialogOpen}
        onDismiss={() => setPhoneDialogOpen(false)}
        destinataire={pendingTelephone}
        title="Confirmer le nouveau numéro"
        description={`Un code a été envoyé par SMS au ${pendingTelephone}.`}
        verifyOnServer
        onConfirmed={async (code) => {
          const updated = await updatePatientTelephone(currentPatient.id, pendingTelephone, code);
          queryClient.setQueryData(["patients", "me"], updated);
          Toast.show({ type: "success", text1: "Numéro de téléphone mis à jour" });
          setNewTelephone("");
        }}
      />
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
    gap: spacing.md,
  },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase" },
  readRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flex1: { flex: 1 },
  readLabel: { fontSize: 12, color: colors.mutedForeground },
  readValue: { fontSize: 14, marginTop: 2 },
  readValueMono: { fontSize: 13, fontFamily: "monospace", marginTop: 2 },
  outlineBtn: { borderColor: colors.border },
});
