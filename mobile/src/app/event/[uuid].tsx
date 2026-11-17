import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, spacing } from "@/constants/theme";

// Écran provisoire : le détail de l'événement arrive à l'étape 5.
export default function EventScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Retour"
      >
        <ChevronLeft size={24} color={colors.title} />
        <Text style={styles.backText}>Mes événements</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.title}>Détail de l'événement</Text>
        <Text style={styles.text}>Bientôt disponible.</Text>
        <Text style={styles.uuid}>{uuid}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: spacing.md,
  },
  backText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.title,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.title,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  uuid: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
});
