import type { RequestHandler } from "express";

export const CONTACT_SUBJECTS = [
  "Question",
  "Problème technique",
  "Suggestion",
  "Partenariat",
  "Autre",
] as const;

const LIMITS = { name: 100, email: 100, message: 2000 };
const MIN_MESSAGE_LENGTH = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 3;
const MAX_GLOBAL = 30;
const sentByIp = new Map<string, number[]>();
let sentGlobal: number[] = [];

const recent = (timestamps: number[], now: number) =>
  timestamps.filter((time) => now - time < WINDOW_MS);

const clientIp: (req: Parameters<RequestHandler>[0]) => string = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const last = (Array.isArray(forwarded) ? forwarded.join(",") : forwarded)
    ?.split(",")
    .pop()
    ?.trim();
  return last || req.ip || "unknown";
};

const pruneIps = (now: number) => {
  for (const [ip, timestamps] of sentByIp) {
    if (recent(timestamps, now).length === 0) sentByIp.delete(ip);
  }
};

const asText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const send: RequestHandler = async (req, res, next) => {
  try {
    if (asText(req.body.website) !== "") {
      res.status(201).json({ message: "Message envoyé" });
      return;
    }

    const name = asText(req.body.name);
    const email = asText(req.body.email);
    const subject = asText(req.body.subject);
    const message = asText(req.body.message);

    if (
      name === "" ||
      name.length > LIMITS.name ||
      email.length > LIMITS.email ||
      !EMAIL_PATTERN.test(email) ||
      !CONTACT_SUBJECTS.includes(
        subject as (typeof CONTACT_SUBJECTS)[number],
      ) ||
      message.length < MIN_MESSAGE_LENGTH ||
      message.length > LIMITS.message
    ) {
      res.status(400).json({ message: "Formulaire incomplet ou invalide" });
      return;
    }

    const webhookUrl = process.env.DISCORD_CONTACT_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("DISCORD_CONTACT_WEBHOOK_URL manquant");
      res.status(503).json({
        message:
          "Le formulaire de contact est indisponible pour le moment. Écrivez-nous par e-mail.",
      });
      return;
    }

    const now = Date.now();
    pruneIps(now);
    const ip = clientIp(req);
    const ipHistory = recent(sentByIp.get(ip) ?? [], now);
    sentGlobal = recent(sentGlobal, now);

    if (ipHistory.length >= MAX_PER_IP || sentGlobal.length >= MAX_GLOBAL) {
      res.status(429).json({
        message:
          "Trop de messages envoyés. Merci de réessayer dans quelques minutes.",
      });
      return;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        username: "WeGather · Contact",
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: `📬 ${subject}`,
            description: message,
            color: 0xa53b22,
            fields: [
              { name: "Nom", value: name, inline: true },
              { name: "E-mail", value: email, inline: true },
            ],
            timestamp: new Date(now).toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        "Échec de l'envoi au webhook Discord :",
        response.status,
        await response.text(),
      );
      res.status(502).json({
        message:
          "Votre message n'a pas pu être envoyé. Réessayez plus tard ou écrivez-nous par e-mail.",
      });
      return;
    }

    sentByIp.set(ip, [...ipHistory, now]);
    sentGlobal.push(now);

    res.status(201).json({ message: "Message envoyé" });
  } catch (err) {
    next(err);
  }
};

export default { send };
