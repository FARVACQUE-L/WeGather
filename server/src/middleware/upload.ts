import fs from "node:fs/promises";
import type { Request, RequestHandler } from "express";
import multer from "multer";

const DESTINATION = "public/uploads/";

// Les pièces jointes d'un signalement contiennent souvent des captures de
// conversations privées : elles sont stockées hors de public/, donc hors de
// portée d'express.static, et servies par une route réservée aux admins.
const REPORTS_DESTINATION = "private/reports/";

// 8 Mo : une photo prise au téléphone passe, un envoi abusif est coupé.
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_FILES = 5;

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

// Les pièces jointes d'un signalement acceptent aussi le PDF, comme le
// champ correspondant côté client (ReportEvidence).
const EVIDENCE_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"];

const unsupportedFormat = (allowed: string[]) => {
  const error = new Error(
    `Format de fichier non supporté. Formats acceptés : ${allowed.join(", ")}`,
  ) as Error & { statusCode?: number };

  error.statusCode = 400;

  return error;
};

const limits = {
  fileSize: MAX_FILE_SIZE,
  files: MAX_FILES,
};

const upload = multer({
  dest: DESTINATION,
  limits,
  fileFilter: (_req, file, callback) => {
    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
      callback(unsupportedFormat(IMAGE_MIME_TYPES));
      return;
    }

    callback(null, true);
  },
});

export const uploadEvidence = multer({
  dest: REPORTS_DESTINATION,
  limits,
  fileFilter: (_req, file, callback) => {
    if (!EVIDENCE_MIME_TYPES.includes(file.mimetype)) {
      callback(unsupportedFormat(EVIDENCE_MIME_TYPES));
      return;
    }

    callback(null, true);
  },
});

// Le fileFilter ne peut se fier qu'au Content-Type annoncé par le client,
// lui-même déduit de l'extension : un .txt renommé .jpg le franchit. On
// vérifie donc les premiers octets du fichier écrit sur disque.
// Chaque entrée liste des motifs qui doivent TOUS correspondre.
const SIGNATURES: Record<string, { offset: number; bytes: number[] }[]> = {
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [
    { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  "image/gif": [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  // RIFF....WEBP : la taille occupe les octets 4 à 7.
  "image/webp": [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  // Conteneur ISO-BMFF : boîte "ftyp" juste après la taille.
  "image/avif": [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
  "application/pdf": [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
};

const HEADER_LENGTH = 12;

const readHeader = async (filePath: string) => {
  const handle = await fs.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(HEADER_LENGTH);
    const { bytesRead } = await handle.read(buffer, 0, HEADER_LENGTH, 0);

    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const matchesSignature = (header: Buffer, mimetype: string) => {
  const patterns = SIGNATURES[mimetype];

  if (!patterns) return false;

  return patterns.every(({ offset, bytes }) =>
    bytes.every((byte, index) => header[offset + index] === byte),
  );
};

const collectFiles = (req: Request): Express.Multer.File[] => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files) return Object.values(req.files).flat();

  return [];
};

const verifyFileSignatures: RequestHandler = async (req, res, next) => {
  const files = collectFiles(req);

  if (files.length === 0) {
    next();
    return;
  }

  try {
    const headers = await Promise.all(
      files.map((file) => readHeader(file.path)),
    );

    const invalid = files.find(
      (file, index) => !matchesSignature(headers[index], file.mimetype),
    );

    if (invalid) {
      // Aucun fichier de la requête n'est conservé : le signalement est
      // rejeté en bloc, autant ne pas laisser de pièces orphelines.
      await Promise.all(
        files.map((file) => fs.unlink(file.path).catch(() => {})),
      );

      res.status(400).json({
        error: `Le contenu de ${invalid.originalname} ne correspond pas à son format déclaré.`,
        status: 400,
      });

      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Les fichiers sont stockés sans extension : pour les servir avec un vrai
// Content-Type, on relit leur signature plutôt que de deviner.
const detectMimeType = async (filePath: string) => {
  const header = await readHeader(filePath);

  return (
    Object.keys(SIGNATURES).find((mimetype) =>
      matchesSignature(header, mimetype),
    ) ?? null
  );
};

export {
  detectMimeType,
  MAX_FILE_SIZE,
  MAX_FILES,
  REPORTS_DESTINATION,
  verifyFileSignatures,
};

export default upload;
