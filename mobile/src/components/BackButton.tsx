import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

import { colors, spacing } from "@/constants/theme";

// Bouton retour : sur une photo il prend un fond sombre pour rester lisible.
export function BackButton({
  onImage = false,
  label = "Retour à mes événements",
}: {
  onImage?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      style={[styles.back, onImage && styles.backOnImage]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ChevronLeft size={26} color={onImage ? colors.neutral : colors.title} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    margin: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  backOnImage: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
});
