import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { EventCard } from "@/components/EventCard";
import { SITE_URL } from "@/constants/config";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api } from "@/lib/api";
import { parseDay, startOfToday } from "@/lib/dates";
import type { EventData, EventFilter } from "@/types/event";

const FILTERS: { value: EventFilter; label: string }[] = [
  { value: "ongoing", label: "En cours" },
  { value: "finished", label: "Terminés" },
  { value: "all", label: "Tous" },
];

const EMPTY_MESSAGES: Record<EventFilter, string> = {
  ongoing: "Aucun événement en cours.",
  finished: "Aucun événement terminé.",
  all: "Vous n'avez aucun événement pour le moment.",
};

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [filter, setFilter] = useState<EventFilter>("ongoing");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadEvents = useCallback(async () => {
    try {
      setEvents(await api<EventData[]>("/api/events"));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Erreur serveur",
      );
    }
  }, []);

  useEffect(() => {
    loadEvents().finally(() => setIsLoading(false));
  }, [loadEvents]);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  // Même filtre et même tri que la page /homeevents du site.
  const filteredEvents = useMemo(() => {
    const today = startOfToday();

    return events
      .filter((event) => {
        const end = parseDay(event.event_date_end);
        if (filter === "ongoing") return end >= today;
        if (filter === "finished") return end < today;
        return true;
      })
      .sort((a, b) =>
        filter === "finished"
          ? parseDay(b.event_date_end).getTime() -
            parseDay(a.event_date_end).getTime()
          : parseDay(a.event_date_start).getTime() -
            parseDay(b.event_date_start).getTime(),
      );
  }, [events, filter]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <AppHeader />

      <FlatList
        data={filteredEvents}
        keyExtractor={(event) => event.event_uuid}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.accentDark]}
            tintColor={colors.accentDark}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>Mes Événements</Text>
            <View style={styles.filters}>
              {FILTERS.map(({ value, label }) => {
                const active = value === filter;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setFilter(value)}
                    style={[styles.filter, active && styles.filterActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              color={colors.accentDark}
              style={styles.loader}
            />
          ) : errorMessage ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{errorMessage}</Text>
              <Pressable onPress={refresh} hitSlop={8}>
                <Text style={styles.emptyLink}>Réessayer</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{EMPTY_MESSAGES[filter]}</Text>
              <Pressable
                onPress={() =>
                  WebBrowser.openBrowserAsync(`${SITE_URL}/homeevents`)
                }
                hitSlop={8}
              >
                <Text style={styles.emptyLink}>
                  Créer ou rejoindre un événement sur le site
                </Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            isHost={item.event_id_host === user?.id}
            onPress={() =>
              router.push({
                pathname: "/event/[uuid]",
                params: { uuid: item.event_uuid },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listHeader: {
    alignItems: "center",
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.title,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.md,
  },
  filter: {
    width: 88,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.neutral,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 1 },
  },
  filterActive: {
    backgroundColor: colors.accentDark,
  },
  filterText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  filterTextActive: {
    color: colors.neutral,
  },
  loader: {
    marginTop: spacing.xl,
  },
  empty: {
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: colors.text,
    textAlign: "center",
  },
  emptyLink: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.title,
    textAlign: "center",
  },
});
