import { Image } from "expo-image";
import { MapPin } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/constants/theme";
import { formatDay, formatMonth } from "@/lib/dates";
import { imageUrl } from "@/lib/imageUrl";
import type { EventData } from "@/types/event";

type Props = {
  event: EventData;
  isHost: boolean;
  onPress: () => void;
};

export function EventCard({ event, isHost, onPress }: Props) {
  const picture = imageUrl(event.event_picture);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir l'événement ${event.event_name}`}
    >
      <View style={styles.imageWrapper}>
        {picture && (
          <Image
            source={picture}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
            transition={200}
          />
        )}
        <View style={styles.date}>
          <Text style={styles.dateDay}>
            {formatDay(event.event_date_start)}
          </Text>
          <Text style={styles.dateMonth}>
            {formatMonth(event.event_date_start)}
          </Text>
        </View>
        {isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>Organisateur</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.event_name}
        </Text>
        {event.event_description !== "" && (
          <Text style={styles.description} numberOfLines={3}>
            {event.event_description}
          </Text>
        )}
        {event.event_location !== "" && (
          <View style={styles.location}>
            <MapPin size={14} color={colors.text} />
            <Text style={styles.locationText} numberOfLines={1}>
              {event.event_location}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: colors.neutral,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  imageWrapper: {
    height: 192,
    backgroundColor: "#fbf2ed",
  },
  date: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: colors.background,
  },
  dateDay: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  dateMonth: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#414141",
  },
  hostBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.accentDark,
  },
  hostBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.neutral,
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.regular,
    fontSize: 24,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  locationText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
});
