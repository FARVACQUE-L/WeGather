import { router, useFocusEffect } from "expo-router";
import { ChevronDown, Plus } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReservationCard } from "@/components/ReservationCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useEvent } from "@/context/EventContext";
import { ApiError, api } from "@/lib/api";
import { openDocument, pickDocument, uploadDocument } from "@/lib/documents";
import {
  formatCountdown,
  formatDayHeader,
  formatSchedule,
  isPastReservation,
  RESERVATION_TYPE_INFO,
  RESERVATION_TYPES,
  type ReservationType,
  readTypeInfo,
} from "@/lib/reservations";
import type { Reservation, ReservationDocument } from "@/types/reservation";

export default function ReservationsScreen() {
  const { user } = useAuth();
  const { uuid, event, group } = useEvent();
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeType, setActiveType] = useState<ReservationType | "all">("all");
  const [showPast, setShowPast] = useState(false);
  // Nombre maximum de réservations, selon l'offre de l'hôte.
  const [limit, setLimit] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<number | null>(
    null,
  );

  // Positions des cartes, pour défiler jusqu'à la prochaine réservation.
  const scrollRef = useRef<ScrollViewInstance>(null);
  const listY = useRef(0);
  const cardY = useRef(new Map<number, number>());

  const load = useCallback(async () => {
    try {
      const [list, limitData] = await Promise.all([
        api<Reservation[]>(`/api/reservations/all/${uuid}`),
        api<{ limit: number }>(`/api/reservations/${uuid}/limit`).catch(
          () => null,
        ),
      ]);
      setReservations(list);
      setLimit(limitData?.limit ?? null);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Erreur serveur",
      );
    }
  }, [uuid]);

  // Rechargé à chaque retour sur l'onglet : les autres membres peuvent
  // avoir ajouté ou modifié des réservations sur le site.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  // Le layout n'affiche les onglets qu'une fois l'événement chargé.
  if (!event || !group || !user) return null;

  // Comme sur le site : l'auteur ou l'hôte de l'événement.
  const canManage = (reservation: Reservation) =>
    reservation.reservation_id_user === user.id || group.host_id === user.id;

  const canDeleteDocument = (document: ReservationDocument) =>
    document.document_id_user === user.id || group.host_id === user.id;

  const showError = (title: string, error: unknown, fallback: string) =>
    Alert.alert(title, error instanceof ApiError ? error.message : fallback);

  const addDocument = async (reservation: Reservation) => {
    let file: Awaited<ReturnType<typeof pickDocument>>;
    try {
      file = await pickDocument();
    } catch (error) {
      showError("Fichier illisible", error, "Impossible de lire ce fichier.");
      return;
    }
    if (!file) return;

    setUploadingId(reservation.reservation_id);
    try {
      const document = await uploadDocument(reservation.reservation_id, file);
      setReservations(
        (current) =>
          current?.map((item) =>
            item.reservation_id === reservation.reservation_id
              ? { ...item, documents: [...item.documents, document] }
              : item,
          ) ?? null,
      );
    } catch (error) {
      showError(
        "Envoi impossible",
        error,
        `Impossible d'envoyer ${file.name}.`,
      );
    } finally {
      setUploadingId(null);
    }
  };

  const showDocument = async (document: ReservationDocument) => {
    setOpeningDocumentId(document.document_id);
    try {
      await openDocument(document);
    } catch (error) {
      showError(
        "Ouverture impossible",
        error,
        "Impossible d'ouvrir le document.",
      );
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const confirmDeleteDocument = (document: ReservationDocument) => {
    Alert.alert(
      "Supprimer le document ?",
      `« ${document.document_name} » sera supprimé.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api(`/api/reservations/documents/${document.document_id}`, {
                method: "DELETE",
              });
              setReservations(
                (current) =>
                  current?.map((item) => ({
                    ...item,
                    documents: item.documents.filter(
                      (doc) => doc.document_id !== document.document_id,
                    ),
                  })) ?? null,
              );
            } catch (error) {
              showError(
                "Suppression impossible",
                error,
                "La suppression a échoué.",
              );
            }
          },
        },
      ],
    );
  };

  const confirmDelete = (reservation: Reservation) => {
    Alert.alert(
      "Supprimer la réservation ?",
      `« ${reservation.reservation_name} » et ses documents seront supprimés.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api(
                `/api/reservations/delete/${reservation.reservation_id}`,
                { method: "DELETE" },
              );
              setReservations(
                (current) =>
                  current?.filter(
                    (item) =>
                      item.reservation_id !== reservation.reservation_id,
                  ) ?? null,
              );
            } catch (error) {
              Alert.alert(
                "Suppression impossible",
                error instanceof ApiError
                  ? error.message
                  : "La suppression a échoué.",
              );
            }
          },
        },
      ],
    );
  };

  const openForm = (reservation?: Reservation) =>
    router.push({
      pathname: "/event/[uuid]/reservation-form",
      params: reservation
        ? { uuid, id: String(reservation.reservation_id) }
        : { uuid },
    });

  const addReservation = () => {
    if (limit !== null && reservations && reservations.length >= limit) {
      Alert.alert(
        "Limite atteinte",
        `Un événement est limité à ${limit} réservations.`,
      );
      return;
    }
    openForm();
  };

  const header = (
    <ScreenHeader
      title="Réservations"
      subtitle={event.event_name}
      action={
        <Pressable
          onPress={addReservation}
          disabled={reservations === null}
          hitSlop={6}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une réservation"
        >
          <Plus size={22} color={colors.neutral} />
        </Pressable>
      }
    />
  );

  if (reservations === null) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {header}
        <View style={styles.centered}>
          {errorMessage ? (
            <>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable onPress={load} hitSlop={8}>
                <Text style={styles.link}>Réessayer</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={colors.accentDark} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const filtered =
    activeType === "all"
      ? reservations
      : reservations.filter((r) => r.reservation_type === activeType);
  const upcoming = filtered.filter((r) => !isPastReservation(r));
  const past = filtered.filter((r) => isPastReservation(r));
  const next = reservations.find((r) => !isPastReservation(r));
  const presentTypes = RESERVATION_TYPES.filter((type) =>
    reservations.some((r) => r.reservation_type === type),
  );

  const scrollToNext = () => {
    if (!next) return;
    const scroll = () => {
      const y = cardY.current.get(next.reservation_id);
      if (y !== undefined) {
        scrollRef.current?.scrollTo({
          y: listY.current + y - spacing.md,
          animated: true,
        });
      }
    };
    // Si un filtre la cache, on réaffiche tout avant de défiler.
    if (activeType === "all") {
      scroll();
    } else {
      setActiveType("all");
      setTimeout(scroll, 150);
    }
  };

  const renderCards = (items: Reservation[], isPast: boolean) =>
    items.map((reservation) => (
      <View
        key={reservation.reservation_id}
        onLayout={(layout) => {
          if (!isPast) {
            cardY.current.set(
              reservation.reservation_id,
              layout.nativeEvent.layout.y,
            );
          }
        }}
      >
        <ReservationCard
          reservation={reservation}
          isPast={isPast}
          canManage={canManage(reservation)}
          canDeleteDocument={canDeleteDocument}
          isUploading={uploadingId === reservation.reservation_id}
          openingDocumentId={openingDocumentId}
          onEdit={() => openForm(reservation)}
          onDelete={() => confirmDelete(reservation)}
          onAddDocument={() => addDocument(reservation)}
          onOpenDocument={showDocument}
          onDeleteDocument={confirmDeleteDocument}
        />
      </View>
    ));

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {header}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.accentDark]}
            tintColor={colors.accentDark}
          />
        }
      >
        {errorMessage !== "" && (
          <Text style={styles.error}>{errorMessage}</Text>
        )}

        {reservations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              Aucune réservation pour cet événement.
            </Text>
            <Text style={styles.emptyText}>
              Ajoutez votre première réservation avec le bouton +.
            </Text>
          </View>
        ) : (
          <>
            {next && (
              <NextReservation reservation={next} onPress={scrollToNext} />
            )}

            {presentTypes.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
              >
                <FilterChip
                  label="Tout"
                  isActive={activeType === "all"}
                  onPress={() => setActiveType("all")}
                />
                {presentTypes.map((type) => (
                  <FilterChip
                    key={type}
                    type={type}
                    label={RESERVATION_TYPE_INFO[type].label}
                    isActive={activeType === type}
                    onPress={() => setActiveType(type)}
                  />
                ))}
              </ScrollView>
            )}

            <View
              style={styles.list}
              onLayout={(layout) => {
                listY.current = layout.nativeEvent.layout.y;
              }}
            >
              {upcoming.length > 0 ? (
                renderCards(upcoming, false)
              ) : (
                <Text style={styles.emptyText}>
                  {activeType === "all"
                    ? "Toutes les réservations sont passées."
                    : "Aucune réservation à venir de ce type."}
                </Text>
              )}
            </View>

            {past.length > 0 && (
              <View style={styles.list}>
                <Pressable
                  onPress={() => setShowPast((value) => !value)}
                  style={styles.pastToggle}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showPast }}
                >
                  <Text style={styles.pastToggleText}>
                    Réservations passées ({past.length})
                  </Text>
                  <ChevronDown
                    size={18}
                    color={colors.title}
                    style={showPast && styles.chevronOpen}
                  />
                </Pressable>
                {showPast && renderCards(past, true)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NextReservation({
  reservation,
  onPress,
}: {
  reservation: Reservation;
  onPress: () => void;
}) {
  const { Icon, color, cover } = readTypeInfo(reservation.reservation_type);
  const schedule = formatSchedule(reservation);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.next, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityHint="Affiche la carte de la réservation"
    >
      <View style={[styles.nextIcon, { backgroundColor: cover[0] }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.nextContent}>
        <Text style={styles.nextLabel}>
          Prochaine réservation ·{" "}
          {formatCountdown(reservation.reservation_date_start)}
        </Text>
        <Text style={styles.nextName} numberOfLines={1}>
          {reservation.reservation_name}
        </Text>
        <Text style={styles.nextDetails} numberOfLines={2}>
          {formatDayHeader(reservation.reservation_date_start)}
          {schedule && ` · ${schedule}`}
          {` · ${reservation.reservation_location}`}
        </Text>
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  type,
  isActive,
  onPress,
}: {
  label: string;
  type?: ReservationType;
  isActive: boolean;
  onPress: () => void;
}) {
  const Icon = type ? RESERVATION_TYPE_INFO[type].Icon : null;
  const color = isActive ? colors.neutral : colors.title;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, isActive && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      {Icon && <Icon size={14} color={color} />}
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </Pressable>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  stateText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.text,
    textAlign: "center",
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.title,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.negative,
  },
  empty: {
    gap: spacing.xs,
    marginTop: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.title,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  next: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  nextIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  nextContent: {
    flex: 1,
    gap: 2,
  },
  nextLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.accent,
  },
  nextName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  nextDetails: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  filters: {
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  chipActive: {
    borderColor: colors.accentDark,
    backgroundColor: colors.accentDark,
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  list: {
    gap: spacing.md,
  },
  pastToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  pastToggleText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.title,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  addButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.accentDark,
  },
  pressed: {
    opacity: 0.7,
  },
});
