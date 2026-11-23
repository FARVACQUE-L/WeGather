import { Image } from "expo-image";
import { ImagePlus } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, fonts, spacing } from "@/constants/theme";
import { pickPhoto } from "@/lib/photos";

// Même limite que le serveur (helper/validation.ts).
export const DESCRIPTION_MAX_LENGTH = 255;

// Ajout d'une photo (photo + description) ou modification de la
// description d'une photo existante (initialDescription renseigné).
export function PhotoFormModal({
  visible,
  initialDescription,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  initialDescription?: string;
  onCancel: () => void;
  // photoUri vaut null en modification. Renvoie un message d'erreur à
  // afficher, ou rien si tout s'est bien passé.
  onSubmit: (
    photoUri: string | null,
    description: string,
  ) => Promise<string | undefined>;
}) {
  const isEditing = initialDescription !== undefined;
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Remet le formulaire à zéro à chaque ouverture.
  useEffect(() => {
    if (!visible) return;
    setPhotoUri(null);
    setDescription(initialDescription ?? "");
    setError("");
    setIsSaving(false);
  }, [visible, initialDescription]);

  const choosePhoto = async () => {
    setIsPicking(true);
    try {
      const uri = await pickPhoto({ crop: false });
      if (uri) {
        setPhotoUri(uri);
        setError("");
      }
    } catch {
      setError("Impossible de lire cette photo.");
    } finally {
      setIsPicking(false);
    }
  };

  const submit = async () => {
    const trimmed = description.trim();
    if (!isEditing && !photoUri) {
      setError("Choisis une photo.");
      return;
    }
    if (isEditing && trimmed === (initialDescription ?? "").trim()) {
      setError("Aucune modification n'a été détectée.");
      return;
    }

    setError("");
    setIsSaving(true);
    const message = await onSubmit(photoUri, trimmed);
    if (message) {
      setError(message);
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <Pressable
          style={styles.backdrop}
          onPress={onCancel}
          accessibilityLabel="Fermer"
        >
          {/* Un appui dans la fenêtre ne la ferme pas. */}
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.title}>
              {isEditing ? "Modifier la description" : "Ajouter une photo"}
            </Text>

            {!isEditing && (
              <View style={styles.field}>
                {photoUri && (
                  <Image
                    source={photoUri}
                    style={styles.preview}
                    contentFit="contain"
                    accessibilityLabel="Photo choisie"
                  />
                )}
                <Pressable
                  onPress={choosePhoto}
                  disabled={isPicking || isSaving}
                  style={({ pressed }) => [
                    styles.pickButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  {isPicking ? (
                    <ActivityIndicator color={colors.title} />
                  ) : (
                    <ImagePlus size={18} color={colors.title} />
                  )}
                  <Text style={styles.pickText}>
                    {photoUri ? "Changer la photo" : "Choisir une photo"}
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>
                Description{isEditing ? "" : " (facultatif)"}
              </Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex : Soirée au bord du lac"
                placeholderTextColor="#aaa"
                maxLength={DESCRIPTION_MAX_LENGTH}
                autoCapitalize="sentences"
                autoFocus={isEditing}
                onSubmitEditing={submit}
              />
              <Text style={styles.counter}>
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </Text>
            </View>

            {error !== "" && (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            )}

            <View style={styles.actions}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancel,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={isSaving || isPicking}
                style={({ pressed }) => [
                  styles.button,
                  styles.submit,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.neutral} />
                ) : (
                  <Text style={styles.submitText}>
                    {isEditing ? "Enregistrer" : "Ajouter"}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.title,
    textAlign: "center",
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text,
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#00000010",
  },
  pickButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  pickText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.title,
  },
  input: {
    height: 45,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(194, 118, 118, 0.2)",
    backgroundColor: "rgba(226, 154, 154, 0.06)",
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  counter: {
    alignSelf: "flex-end",
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.negative,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  cancel: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  cancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.title,
  },
  submit: {
    backgroundColor: colors.accentDark,
  },
  submitText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.neutral,
  },
  pressed: {
    opacity: 0.7,
  },
});
