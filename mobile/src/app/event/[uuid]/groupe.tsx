import { Image } from "expo-image";
import { CalendarDays, Crown, MapPin, Share2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useEvent } from "@/context/EventContext";
import { formatLongDate } from "@/lib/dates";
import { imageUrl } from "@/lib/imageUrl";
import type { GroupMember } from "@/types/event";

const PRESENCE_LABELS = {
  online: "En ligne",
  offline: "Hors ligne",
} as const;

export default function GroupScreen() {
  const { user } = useAuth();
  const { event, group, reload } = useEvent();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Le layout n'affiche les onglets qu'une fois l'événement chargé.
  if (!event || !group) return null;

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const shareCode = () => {
    Share.share({
      message: `Rejoins « ${event.event_name} » sur WeGather avec le code ${event.event_link_key}`,
    });
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Groupe" subtitle={event.event_name} />
      <ScrollView
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
            Membres <Text style={styles.sectionCount}>({members.length})</Text>
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
      </ScrollView>
    </SafeAreaView>
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
  body: {
    gap: spacing.md,
    padding: spacing.md,
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
