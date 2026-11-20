import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import {
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  PencilLine,
  Trash2,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/constants/theme";
import { imageUrl } from "@/lib/imageUrl";
import {
  formatBadgeDate,
  formatSchedule,
  readTypeInfo,
} from "@/lib/reservations";
import type { Reservation } from "@/types/reservation";

// Carte d'une réservation, reprise du « wallet » du site.
export function ReservationCard({
  reservation,
  isPast,
  canManage,
  onEdit,
  onDelete,
}: {
  reservation: Reservation;
  isPast: boolean;
  canManage: boolean;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const { label, Icon, cover, color } = readTypeInfo(
    reservation.reservation_type,
  );
  const picture = imageUrl(reservation.reservation_picture);
  const schedule = formatSchedule(reservation);
  const badge = formatBadgeDate(reservation.reservation_date_start);
  const link = reservation.reservation_link;

  return (
    <View style={[styles.card, isPast && styles.past]}>
      <View style={styles.cover}>
        {picture ? (
          <Image
            source={picture}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            accessibilityLabel={reservation.reservation_name}
          />
        ) : (
          <LinearGradient
            colors={cover}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.coverIcon]}
          >
            <Icon size={52} strokeWidth={1.5} color={color} />
          </LinearGradient>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeDay}>{badge.day}</Text>
          <Text style={styles.badgeMonth}>{badge.month}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.meta}>
          <View style={[styles.type, { backgroundColor: cover[0] }]}>
            <Icon size={13} color={color} />
            <Text style={[styles.typeText, { color }]}>{label}</Text>
          </View>
          {schedule && (
            <View style={styles.schedule}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={styles.scheduleText} numberOfLines={1}>
                {schedule}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{reservation.reservation_name}</Text>
        <View style={styles.location}>
          <MapPin size={14} color={colors.title} />
          <Text style={styles.locationText}>
            {reservation.reservation_location}
          </Text>
        </View>
        <Text style={styles.description}>
          {reservation.reservation_description}
        </Text>

        {reservation.documents.length > 0 && (
          <View style={styles.documents}>
            {reservation.documents.map((document) => (
              <View key={document.document_id} style={styles.document}>
                <FileText size={14} color={colors.title} />
                <Text style={styles.documentName} numberOfLines={1}>
                  {document.document_name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {(link || canManage) && (
          <View style={styles.actions}>
            {link ? (
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(link)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="link"
              >
                <ExternalLink size={14} color={colors.title} />
                <Text style={styles.linkText}>Voir le site</Text>
              </Pressable>
            ) : (
              <View />
            )}
            {canManage && (
              <View style={styles.manage}>
                {onEdit && (
                  <Pressable
                    onPress={onEdit}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.iconButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Modifier la réservation"
                  >
                    <PencilLine size={18} color={colors.textMuted} />
                  </Pressable>
                )}
                <Pressable
                  onPress={onDelete}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Supprimer la réservation"
                >
                  <Trash2 size={18} color={colors.negative} />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.neutral,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  past: {
    opacity: 0.6,
  },
  cover: {
    height: 130,
    backgroundColor: "#fbf2ed",
  },
  coverIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: spacing.sm + 4,
    left: spacing.sm + 4,
    minWidth: 48,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.neutral,
  },
  badgeDay: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.title,
  },
  badgeMonth: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  body: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  type: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  schedule: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scheduleText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  documents: {
    gap: 6,
  },
  document: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  documentName: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.title,
  },
  manage: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  iconButton: {
    padding: 6,
  },
  pressed: {
    opacity: 0.6,
  },
});
