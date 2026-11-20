import { Directory, File, Paths } from "expo-file-system";

import { API_URL } from "@/constants/config";
import { ApiError, api, authHeaders } from "@/lib/api";
import type { ReservationDocument } from "@/types/reservation";

// Mêmes règles que le serveur (middleware/upload.ts, reservationDocumentActions.ts).
export const MAX_DOCUMENTS_PER_RESERVATION = 5;
const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;
const ACCEPTED_DOCUMENTS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

// Ouvre le sélecteur de fichiers du téléphone (PDF ou image).
// Renvoie null si l'utilisateur annule.
export const pickDocument = async (): Promise<File | null> => {
  const picked = await File.pickFileAsync({ mimeTypes: ACCEPTED_DOCUMENTS });
  return picked.canceled ? null : picked.result;
};

// Le sélecteur Android ne renseigne pas toujours le type : on le déduit
// alors de l'extension. Le serveur vérifie de toute façon le contenu.
const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

const readExtension = (name: string) =>
  name.includes(".") ? (name.split(".").pop()?.toLowerCase() ?? "") : "";

const readType = (file: File) => {
  if (ACCEPTED_DOCUMENTS.includes(file.type)) return file.type;
  return EXTENSION_TYPES[readExtension(file.name)] ?? null;
};

export const uploadDocument = async (reservationId: number, file: File) => {
  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new ApiError(400, `${file.name} dépasse 8 Mo.`);
  }
  const type = readType(file);
  if (!type) {
    throw new ApiError(400, "Ajoutez un fichier PDF ou une image.");
  }

  // Le fetch d'Expo lit le contenu par bytes() (voir lib/photos.ts).
  const body = new FormData();
  body.append("document", {
    name: file.name,
    type,
    bytes: () => file.bytes(),
  } as unknown as Blob);

  return api<ReservationDocument>(
    `/api/reservations/${reservationId}/documents`,
    { method: "POST", body },
  );
};

// Télécharge le document (route protégée) dans le cache de l'app, puis
// l'ouvre avec l'application du téléphone adaptée (lecteur PDF, galerie…).
export const openDocument = async (document: ReservationDocument) => {
  const folder = new Directory(Paths.cache, "documents");
  if (!folder.exists) folder.create({ intermediates: true });

  // Nom local simple : Android déduit le type du fichier depuis son nom
  // et échoue dès qu'il contient des espaces ou des accents
  // (« réservation été.pdf »). Le vrai nom sert de titre à l'aperçu.
  const extension = readExtension(document.document_name);
  const mimeType = EXTENSION_TYPES[extension];
  const file = new File(
    folder,
    `document-${document.document_id}${mimeType ? `.${extension}` : ""}`,
  );

  if (!file.exists) {
    try {
      await File.downloadFileAsync(
        `${API_URL}/api/reservations/documents/${document.document_id}/download`,
        file,
        { headers: authHeaders() },
      );
    } catch {
      throw new ApiError(0, "Impossible de télécharger le document.");
    }
  }

  try {
    await file.preview({ title: document.document_name, mimeType });
  } catch {
    throw new ApiError(
      0,
      "Aucune application du téléphone ne peut ouvrir ce document.",
    );
  }
};
