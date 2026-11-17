import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

// Écran d'accueil provisoire : la liste des événements arrive à l'étape 4.
export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Bonjour {user?.username} 👋</Text>
        <Text style={styles.subtitle}>Vous êtes connecté à WeGather.</Text>
        <Text style={styles.detail}>{user?.email}</Text>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logout,
            pressed && styles.logoutPressed,
          ]}
        >
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  card: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.title,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  detail: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  logout: {
    marginTop: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accentDark,
  },
  logoutPressed: {
    opacity: 0.6,
  },
  logoutText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.accentDark,
  },
});
