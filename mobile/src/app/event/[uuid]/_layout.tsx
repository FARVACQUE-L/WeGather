import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/BackButton";
import { colors, fonts, spacing } from "@/constants/theme";
import { EventProvider, useEvent } from "@/context/EventContext";

// Un événement = des onglets (accueil, groupe…) et le chat, ouvert
// en plein écran par-dessus. Tous partagent les données de EventProvider.
export default function EventLayout() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();

  return (
    <EventProvider uuid={uuid}>
      <EventNavigator />
    </EventProvider>
  );
}

function EventNavigator() {
  const { event, group, errorMessage, reload } = useEvent();
  const [isRetrying, setIsRetrying] = useState(false);

  if (!event || !group) {
    const retry = async () => {
      setIsRetrying(true);
      await reload();
      setIsRetrying(false);
    };

    return (
      <SafeAreaView style={styles.container}>
        <BackButton />
        {errorMessage && !isRetrying ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={retry} hitSlop={8}>
              <Text style={styles.link}>Réessayer</Text>
            </Pressable>
          </View>
        ) : (
          <ActivityIndicator color={colors.accentDark} style={styles.loader} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="reservation-form" />
      <Stack.Screen name="galerie" />
      <Stack.Screen name="groupe" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.title,
  },
});
