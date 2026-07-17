import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { useAuth } from "@/auth/auth-context";
import { ApiError } from "@/lib/api-client";
import { colors, spacing } from "@/theme";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function LoginScreen() {
  const { requestPatientOtp, verifyPatientOtp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("+225 ");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);

  const goStep2 = () => {
    if (!phone.trim()) return Toast.show({ type: "error", text1: "Numéro de téléphone requis" });
    setStep(2);
  };

  const sendOtp = async () => {
    if (pin.length < 4) return Toast.show({ type: "error", text1: "PIN à 4 ou 6 chiffres requis" });
    setPending(true);
    try {
      await requestPatientOtp(phone, pin);
      Toast.show({ type: "success", text1: "Code OTP envoyé par SMS" });
      setStep(3);
    } catch (err) {
      Toast.show({ type: "error", text1: errorMessage(err, "Échec de l'envoi du SMS") });
    } finally {
      setPending(false);
    }
  };

  const confirmLogin = async () => {
    if (otp.length !== 6) return Toast.show({ type: "error", text1: "Code OTP à 6 chiffres requis" });
    setPending(true);
    try {
      await verifyPatientOtp(phone, pin, otp);
      Toast.show({ type: "success", text1: "Connexion réussie" });
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      Toast.show({ type: "error", text1: errorMessage(err, "Code OTP invalide") });
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Connexion à PSM
        </Text>
        <Text style={styles.subtitle}>
          Connectez-vous avec votre numéro de téléphone, votre PIN, et confirmez par OTP SMS.
        </Text>

        <Stepper step={step} labels={["Téléphone", "PIN", "OTP"]} />

        {step === 1 && (
          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label="Numéro de téléphone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Button mode="contained" onPress={goStep2} buttonColor={colors.primary}>
              Continuer
            </Button>
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label="Code PIN"
              value={pin}
              onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <Text style={styles.hint}>4 ou 6 chiffres choisis lors de votre inscription.</Text>
            <Button
              mode="contained"
              onPress={sendOtp}
              loading={pending}
              disabled={pending}
              buttonColor={colors.primary}
            >
              Recevoir le code OTP
            </Button>
          </View>
        )}

        {step === 3 && (
          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label="Code reçu par SMS"
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button
              mode="contained"
              onPress={confirmLogin}
              loading={pending}
              disabled={pending}
              buttonColor={colors.primary}
            >
              Se connecter
            </Button>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Première fois ? </Text>
          <Link href="/register" style={styles.link}>
            Créer mon carnet PSM
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <View style={styles.stepperRow}>
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = idx <= step;
        return (
          <View key={label} style={styles.stepperItem}>
            <View style={[styles.stepperBar, active && styles.stepperBarActive]} />
            <Text style={[styles.stepperLabel, active && styles.stepperLabelActive]}>
              {idx}. {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingTop: spacing.xxl * 2, gap: spacing.lg },
  title: { fontWeight: "700" },
  subtitle: { color: colors.mutedForeground },
  stepperRow: { flexDirection: "row", gap: spacing.sm },
  stepperItem: { flex: 1 },
  stepperBar: { height: 4, borderRadius: 2, backgroundColor: colors.muted },
  stepperBarActive: { backgroundColor: colors.primary },
  stepperLabel: { fontSize: 11, marginTop: 4, color: colors.mutedForeground },
  stepperLabelActive: { color: colors.foreground, fontWeight: "600" },
  form: { gap: spacing.md },
  hint: { fontSize: 12, color: colors.mutedForeground },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { color: colors.mutedForeground },
  link: { color: colors.primary, fontWeight: "600" },
});
