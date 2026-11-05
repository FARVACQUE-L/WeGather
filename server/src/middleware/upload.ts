import fs from "node:fs/promises";
import type { Request, RequestHandler } from "express";
import multer from "multer";

const DESTINATION = "public/uploads/";

const REPORTS_DESTINATION = "private/reports/";

const RESERVATION_DOCUMENTS_DESTINATION = "private/reservations/";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_FILES = 5;

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

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

export const uploadReservationDocument = multer({
  dest: RESERVATION_DOCUMENTS_DESTINATION,
  limits,
  fileFilter: (_req, file, callback) => {
    if (!EVIDENCE_MIME_TYPES.includes(file.mimetype)) {
      callback(unsupportedFormat(EVIDENCE_MIME_TYPES));
      return;
    }

    callback(null, true);
  },
});

const SIGNATURES: Record<string, { offset: number; bytes: number[] }[]> = {
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [
    { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  "image/gif": [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  "image/webp": [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
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

const detectMimeType = async (filePath: string) => {
  const header = await readHeader(filePath);

  return (
    Object.keys(SIGNATURES).find((mimetype) =>
      matchesSignature(header, mimetype),
    ) ?? null
  );
};

export {
  DESTINATION as UPLOADS_DIRECTORY,
  detectMimeType,
  MAX_FILE_SIZE,
  MAX_FILES,
  REPORTS_DESTINATION,
  RESERVATION_DOCUMENTS_DESTINATION,
  verifyFileSignatures,
};

export default upload;
