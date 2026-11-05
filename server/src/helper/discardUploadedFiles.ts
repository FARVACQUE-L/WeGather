import fs from "node:fs/promises";
import type { Request } from "express";

export const discardUploadedFiles = async (req: Request) => {
  const files = req.file
    ? [req.file]
    : Array.isArray(req.files)
      ? req.files
      : Object.values(req.files ?? {}).flat();

  await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
};
