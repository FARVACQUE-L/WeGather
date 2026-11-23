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
import type { Expense } from "@/types/budget";

// Mêmes limites que le serveur (helper/validation.ts).
const NAME_MAX_LENGTH = 255;
const MAX_PRICE = 99_999_999.99;

// "42,5" ou "42.50" → 42.5 ; null si le montant est invalide.
const readPrice = (value: string) => {
  const text = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(text)) return null;
  const price = Number(text);
  return price > 0 && price <= MAX_PRICE ? price : null;
};

// Ajout (expense absent) ou modification d'une dépense.
export function ExpenseFormModal({
  visible,
  expense,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  expense?: Expense;
  onCancel: () => void;
  // Renvoie un message d'erreur à afficher, ou rien si tout s'est bien passé.
  onSubmit: (name: string, price: number) => Promise<string | undefined>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Remplit le formulaire à chaque ouverture.
  useEffect(() => {
    if (!visible) return;
    setName(expense?.budget_name ?? "");
    setPrice(
      expense ? String(Number(expense.budget_price)).replace(".", ",") : "",
    );
    setError("");
    setIsSaving(false);
  }, [visible, expense]);

  const submit = async () => {
    const trimmedName = name.trim();
    const numericPrice = readPrice(price);

    if (!trimmedName) {
      setError("Donne un nom à la dépense.");
      return;
    }
    if (numericPrice === null) {
      setError("Indique un montant valide, par exemple 42,50.");
      return;
    }
    if (
      expense &&
      trimmedName === expense.budget_name &&
      numericPrice === Number(expense.budget_price)
    ) {
      setError("Aucune modification n'a été détectée.");
      return;
    }

    setError("");
    setIsSaving(true);
    const message = await onSubmit(trimmedName, numericPrice);
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
              {expense ? "Modifier la dépense" : "Ajouter une dépense"}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nom de la dépense</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex : Courses"
                placeholderTextColor="#aaa"
                maxLength={NAME_MAX_LENGTH}
                autoCapitalize="sentences"
                autoFocus={!expense}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Montant (€)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Ex : 42,50"
                placeholderTextColor="#aaa"
                keyboardType="decimal-pad"
                maxLength={12}
                onSubmitEditing={submit}
              />
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
                disabled={isSaving}
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
                    {expense ? "Enregistrer" : "Ajouter"}
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
