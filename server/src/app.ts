import cookieParser from "cookie-parser";
import express from "express";

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: `${process.env.CLIENT_URL}`,
    credentials: true,
  }),
);

import cors from "cors";

if (process.env.CLIENT_URL != null) {
  app.use(cors({ origin: [process.env.CLIENT_URL] }));
}

app.use(express.json());
app.use(express.urlencoded());
app.use(express.text());
app.use(express.raw());
// Les fichiers envoyés sont stockés sans extension, donc servis sans
// Content-Type : sans nosniff, un navigateur devine le type et pourrait
// exécuter un HTML déguisé en image sur l'origine de l'API.
app.use(
  "/uploads",
  express.static("public/uploads", {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);
app.use(express.static(path.join(process.cwd(), "public")));

import router from "./router";

app.use(router);

import fs from "node:fs";
import path from "node:path";

const publicFolderPath = path.join(__dirname, "../../server/public");

if (fs.existsSync(publicFolderPath)) {
  app.use(express.static(publicFolderPath));
}

const clientBuildPath = path.join(__dirname, "../../client/dist");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get("*", (_, res) => {
    res.sendFile("index.html", { root: clientBuildPath });
  });
}

import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { MAX_FILE_SIZE, MAX_FILES } from "./middleware/upload";

const uploadErrorMessages: Record<string, string> = {
  LIMIT_FILE_SIZE: `Fichier trop volumineux (${MAX_FILE_SIZE / 1024 / 1024} Mo maximum)`,
  LIMIT_FILE_COUNT: `Trop de fichiers (${MAX_FILES} maximum)`,
  LIMIT_UNEXPECTED_FILE: "Champ de fichier inattendu",
};

// Les erreurs de multer ne portent pas de statusCode : sans ce filtre, un
// fichier trop lourd remonterait en 500 au lieu de 400.
const handleUploadErrors: ErrorRequestHandler = (err, _req, res, next) => {
  if (!(err instanceof multer.MulterError)) {
    next(err);
    return;
  }

  res.status(400).json({
    error: uploadErrorMessages[err.code] ?? "Envoi de fichier refusé",
    status: 400,
  });
};

app.use(handleUploadErrors);

const logErrors: ErrorRequestHandler = (err, req, res, _next) => {
  console.error("Error occurred:", err.message);
  console.error("Stack:", err.stack);
  console.error("Request:", req.method, req.path);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
    status: statusCode,
  });
};

app.use(logErrors);

export default app;
