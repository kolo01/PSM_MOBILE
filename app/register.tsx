import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, RadioButton, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { useAuth } from "@/auth/auth-context";
import { ApiError } from "@/lib/api-client";
import { colors, radius, spacing } from "@/theme";

export default function RegisterScreen() {
  const { registerPatient } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [data, setData] = useState({
    telephone: "+225 ",
    cmu: "",
    nom: "",
    prenom: "",
    naissance: "",
    sexe: "F" as "F" | "M",
    pin: "",
    pin2: "",
  });
  const set = (k: keyof typeof data, v: string) => setData((d) => ({ ...d, [k]: v }));

  const submit = async () => {
    if (data.pin !== data.pin2) return Toast.show({ type: "error", text1: "Les codes PIN ne correspondent pas" });
    if (data.pin.length < 4) return Toast.show({ type: "error", text1: "PIN à 4 ou 6 chiffres" });
    setPending(true);
    try {
      await registerPatient({
        telephone: data.telephone,
        idCmu: data.cmu || undefined,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.naissance,
        sexe: data.sexe,
        pin: data.pin,
      });
      Toast.show({ type: "success", text1: "Carnet PSM créé !" });
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err instanceof ApiError ? err.message : "Échec de la création du carnet",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Créer mon carnet PSM
        </Text>
        <Text style={styles.subtitle}>Étape {step} sur 3</Text>

        <View style={styles.progressRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressBar, i <= step && styles.progressBarActive]} />
          ))}
        </View>

        <View style={styles.card}>
          {step === 1 && (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="Numéro de téléphone *"
                value={data.telephone}
                onChangeText={(v) => set("telephone", v)}
                keyboardType="phone-pad"
              />
              <TextInput
                mode="outlined"
                label="Numéro CMU (recommandé)"
                value={data.cmu}
                onChangeText={(v) => set("cmu", v)}
                placeholder="CI-CMU-..."
              />
              <Text style={styles.hint}>Permet la liaison à votre dossier médical national</Text>
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="Prénom *"
                value={data.prenom}
                onChangeText={(v) => set("prenom", v)}
              />
              <TextInput
                mode="outlined"
                label="Nom *"
                value={data.nom}
                onChangeText={(v) => set("nom", v)}
              />
              <TextInput
                mode="outlined"
                label="Date de naissance * (AAAA-MM-JJ)"
                value={data.naissance}
                onChangeText={(v) => set("naissance", v)}
                placeholder="1990-01-01"
              />
              <Text style={styles.fieldLabel}>Sexe *</Text>
              <RadioButton.Group onValueChange={(v) => set("sexe", v)} value={data.sexe}>
                <View style={styles.radioRow}>
                  <View style={styles.radioItem}>
                    <RadioButton value="F" color={colors.primary} />
                    <Text>Féminin</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="M" color={colors.primary} />
                    <Text>Masculin</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>
          )}

          {step === 3 && (
            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="Code PIN (4 ou 6 chiffres) *"
                value={data.pin}
                onChangeText={(v) => set("pin", v.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
              />
              <TextInput
                mode="outlined"
                label="Confirmer le code PIN *"
                value={data.pin2}
                onChangeText={(v) => set("pin2", v.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
              />
              <Text style={styles.hint}>
                En créant votre carnet, vous acceptez la politique de confidentialité PSM (RGPD).
              </Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <Button onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
              {step > 1 ? "Précédent" : "Annuler"}
            </Button>
            {step < 3 ? (
              <Button mode="contained" buttonColor={colors.primary} onPress={() => setStep(step + 1)}>
                Suivant
              </Button>
            ) : (
              <Button mode="contained" buttonColor={colors.primary} onPress={submit} loading={pending} disabled={pending}>
                Créer mon carnet
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingTop: spacing.xxl, gap: spacing.md },
  title: { fontWeight: "700" },
  subtitle: { color: colors.mutedForeground },
  progressRow: { flexDirection: "row", gap: spacing.sm },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.muted },
  progressBarActive: { backgroundColor: colors.primary },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  form: { gap: spacing.md },
  fieldLabel: { fontWeight: "600" },
  radioRow: { flexDirection: "row", gap: spacing.lg },
  radioItem: { flexDirection: "row", alignItems: "center" },
  hint: { fontSize: 12, color: colors.mutedForeground },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
});
