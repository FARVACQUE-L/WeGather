import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { EllipsisVertical, Heart, ImagePlus } from "lucide-react-native";
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

import { PhotoFormModal } from "@/components/PhotoFormModal";
import { PhotoViewer } from "@/components/PhotoViewer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useEvent } from "@/context/EventContext";
import { ApiError, api } from "@/lib/api";
import { imageUrl } from "@/lib/imageUrl";
import { photoFile } from "@/lib/photos";
import type { Photo } from "@/types/gallery";

const COLUMNS = 2;

export default function GalleryScreen() {
  const { user } = useAuth();
  const { uuid, event, group } = useEvent();
  const { width } = useWindowDimensions();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // Nombre maximum de photos, selon l'offre de l'hôte.
  const [limit, setLimit] = useState<number | null>(null);
  // Formulaire ouvert : ajout (photo null) ou modification d'une photo.
  const [form, setForm] = useState<{ photo: Photo | null } | null>(null);
  // Photos dont le « j'aime » est en cours d'envoi (évite le double appui).
  const pendingLikes = useRef(new Set<number>());

  const userId = user?.id;

  const load = useCallback(async () => {
    if (userId === undefined) return;
    try {
      const [list, liked, limitData] = await Promise.all([
        api<Photo[]>(`/api/gallery/${uuid}`),
        api<number[]>(`/api/gallery/${uuid}/likes/${userId}`).catch(
          () => [] as number[],
        ),
        api<{ limit: number }>(`/api/gallery/${uuid}/limit`).catch(() => null),
      ]);
      setPhotos(list);
      setLikedIds(new Set(liked));
      setLimit(limitData?.limit ?? null);
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

  if (!event || !group || !user) return null;

  // Comme le serveur : l'auteur de la photo ou l'hôte de l'événement.
  const canManage = (photo: Photo) =>
    photo.gallery_id_user === user.id || group.host_id === user.id;

  const openAddForm = () => {
    if (limit !== null && photos && photos.length >= limit) {
      Alert.alert(
        "Limite atteinte",
        `La galerie est limitée à ${limit} photos. Supprimez-en une pour en ajouter une autre.`,
      );
      return;
    }
    setForm({ photo: null });
  };

  // Renvoie le message d'erreur à afficher dans le formulaire.
  const savePhoto = async (photoUri: string | null, description: string) => {
    const photo = form?.photo;
    try {
      if (photo) {
        await api(`/api/gallery/${photo.gallery_id}/${user.id}`, {
          method: "PUT",
          body: { gallery_description: description },
        });
        setPhotos(
          (current) =>
            current?.map((item) =>
              item.gallery_id === photo.gallery_id
                ? { ...item, gallery_description: description || null }
                : item,
            ) ?? null,
        );
      } else if (photoUri) {
        // Les champs texte avant le fichier, comme le formulaire du site.
        const body = new FormData();
        body.append("event_uuid", uuid);
        body.append("gallery_description", description);
        body.append("photo", photoFile(photoUri, "photo.jpg"));
        await api("/api/gallery", { method: "POST", body });
        await load();
      }
    } catch (error) {
      return error instanceof ApiError
        ? error.message
        : "L'enregistrement a échoué.";
    }
    setForm(null);
    return undefined;
  };

  const deletePhoto = async (photo: Photo) => {
    try {
      await api(`/api/gallery/${photo.gallery_id}/${user.id}`, {
        method: "DELETE",
      });
      setPhotos(
        (current) =>
          current?.filter((item) => item.gallery_id !== photo.gallery_id) ??
          null,
      );
    } catch (error) {
      Alert.alert(
        "Suppression impossible",
        error instanceof ApiError ? error.message : "La suppression a échoué.",
      );
    }
  };

  const confirmDelete = (photo: Photo) =>
    Alert.alert(
      "Supprimer la photo ?",
      "Elle sera retirée de la galerie pour tout le groupe.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deletePhoto(photo),
        },
      ],
    );

  const openMenu = (photo: Photo) =>
    Alert.alert("Photo", photo.gallery_description || undefined, [
      {
        text: "Modifier la description",
        onPress: () => setForm({ photo }),
      },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => confirmDelete(photo),
      },
      { text: "Annuler", style: "cancel" },
    ]);

  const header = (
    <ScreenHeader
      title="Galerie"
      subtitle={event.event_name}
      action={
        <Pressable
          onPress={openAddForm}
          disabled={photos === null}
          hitSlop={6}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une photo"
        >
          <ImagePlus size={20} color={colors.neutral} />
        </Pressable>
      }
    />
  );
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
              Partagez vos meilleurs souvenirs en ajoutant la première photo
              avec le bouton en haut à droite.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isLiked = likedIds.has(item.gallery_id);
          return (
            <View style={[styles.tile, { width: tileSize }]}>
              <Pressable
                onPress={() => setViewerIndex(index)}
                onLongPress={canManage(item) ? () => openMenu(item) : undefined}
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
                {canManage(item) && (
                  <Pressable
                    onPress={() => openMenu(item)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Gérer la photo"
                  >
                    <EllipsisVertical size={18} color={colors.textMuted} />
                  </Pressable>
                )}
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

      <PhotoFormModal
        visible={form !== null}
        initialDescription={
          form?.photo ? (form.photo.gallery_description ?? "") : undefined
        }
        onCancel={() => setForm(null)}
        onSubmit={savePhoto}
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
