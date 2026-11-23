import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Book,
  CalendarClock,
  CalendarDays,
  Hand,
  Images,
  type LucideIcon,
  PiggyBank,
  UsersRound,
  X,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/BackButton";
import { TodoList } from "@/components/TodoList";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useEvent } from "@/context/EventContext";
import { api } from "@/lib/api";
import { formatBalance, getMyBalance } from "@/lib/budget";
import {
  formatShortDate,
  formatStayDates,
  parseDay,
  startOfToday,
} from "@/lib/dates";
import { imageUrl } from "@/lib/imageUrl";
import { initials, initialsColor, readTypeInfo } from "@/lib/reservations";
import type {
  GalleryPhoto,
  MemberSpending,
  ReservationSummary,
  Todo,
} from "@/types/dashboard";

const RECENT_RESERVATIONS = 5;
const RECENT_PHOTOS = 3;

export default function DashboardScreen() {
  const { user } = useAuth();
  const { uuid, event, group, reload } = useEvent();
  // Barre d'état claire sur la photo, seulement quand l'onglet est affiché
  // (les onglets restent montés en arrière-plan).
  const isFocused = useIsFocused();
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [spendings, setSpendings] = useState<MemberSpending[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openedPhoto, setOpenedPhoto] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const results = await Promise.allSettled([
      api<ReservationSummary[]>(`/api/reservations/${uuid}`).then(
        setReservations,
      ),
      api<MemberSpending[]>(`/api/budget/${uuid}/totalUsers`).then(
        setSpendings,
      ),
      api<Todo[]>(`/api/todo/${uuid}`).then(setTodos),
      api<GalleryPhoto[]>(`/api/gallery/${uuid}`).then(setPhotos),
    ]);
    setHasError(results.some((result) => result.status === "rejected"));
    setIsLoaded(true);
  }, [uuid]);

  // Rechargé à chaque retour sur l'onglet : les autres membres peuvent
  // avoir ajouté des réservations, des dépenses ou des photos entre-temps.
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await Promise.all([reload(), loadDashboard()]);
    setIsRefreshing(false);
  };

  // Le layout n'affiche les onglets qu'une fois l'événement chargé.
  if (!event || !group || !user) return null;

  const picture = imageUrl(event.event_picture);
  const balance = getMyBalance(spendings, user.id);
  const today = startOfToday();

  const stats: {
    Icon: LucideIcon;
    title: string;
    value: string;
    color?: string;
  }[] = [
    {
      Icon: CalendarDays,
      title: "Dates du séjour",
      value: formatStayDates(event.event_date_start, event.event_date_end),
    },
    {
      Icon: UsersRound,
      title: "L'équipe",
      value: String(group.members.length),
    },
    {
      Icon: Book,
      title: "Nos réservations",
      value: isLoaded ? String(reservations.length) : "–",
    },
    {
      Icon: PiggyBank,
      title: "Ton budget",
      value: isLoaded ? formatBalance(balance) : "–",
      color:
        balance > 0
          ? colors.positive
          : balance < 0
            ? colors.negative
            : undefined,
    },
  ];

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="light" />}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.accentDark]}
            tintColor={colors.accentDark}
          />
        }
      >
        <View style={styles.hero}>
          {picture && (
            <Image
              source={picture}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="top"
              transition={200}
            />
          )}
          <LinearGradient
            colors={[
              "rgba(0, 0, 0, 0.35)",
              "transparent",
              "rgba(0, 0, 0, 0.75)",
            ]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top"]} style={styles.heroTop}>
            <BackButton onImage />
          </SafeAreaView>
          <Text style={styles.heroTitle}>{event.event_name}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.greeting}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingText}>Salut, {user.username}</Text>
              <Hand size={22} color={colors.accent} />
            </View>
            {event.event_description !== "" && (
              <Text style={styles.description}>{event.event_description}</Text>
            )}
          </View>

          {hasError && (
            <Text style={styles.error}>
              Certaines informations n'ont pas pu être chargées. Tirez vers le
              bas pour réessayer.
            </Text>
          )}

          <View style={styles.stats}>
            {stats.map(({ Icon, title, value, color }) => (
              <View key={title} style={styles.stat}>
                <View style={styles.statTitleRow}>
                  <Icon size={16} color={colors.title} />
                  <Text style={styles.statTitle} numberOfLines={1}>
                    {title}
                  </Text>
                </View>
                <Text
                  style={[styles.statValue, color ? { color } : null]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <SectionTitle
              Icon={CalendarClock}
              title="Réservations récentes"
              onSeeAll={() =>
                router.navigate({
                  pathname: "/event/[uuid]/reservations",
                  params: { uuid },
                })
              }
            />
            {!isLoaded ? (
              <ActivityIndicator color={colors.accentDark} />
            ) : reservations.length === 0 ? (
              <Text style={styles.empty}>
                Aucune réservation pour le moment.
              </Text>
            ) : (
              reservations.slice(0, RECENT_RESERVATIONS).map((reservation) => {
                const { Icon, label } = readTypeInfo(
                  reservation.reservation_type,
                );
                const isPast =
                  parseDay(reservation.reservation_date_start) < today;

                return (
                  <View
                    key={reservation.reservation_id}
                    style={styles.reservation}
                  >
                    <View
                      style={[
                        styles.initials,
                        {
                          backgroundColor: initialsColor(reservation.user_id),
                        },
                      ]}
                    >
                      <Text style={styles.initialsText}>
                        {initials(reservation.user_username)}
                      </Text>
                    </View>
                    <View style={styles.reservationText}>
                      <View style={styles.reservationPlace}>
                        <Icon
                          size={14}
                          color={colors.title}
                          accessibilityLabel={label}
                        />
                        <Text
                          style={styles.reservationLocation}
                          numberOfLines={1}
                        >
                          {reservation.reservation_location}
                        </Text>
                      </View>
                      <Text style={styles.reservationMeta} numberOfLines={1}>
                        {reservation.user_username} ·{" "}
                        {formatShortDate(reservation.reservation_date_start)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.status,
                        isPast ? styles.statusPast : styles.statusUpcoming,
                      ]}
                    >
                      {isPast ? "Passé" : "À venir"}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <TodoList uuid={uuid} todos={todos} setTodos={setTodos} />

          <View style={styles.card}>
            <SectionTitle
              Icon={Images}
              title="Galerie récente"
              onSeeAll={() =>
                router.push({
                  pathname: "/event/[uuid]/galerie",
                  params: { uuid },
                })
              }
            />
            {!isLoaded ? (
              <ActivityIndicator color={colors.accentDark} />
            ) : photos.length === 0 ? (
              <Text style={styles.empty}>Aucune photo pour le moment.</Text>
            ) : (
              <View style={styles.photos}>
                {photos.slice(0, RECENT_PHOTOS).map((photo) => {
                  const url = imageUrl(photo.gallery_link);
                  if (!url) return null;
                  return (
                    <Pressable
                      key={photo.gallery_id}
                      onPress={() => setOpenedPhoto(url)}
                      style={({ pressed }) => [
                        styles.photo,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={
                        photo.gallery_description ?? "Photo de l'événement"
                      }
                    >
                      <Image
                        source={url}
                        style={styles.photoImage}
                        contentFit="cover"
                        transition={200}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={openedPhoto !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpenedPhoto(null)}
      >
        <View style={styles.viewer}>
          {openedPhoto && (
            <Image
              source={openedPhoto}
              style={styles.viewerImage}
              contentFit="contain"
            />
          )}
          <SafeAreaView edges={["top"]} style={styles.viewerTop}>
            <Pressable
              onPress={() => setOpenedPhoto(null)}
              hitSlop={8}
              style={styles.viewerClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer la photo"
            >
              <X size={26} color={colors.neutral} />
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

function SectionTitle({
  Icon,
  title,
  onSeeAll,
}: {
  Icon: LucideIcon;
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Icon size={20} color={colors.title} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button">
          <Text style={styles.seeAll}>Voir tout</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.lg,
  },
  hero: {
    height: 220,
    justifyContent: "space-between",
    backgroundColor: "#fbf2ed",
  },
  heroTop: {
    paddingHorizontal: spacing.sm,
  },
  heroTitle: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.neutral,
  },
  body: {
    gap: spacing.md,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  greeting: {
    gap: spacing.xs + 2,
    padding: spacing.md + 4,
    borderRadius: 16,
    backgroundColor: colors.neutral,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  greetingText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.title,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.negative,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 4,
  },
  stat: {
    flexGrow: 1,
    flexBasis: "40%",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  statTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statTitle: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
  },
  card: {
    gap: spacing.sm + 4,
    padding: spacing.md + 4,
    borderRadius: 16,
    backgroundColor: colors.neutral,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  seeAll: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.accentDark,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.title,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  reservation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
  },
  initials: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  initialsText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  reservationText: {
    flex: 1,
    gap: 2,
  },
  reservationPlace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reservationLocation: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  reservationMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  statusUpcoming: {
    backgroundColor: "#19c93d47",
    color: "#0b6b22",
  },
  statusPast: {
    backgroundColor: "#27b8fb3d",
    color: "#0b5a7d",
  },
  photos: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  photo: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fbf2ed",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  pressed: {
    opacity: 0.7,
  },
  viewer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
  },
  viewerImage: {
    flex: 1,
  },
  viewerTop: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
  },
  viewerClose: {
    width: 44,
    height: 44,
    margin: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});
