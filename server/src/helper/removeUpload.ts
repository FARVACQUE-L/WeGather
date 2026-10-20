import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIRECTORY } from "../middleware/upload";

// Supprime du disque un fichier envoyé, à partir du chemin ou de l'URL
// enregistré en base (« /uploads/<fichier> » ou « http://hôte/uploads/<fichier> »).
// Les autres chemins (logo par défaut sous /assets) sont ignorés, et
// path.basename garde le fichier dans le dossier des envois. Un fichier déjà
// absent n'est pas une erreur.
export const removeUpload = async (image: string | null | undefined) => {
  if (!image?.includes("/uploads/")) return;
  await fs
    .unlink(path.join(UPLOADS_DIRECTORY, path.basename(image)))
    .catch(() => {});
};
