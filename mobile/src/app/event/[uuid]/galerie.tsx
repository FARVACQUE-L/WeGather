import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { Heart } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PhotoViewer } from "@/components/PhotoViewer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useEvent } from "@/context/EventContext";
import { ApiError, api } from "@/lib/api";
import { imageUrl } from "@/lib/imageUrl";
import type { Photo } from "@/types/gallery";

const COLUMNS = 2;

export default function GalleryScreen() {
  const { user } = useAuth();
  const { uuid, event } = useEvent();
  const { width } = useWindowDimensions();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // Photos dont le « j'aime » est en cours d'envoi (évite le double appui).
  const pendingLikes = useRef(new Set<number>());

  const userId = user?.id;

  const load = useCallback(async () => {
    if (userId === undefined) return;
    try {
      const [list, liked] = await Promise.all([
        api<Photo[]>(`/api/gallery/${uuid}`),
        api<number[]>(`/api/gallery/${uuid}/likes/${userId}`).catch(
          () => [] as number[],
        ),
      ]);
      setPhotos(list);
      setLikedIds(new Set(liked));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Erreur serveur",
      );
    }
  }, [uuid, userId]);

  // Rechargé à chaque affichage : d'autres membres ajoutent des photos.
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

  const updateLike = (photoId: number, isLiked: boolean) => {
    setLikedIds((current) => {
      const next = new Set(current);
      if (isLiked) next.add(photoId);
      else next.delete(photoId);
      return next;
    });
    setPhotos(
      (current) =>
        current?.map((photo) =>
          photo.gallery_id === photoId
            ? {
                ...photo,
                like_count: Math.max(
                  0,
                  Number(photo.like_count) + (isLiked ? 1 : -1),
                ),
              }
            : photo,
        ) ?? null,
    );
  };

  // Mis à jour tout de suite à l'écran, annulé si le serveur refuse.
  const toggleLike = async (photo: Photo) => {
    const id = photo.gallery_id;
    if (userId === undefined || pendingLikes.current.has(id)) return;
    const wasLiked = likedIds.has(id);

    pendingLikes.current.add(id);
    updateLike(id, !wasLiked);
    try {
      if (wasLiked) {
        await api(`/api/gallery/${id}/like/${userId}`, { method: "DELETE" });
      } else {
        await api(`/api/gallery/${id}/like`, { method: "POST" });
      }
    } catch (error) {
      // 409 : déjà aimée (par exemple depuis le site) ; l'écran est juste.
      if (!(error instanceof ApiError && error.status === 409)) {
        updateLike(id, wasLiked);
        Alert.alert(
          "Action impossible",
          error instanceof ApiError ? error.message : "Erreur serveur",
        );
      }
    } finally {
      pendingLikes.current.delete(id);
    }
  };

  if (!event || !user) return null;

  const header = <ScreenHeader title="Galerie" subtitle={event.event_name} />;
  const tileSize = (width - spacing.md * 2 - spacing.md) / COLUMNS;

  if (photos === null) {
    return (
      <SafeAreaView style={styles.container}>
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

  return (
    <SafeAreaView style={styles.container}>
      {header}
      <FlatList
        data={photos}
        keyExtractor={(photo) => String(photo.gallery_id)}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.accentDark]}
            tintColor={colors.accentDark}
          />
        }
        ListHeaderComponent={
          errorMessage !== "" ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              Aucune photo dans cet événement.
            </Text>
            <Text style={styles.emptyText}>
              Partagez vos meilleurs souvenirs en ajoutant la première photo.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isLiked = likedIds.has(item.gallery_id);
          return (
            <View style={[styles.tile, { width: tileSize }]}>
              <Pressable
                onPress={() => setViewerIndex(index)}
                style={({ pressed }) => pressed && styles.pressed}
                accessibilityRole="imagebutton"
                accessibilityLabel={
                  item.gallery_description ?? "Photo de l'événement"
                }
              >
                <Image
                  source={imageUrl(item.gallery_link)}
                  style={{ width: tileSize, height: tileSize }}
                  contentFit="cover"
                  transition={200}
                />
              </Pressable>
              <View style={styles.tileFooter}>
                <Text
                  style={[
                    styles.description,
                    !item.gallery_description && styles.noDescription,
                  ]}
                  numberOfLines={2}
                >
                  {item.gallery_description || "Aucune description"}
                </Text>
                <Pressable
                  onPress={() => toggleLike(item)}
                  hitSlop={8}
                  style={styles.like}
                  accessibilityRole="button"
                  accessibilityLabel={isLiked ? "Je n'aime plus" : "J'aime"}
                  accessibilityState={{ selected: isLiked }}
                >
                  <Heart
                    size={18}
                    color={isLiked ? colors.accent : colors.textMuted}
                    fill={isLiked ? colors.accent : "transparent"}
                  />
                  <Text style={styles.likeCount}>
                    {Number(item.like_count)}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <PhotoViewer
        photos={photos}
        startIndex={viewerIndex}
        likedIds={likedIds}
        onLike={toggleLike}
        onClose={() => setViewerIndex(null)}
      />
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
  row: {
    gap: spacing.md,
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
  tile: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.neutral,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tileFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: 10,
  },
  description: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
  },
  noDescription: {
    color: colors.textMuted,
  },
  like: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
