import type { Request, RequestHandler } from "express";

export const clientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  const last = (Array.isArray(forwarded) ? forwarded.join(",") : forwarded)
    ?.split(",")
    .pop()
    ?.trim();
  return last || req.ip || "unknown";
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
  key?: (req: Request) => string;
};

const MAX_TRACKED_KEYS = 10_000;

export const rateLimit = ({
  windowMs,
  max,
  message,
  key = clientIp,
}: RateLimitOptions): RequestHandler => {
  const hits = new Map<string, number[]>();

  const prune = (now: number) => {
    for (const [id, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) hits.delete(id);
    }
  };

  return (req, res, next) => {
    const now = Date.now();
    const id = key(req);

    if (!id) {
      next();
      return;
    }

    if (hits.size >= MAX_TRACKED_KEYS) prune(now);

    const recent = (hits.get(id) ?? []).filter((time) => now - time < windowMs);

    if (recent.length >= max) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil((recent[0] + windowMs - now) / 1000)),
      );
      res.status(429).json({ message });
      return;
    }

    recent.push(now);
    hits.set(id, recent);
    next();
  };
};

const MINUTE = 60 * 1000;

const bodyEmail = (req: Request) =>
  typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";

const userId = (req: Request) =>
  req.user ? String(req.user.id) : clientIp(req);

const TOO_MANY = "Trop de tentatives. Réessayez dans quelques minutes.";

export const loginLimits = [
  rateLimit({ windowMs: 15 * MINUTE, max: 10, message: TOO_MANY }),
  rateLimit({
    windowMs: 15 * MINUTE,
    max: 10,
    message: TOO_MANY,
    key: bodyEmail,
  }),
];

export const registerLimit = rateLimit({
  windowMs: 60 * MINUTE,
  max: 5,
  message: "Trop d'inscriptions depuis cette connexion. Réessayez plus tard.",
});

export const forgotPasswordLimits = [
  rateLimit({ windowMs: 60 * MINUTE, max: 5, message: TOO_MANY }),
  rateLimit({
    windowMs: 60 * MINUTE,
    max: 3,
    message: TOO_MANY,
    key: bodyEmail,
  }),
];

export const resetPasswordLimit = rateLimit({
  windowMs: 15 * MINUTE,
  max: 10,
  message: TOO_MANY,
});

export const changePasswordLimit = rateLimit({
  windowMs: 15 * MINUTE,
  max: 10,
  message: TOO_MANY,
  key: userId,
});

export const messageLimit = rateLimit({
  windowMs: MINUTE,
  max: 30,
  message: "Vous envoyez trop de messages. Patientez un instant.",
  key: userId,
});

export const reportLimit = rateLimit({
  windowMs: 60 * MINUTE,
  max: 10,
  message: "Trop de signalements envoyés. Réessayez plus tard.",
  key: userId,
});

export const joinEventLimit = rateLimit({
  windowMs: 15 * MINUTE,
  max: 20,
  message: "Trop de codes essayés. Réessayez dans quelques minutes.",
  key: userId,
});
