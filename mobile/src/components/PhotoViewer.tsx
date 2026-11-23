import { Image } from "expo-image";
import { Heart, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, spacing } from "@/constants/theme";
import { imageUrl } from "@/lib/imageUrl";
import type { Photo } from "@/types/gallery";

// Aperçu plein écran de la galerie : on glisse pour passer d'une photo
// à l'autre, avec la description et le bouton « j'aime » en bas.
export function PhotoViewer({
  photos,
  startIndex,
  likedIds,
  onLike,
  onClose,
}: {
  photos: Photo[];
  // null : aperçu fermé.
  startIndex: number | null;
  likedIds: Set<number>;
  onLike: (photo: Photo) => void;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (startIndex !== null) setIndex(startIndex);
  }, [startIndex]);

  // La liste peut raccourcir pendant l'aperçu (photo supprimée ailleurs).
  const current = photos[Math.min(index, photos.length - 1)];
  const isLiked = current ? likedIds.has(current.gallery_id) : false;

  return (
    <Modal
      visible={startIndex !== null && photos.length > 0}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.viewer}>
        {startIndex !== null && (
          <FlatList
            data={photos}
            keyExtractor={(photo) => String(photo.gallery_id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.min(startIndex, photos.length - 1)}
            getItemLayout={(_, itemIndex) => ({
              length: width,
              offset: width * itemIndex,
              index: itemIndex,
            })}
            onMomentumScrollEnd={(scroll) =>
              setIndex(Math.round(scroll.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <Image
                source={imageUrl(item.gallery_link)}
                style={{ width, height: "100%" }}
                contentFit="contain"
                accessibilityLabel={
                  item.gallery_description ?? "Photo de l'événement"
                }
              />
            )}
          />
        )}

        <SafeAreaView edges={["top"]} style={styles.top}>
          <Text style={styles.counter}>
            {Math.min(index, photos.length - 1) + 1} / {photos.length}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.roundButton}
            accessibilityRole="button"
            accessibilityLabel="Fermer la photo"
          >
            <X size={26} color={colors.neutral} />
          </Pressable>
        </SafeAreaView>

        {current && (
          <SafeAreaView edges={["bottom"]} style={styles.bottom}>
            <Text style={styles.description} numberOfLines={3}>
              {current.gallery_description || "Aucune description"}
            </Text>
            <Pressable
              onPress={() => onLike(current)}
              hitSlop={8}
              style={styles.like}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? "Je n'aime plus" : "J'aime"}
              accessibilityState={{ selected: isLiked }}
            >
              <Heart
                size={24}
                color={isLiked ? colors.accent : colors.neutral}
                fill={isLiked ? colors.accent : "transparent"}
              />
              <Text style={styles.likeCount}>{Number(current.like_count)}</Text>
            </Pressable>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewer: {
    flex: 1,
    backgroundColor: "#000",
  },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  counter: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.neutral,
  },
  roundButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  description: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutral,
  },
  like: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  likeCount: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.neutral,
  },
});
