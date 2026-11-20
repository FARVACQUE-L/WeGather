import { router, useFocusEffect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { Book, House, MessageCircle, UsersRound } from "lucide-react-native";
import { useCallback } from "react";

import { colors, fonts } from "@/constants/theme";
import { useEvent } from "@/context/EventContext";

export default function EventTabsLayout() {
  const { uuid, unreadCount, loadUnreadCount } = useEvent();

  // Recompte au retour du chat ou d'un autre écran.
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount]),
  );

  return (
    <Tabs
      // Retour (bouton ou geste Android) : on quitte l'événement
      // au lieu de revenir à l'onglet précédent.
      backBehavior="none"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.title,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.semiBold, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.neutral,
          borderTopColor: colors.border,
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.accent,
          color: colors.neutral,
          fontFamily: fonts.bold,
          fontSize: 10,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
          tabBarBadge:
            unreadCount > 0
              ? unreadCount > 99
                ? "99+"
                : unreadCount
              : undefined,
          tabBarAccessibilityLabel:
            unreadCount > 0
              ? `Messages, ${unreadCount} non lu${unreadCount > 1 ? "s" : ""}`
              : "Messages",
        }}
        // Le chat s'ouvre en plein écran par-dessus les onglets, pour
        // laisser toute la place au clavier.
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push({ pathname: "/event/[uuid]/chat", params: { uuid } });
          },
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: "Réservations",
          tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="groupe"
        options={{
          title: "Groupe",
          tabBarIcon: ({ color, size }) => (
            <UsersRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
