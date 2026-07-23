import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { requestGenericOtp, verifyGenericOtp, type GenericOtpPurpose } from "@/lib/api-client";
import { colors, spacing } from "@/theme";

interface OtpConfirmDialogProps {
  visible: boolean;
  onDismiss: () => void;
  destinataire: string;
  purpose?: GenericOtpPurpose;
  title: string;
  description?: string;
  onConfirmed: (code: string) => void | Promise<void>;
  /**
   * Si true, le code n'est pas consommé ici : `onConfirmed` reçoit le code brut
   * et doit le faire vérifier par le endpoint métier (ex: changement de
   * téléphone, où le serveur doit revalider l'OTP lui-même). Sinon (défaut),
   * le dialog vérifie le code via l'endpoint OTP générique avant d'appeler
   * `onConfirmed`.
   */
  verifyOnServer?: boolean;
}

/** Dialog partagé : envoie un OTP à l'ouverture, vérifie le code saisi, puis déclenche l'action. */
export function OtpConfirmDialog({
  visible,
  onDismiss,
  destinataire,
  purpose = "confirm_action",
  title,
  description,
  onConfirmed,
  verifyOnServer = false,
}: OtpConfirmDialogProps) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCode("");
    setSending(true);
    requestGenericOtp(destinataire, purpose)
      .then((res) => {
        if (res.success) {
          Toast.show({ type: "info", text1: `Code OTP envoyé par SMS au ${destinataire}` });
        } else {
          Toast.show({ type: "error", text1: res.error ?? "Échec de l'envoi du SMS" });
        }
      })
      .catch(() => Toast.show({ type: "error", text1: "Échec de l'envoi du SMS" }))
      .finally(() => setSending(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const confirm = async () => {
    if (code.length !== 6) {
      Toast.show({ type: "error", text1: "Code invalide" });
      return;
    }
    setVerifying(true);
    try {
      if (verifyOnServer) {
        await onConfirmed(code);
      } else {
        await verifyGenericOtp(destinataire, purpose, code);
        await onConfirmed(code);
      }
      onDismiss();
    } catch (err) {
      const text1 = verifyOnServer && err instanceof Error ? err.message : "Code invalide ou expiré";
      Toast.show({ type: "error", text1 });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          {description && <Text style={styles.description}>{description}</Text>}
          <Text style={styles.hint}>
            {sending ? "Envoi du code OTP par SMS…" : "Un code OTP a été envoyé par SMS."}
          </Text>
          <TextInput
            mode="outlined"
            label="Code OTP"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            editable={!sending}
            style={styles.input}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={verifying}>
            Retour
          </Button>
          <Button
            onPress={confirm}
            loading={verifying}
            disabled={sending || verifying}
            textColor={colors.primary}
          >
            Confirmer
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  description: { marginBottom: spacing.sm },
  hint: { color: colors.mutedForeground, marginBottom: spacing.sm },
  input: { marginTop: spacing.xs },
});
