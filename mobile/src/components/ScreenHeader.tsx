import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/BackButton";
import { colors, fonts, spacing } from "@/constants/theme";

// Barre du haut des écrans d'un événement : retour, titre, sous-titre.
export function ScreenHeader({
  title,
  subtitle,
  backLabel,
  action,
}: {
  title: string;
  subtitle?: string;
  backLabel?: string;
  // Bouton facultatif à droite (ex. « ajouter »).
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <BackButton label={backLabel} />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.title,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});
