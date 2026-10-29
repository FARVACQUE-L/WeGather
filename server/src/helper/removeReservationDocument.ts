import fs from "node:fs/promises";
import path from "node:path";
import { RESERVATION_DOCUMENTS_DESTINATION } from "../middleware/upload";

// multer nomme ses fichiers avec un hash hexadécimal de 32 caractères. Tout
// autre nom est refusé, ce qui ferme la traversée de répertoire.
export const DOCUMENT_FILENAME = /^[a-f0-9]{32}$/;

export const readDocumentPath = (file: string) =>
  path.join(
    path.resolve(process.cwd(), RESERVATION_DOCUMENTS_DESTINATION),
    file,
  );

// Supprime du disque un document de réservation. Un fichier déjà absent n'est
// pas une erreur.
export const removeReservationDocument = async (file: string) => {
  if (!DOCUMENT_FILENAME.test(file)) return;
  await fs.unlink(readDocumentPath(file)).catch(() => {});
};
