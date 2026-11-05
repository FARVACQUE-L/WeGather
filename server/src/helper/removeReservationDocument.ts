import fs from "node:fs/promises";
import path from "node:path";
import { RESERVATION_DOCUMENTS_DESTINATION } from "../middleware/upload";

export const DOCUMENT_FILENAME = /^[a-f0-9]{32}$/;

export const readDocumentPath = (file: string) =>
  path.join(
    path.resolve(process.cwd(), RESERVATION_DOCUMENTS_DESTINATION),
    file,
  );

export const removeReservationDocument = async (file: string) => {
  if (!DOCUMENT_FILENAME.test(file)) return;
  await fs.unlink(readDocumentPath(file)).catch(() => {});
};
