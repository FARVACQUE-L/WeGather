import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

// Même format que le recadrage du site : 4/3, 1200 px de large, JPEG.
const RATIO = 4 / 3;
const OUTPUT_WIDTH = 1200;

// Choisit une photo dans la galerie du téléphone et la prépare pour
// l'envoi. Renvoie null si l'utilisateur annule.
export const pickPhoto = async (): Promise<string | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    // Recadrage manuel en 4/3 sur Android ; sur iPhone le recadrage
    // système est forcément carré, on recadre donc au centre ci-dessous.
    allowsEditing: Platform.OS === "android",
    aspect: [4, 3],
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const { uri, width, height } = result.assets[0];
  const context = ImageManipulator.manipulate(uri);

  if (width > 0 && height > 0) {
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
