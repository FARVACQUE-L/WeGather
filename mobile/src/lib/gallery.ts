import { Directory, File, Paths } from "expo-file-system";
import { Asset, requestPermissionsAsync } from "expo-media-library";

import { API_URL } from "@/constants/config";
import { ApiError, authHeaders } from "@/lib/api";
import type { Photo } from "@/types/gallery";

// Demande l'autorisation d'ajouter des photos à la photothèque, une seule
// fois avant un enregistrement. Sur Android 11 et plus, aucune autorisation
// n'est nécessaire ; Expo Go peut même refuser de la demander : on tente
// alors l'enregistrement quand même.
export const requestSavePermission = async () => {
  try {
    const { granted, canAskAgain } = await requestPermissionsAsync(true);
    if (!granted && !canAskAgain) {
      throw new ApiError(
        0,
        "Autorisez WeGather à enregistrer des photos dans les réglages du téléphone.",
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
  }
};

// Télécharge la photo (route protégée) puis l'ajoute à la photothèque.
// Le serveur nomme le fichier « photo-<id>.<extension> » : l'extension
// permet au téléphone de reconnaître le format.
export const savePhotoToDevice = async (photo: Photo) => {
  const folder = new Directory(
    Paths.cache,
    "gallery",
    String(photo.gallery_id),
  );
  if (!folder.exists) folder.create({ intermediates: true });

  let file: File;
  try {
    file = await File.downloadFileAsync(
      `${API_URL}/api/gallery/${photo.gallery_id}/download`,
      folder,
      { headers: authHeaders(), idempotent: true },
    );
  } catch {
    throw new ApiError(0, "Impossible de télécharger la photo.");
  }

  try {
    await Asset.create(file.uri);
  } catch {
    throw new ApiError(
      0,
      "Impossible d'enregistrer la photo dans la photothèque.",
    );
  } finally {
    // La copie est dans la photothèque : le fichier en cache ne sert plus.
    try {
      folder.delete();
    } catch {}
  }
};
