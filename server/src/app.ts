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
app.use("/uploads", express.static("public/uploads"));
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
