import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_URL } from "@/constants/config";
import { colors, fonts, spacing } from "@/constants/theme";

type ServerStatus = "checking" | "ok" | "error";

const statusLabels: Record<ServerStatus, string> = {
  checking: "Connexion au serveur…",
  ok: "Serveur joignable",
  error: "Serveur injoignable",
};

export default function HomeScreen() {
  const [status, setStatus] = useState<ServerStatus>("checking");

  useEffect(() => {
    // Sans session, la route répond 401 : toute réponse HTTP prouve
    // que le téléphone atteint bien le serveur.
    fetch(`${API_URL}/api/auth/authVerif`)
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>WeGather</Text>
        <Text style={styles.subtitle}>Bienvenue sur l'application mobile</Text>
        <Text
          style={[
            styles.status,
            status === "ok" && styles.statusOk,
            status === "error" && styles.statusError,
          ]}
        >
          {statusLabels[status]}
        </Text>
        <Text style={styles.url}>{API_URL}</Text>
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
    fontSize: 36,
    color: colors.title,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  status: {
    marginTop: spacing.md,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.textMuted,
  },
  statusOk: {
    color: colors.positive,
  },
  statusError: {
    color: colors.negative,
  },
  url: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});
