import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIRECTORY } from "../middleware/upload";

export const removeUpload = async (image: string | null | undefined) => {
  if (!image?.includes("/uploads/")) return;
  await fs
    .unlink(path.join(UPLOADS_DIRECTORY, path.basename(image)))
    .catch(() => {});
};
