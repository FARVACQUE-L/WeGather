import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  CalendarDays,
  ChevronLeft,
  Crown,
  MapPin,
  MessageCircle,
  Share2,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api } from "@/lib/api";
import { formatLongDate } from "@/lib/dates";
import { imageUrl } from "@/lib/imageUrl";
import { getSocket } from "@/lib/socket";
import type { EventDetail, Group, GroupMember } from "@/types/event";

const PRESENCE_LABELS = {
  online: "En ligne",
  offline: "Hors ligne",
} as const;

export default function EventScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // Vrai quand cet écran est affiché (faux quand le chat est ouvert
  // par-dessus : ses messages sont lus, ils ne comptent pas).
  const isFocusedRef = useRef(false);

  const loadUnreadCount = useCallback(() => {
    api<{ count: number }>(`/api/messages/unread/${uuid}`)
      .then((result) => setUnreadCount(result.count))
      .catch(() => {});
  }, [uuid]);

  // Rechargé à chaque retour sur l'écran (par exemple en sortant du chat).
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      loadUnreadCount();
      return () => {
        isFocusedRef.current = false;
      };
    }, [loadUnreadCount]),
  );

  const loadGroup = useCallback(async () => {
    setGroup(await api<Group>(`/api/events/${uuid}/group`));
  }, [uuid]);

  const load = useCallback(async () => {
    try {
      const [eventData] = await Promise.all([
        api<EventDetail>(`/api/events/${uuid}`),
        loadGroup(),
      ]);
      setEvent(eventData);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Erreur serveur",
      );
    }
  }, [uuid, loadGroup]);

  useEffect(() => {
    load();
  }, [load]);

  // Pastilles « en ligne » mises à jour en direct, comme sur le site.
  useEffect(() => {
    const socket = getSocket();
    const refreshPresence = () => {
      loadGroup().catch(() => {});
    };

    // Messages lus sur un autre appareil (le site par exemple).
    const handleMessagesRead = (data: { eventUuid: string }) => {
      if (data.eventUuid === uuid) setUnreadCount(0);
    };

    // Nouveaux messages des autres membres : la pastille du bouton
    // Messagerie augmente en direct.
    const handleNewMessage = (message: { user_id: number }) => {
      if (message.user_id !== user?.id && isFocusedRef.current) {
        setUnreadCount((count) => count + 1);
      }
    };

    // Le salon de l'événement est rejoint ici et quitté en sortant de
    // cet écran. Le chat, ouvert par-dessus, ne le quitte pas.
    // Après une coupure, le serveur a oublié le salon : on le rejoint
    // et on recompte les messages arrivés entre-temps.
    const join = () => socket?.emit("join-event", uuid);
    const handleReconnect = () => {
      join();
      loadUnreadCount();
    };

    join();
    socket?.on("connect", handleReconnect);
    socket?.on("new-message", handleNewMessage);
    socket?.on("presence-changed", refreshPresence);
    socket?.on("messages-read", handleMessagesRead);
    return () => {
      socket?.emit("leave-event", uuid);
      socket?.off("connect", handleReconnect);
      socket?.off("new-message", handleNewMessage);
      socket?.off("presence-changed", refreshPresence);
      socket?.off("messages-read", handleMessagesRead);
    };
  }, [loadGroup, loadUnreadCount, uuid, user?.id]);

  const refresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  // L'hôte en premier, puis l'ordre renvoyé par le serveur.
  const members = useMemo(
    () =>
      group
        ? [...group.members].sort(
            (a, b) =>
              Number(b.euj_id_user === group.host_id) -
              Number(a.euj_id_user === group.host_id),
          )
        : [],
    [group],
  );

  const shareCode = () => {
    if (!event) return;
    Share.share({
      message: `Rejoins « ${event.event_name} » sur WeGather avec le code ${event.event_link_key}`,
    });
  };

  if (errorMessage && !event) {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={refresh} hitSlop={8}>
            <Text style={styles.link}>Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!event || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton />
        <ActivityIndicator color={colors.accentDark} style={styles.loader} />
      </SafeAreaView>
    );
  }

  const picture = imageUrl(event.event_picture);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <CalendarDays size={18} color={colors.title} />
              <Text style={styles.infoText}>
                Du {formatLongDate(event.event_date_start)} au{" "}
                {formatLongDate(event.event_date_end)}
              </Text>
            </View>
            {event.event_location !== "" && (
              <View style={styles.infoRow}>
                <MapPin size={18} color={colors.title} />
                <Text style={styles.infoText}>{event.event_location}</Text>
              </View>
            )}
            {event.event_description !== "" && (
              <Text style={styles.description}>{event.event_description}</Text>
            )}
          </View>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/event/[uuid]/chat",
                params: { uuid, name: event.event_name },
              })
            }
            style={({ pressed }) => [
              styles.chatButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `Messagerie, ${unreadCount} message${unreadCount > 1 ? "s" : ""} non lu${unreadCount > 1 ? "s" : ""}`
                : "Messagerie"
            }
          >
            <LinearGradient
              colors={["#e98d66", "#b44708"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatButtonInner}
            >
              <MessageCircle size={20} color={colors.neutral} />
              <Text style={styles.chatButtonText}>Messagerie</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>

          <View style={[styles.card, styles.codeCard]}>
            <View>
              <Text style={styles.codeLabel}>Code de l'événement</Text>
              <Text style={styles.codeValue} selectable>
                {event.event_link_key}
              </Text>
            </View>
            <Pressable
              onPress={shareCode}
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Partager le code de l'événement"
            >
              <Share2 size={18} color={colors.neutral} />
              <Text style={styles.shareText}>Inviter</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Membres{" "}
              <Text style={styles.sectionCount}>({members.length})</Text>
            </Text>
            {members.map((member) => (
              <MemberRow
                key={member.euj_id_user}
                member={member}
                isHost={member.euj_id_user === group.host_id}
                isMe={member.euj_id_user === user?.id}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BackButton({ onImage = false }: { onImage?: boolean }) {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      style={[styles.back, onImage && styles.backOnImage]}
      accessibilityRole="button"
      accessibilityLabel="Retour à mes événements"
    >
      <ChevronLeft size={26} color={onImage ? colors.neutral : colors.title} />
    </Pressable>
  );
}

function MemberRow({
  member,
  isHost,
  isMe,
}: {
  member: GroupMember;
  isHost: boolean;
  isMe: boolean;
}) {
  const photo = imageUrl(member.user_profile_picture);

  return (
    <View style={styles.member}>
      <View style={styles.avatar}>
        {photo ? (
          <Image source={photo} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <Text style={styles.avatarInitial}>
            {member.user_username.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      {member.status && (
        <View
          style={[
            styles.presence,
            member.status === "online" ? styles.online : styles.offline,
          ]}
          accessibilityLabel={PRESENCE_LABELS[member.status]}
        />
      )}
      <Text style={styles.memberName} numberOfLines={1}>
        {member.user_username}
        {isMe && <Text style={styles.memberMe}> (vous)</Text>}
      </Text>
      {isHost && (
        <View style={styles.hostBadge}>
          <Crown size={14} color={colors.title} />
          <Text style={styles.hostText}>Hôte</Text>
        </View>
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
    paddingBottom: spacing.xl,
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
  hero: {
    height: 280,
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
    fontSize: 30,
    color: colors.neutral,
  },
  back: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    margin: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  backOnImage: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  body: {
    gap: spacing.md,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  card: {
    gap: spacing.md,
    padding: spacing.md + 4,
    borderRadius: 16,
    backgroundColor: colors.neutral,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  chatButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  chatButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
  },
  chatButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: colors.neutral,
  },
  unreadText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.accentDark,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  codeValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: 3,
    color: colors.title,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.accentDark,
  },
  shareText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.neutral,
  },
  pressed: {
    opacity: 0.7,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.title,
  },
  sectionCount: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#fbf2ed",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.accentDark,
  },
  presence: {
    position: "absolute",
    left: 32,
    top: 32,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.neutral,
  },
  online: {
    backgroundColor: "#22c55e",
  },
  offline: {
    backgroundColor: "#9ca3af",
  },
  memberName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.text,
  },
  memberMe: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#ffdcc4",
  },
  hostText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.title,
  },
});
