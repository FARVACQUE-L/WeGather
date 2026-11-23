import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

// Même format que le recadrage du site : 4/3, 1200 px de large, JPEG.
const RATIO = 4 / 3;
const OUTPUT_WIDTH = 1200;
// Photos de galerie : cadrage d'origine, plus grand côté limité.
const GALLERY_MAX_SIDE = 2000;

// Choisit une photo dans la galerie du téléphone et la prépare pour
// l'envoi. Renvoie null si l'utilisateur annule.
// crop: false garde le cadrage d'origine (galerie) au lieu du 4/3.
export const pickPhoto = async ({
  crop = true,
}: {
  crop?: boolean;
} = {}): Promise<string | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    // Recadrage manuel en 4/3 sur Android ; sur iPhone le recadrage
    // système est forcément carré, on recadre donc au centre ci-dessous.
    allowsEditing: crop && Platform.OS === "android",
    aspect: [4, 3],
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const { uri, width, height } = result.assets[0];
  const context = ImageManipulator.manipulate(uri);

  if (!crop) {
    if (width >= height && width > GALLERY_MAX_SIDE) {
      context.resize({ width: GALLERY_MAX_SIDE, height: null });
    } else if (height > width && height > GALLERY_MAX_SIDE) {
      context.resize({ width: null, height: GALLERY_MAX_SIDE });
    }
  } else if (width > 0 && height > 0) {
    const cropWidth = width / height > RATIO ? height * RATIO : width;
    const cropHeight = cropWidth / RATIO;
    context.crop({
      originX: Math.round((width - cropWidth) / 2),
      originY: Math.round((height - cropHeight) / 2),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    });
    if (cropWidth > OUTPUT_WIDTH) {
      context.resize({ width: OUTPUT_WIDTH, height: null });
    }
  }

  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.85,
  });
  return saved.uri;
};

// Fichier local à joindre à un FormData. Le fetch d'Expo (SDK 58) ne
// sait pas lire le format React Native { uri, name, type } : il échoue
// avant même de contacter le serveur. Il lit en revanche les objets qui
// fournissent leur contenu par bytes(), comme File d'expo-file-system.
export const photoFile = (uri: string, name: string) => {
  const file = new File(uri);
  return {
    name,
    type: "image/jpeg",
    bytes: () => file.bytes(),
  } as unknown as Blob;
};
