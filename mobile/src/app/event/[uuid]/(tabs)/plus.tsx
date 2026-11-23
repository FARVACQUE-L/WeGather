import { type Href, router } from "expo-router";
import {
  ChevronRight,
  Images,
  type LucideIcon,
  UsersRound,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing } from "@/constants/theme";
import { useEvent } from "@/context/EventContext";

// Les rubriques qui n'ont pas leur propre onglet.
export default function PlusScreen() {
  const { uuid, event, group } = useEvent();

  if (!event || !group) return null;

  const memberCount = group.members.length;
  const entries: {
    Icon: LucideIcon;
    title: string;
    subtitle: string;
    href: Href;
  }[] = [
    {
      Icon: Images,
      title: "Galerie",
      subtitle: "Les photos de l'événement",
      href: { pathname: "/event/[uuid]/galerie", params: { uuid } },
    },
    {
      Icon: UsersRound,
      title: "Groupe",
      subtitle: `Infos, code d'invitation et ${memberCount} membre${memberCount > 1 ? "s" : ""}`,
      href: { pathname: "/event/[uuid]/groupe", params: { uuid } },
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader title="Plus" subtitle={event.event_name} />
      <ScrollView contentContainerStyle={styles.body}>
        {entries.map(({ Icon, title, subtitle, href }) => (
          <Pressable
            key={title}
            onPress={() => router.push(href)}
            style={({ pressed }) => [styles.entry, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={styles.icon}>
              <Icon size={22} color={colors.title} />
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    gap: spacing.md,
    padding: spacing.md,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#fbf2ed",
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
