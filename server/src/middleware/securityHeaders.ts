import type { RequestHandler } from "express";

const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  if (process.env.CLIENT_URL?.startsWith("https://")) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains",
    );
  }

  next();
};

export default securityHeaders;
