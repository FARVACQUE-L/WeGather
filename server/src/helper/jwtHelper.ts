import { createHmac } from "node:crypto";
import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";

export interface JwtUser {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
  pwd?: string;
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

const encodeJWT = (payload: JwtUser): string =>
  jwt.sign(payload, process.env.TOKEN_SECRET as string, { expiresIn: "30d" });

const decodeJWT = (token: string): JwtUser => {
  return jwt.verify(token, process.env.TOKEN_SECRET as string) as JwtUser;
};

const passwordFingerprint = (passwordHash: string) =>
  createHmac("sha256", process.env.TOKEN_SECRET as string)
    .update(passwordHash)
    .digest("base64url")
    .slice(0, 16);

const sessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  secure: Boolean(process.env.CLIENT_URL?.startsWith("https://")),
});

const sessionCookie = (token: string) =>
  [
    "auth_token",
    `Bearer ${token}`,
    { ...sessionCookieOptions(), maxAge: SESSION_DURATION_MS },
  ] as const;

export {
  decodeJWT,
  encodeJWT,
  passwordFingerprint,
  sessionCookie,
  sessionCookieOptions,
};
