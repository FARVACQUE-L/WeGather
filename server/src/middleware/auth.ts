import type { NextFunction, Request, Response } from "express";
import {
  decodeJWT,
  type JwtUser,
  passwordFingerprint,
  sessionCookieOptions,
} from "../helper/jwtHelper";
import userRepository from "../modules/user/userRepository";

type Session =
  | { status: "valid"; user: JwtUser }
  | { status: "banned" | "invalid" };

export const readSession = async (
  cookieValue: string | undefined,
): Promise<Session> => {
  if (!cookieValue) return { status: "invalid" };

  const [, token] = cookieValue.split(" ");

  let user: JwtUser;
  try {
    user = decodeJWT(token);
  } catch {
    return { status: "invalid" };
  }

  const dbUser = await userRepository.findById(user.id);

  if (!dbUser || user.pwd !== passwordFingerprint(dbUser.user_password)) {
    return { status: "invalid" };
  }

  if (dbUser.user_is_ban) return { status: "banned" };

  return { status: "valid", user };
};

const authorization = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const session = await readSession(
      req.cookies.auth_token as string | undefined,
    );

    if (session.status === "banned") {
      res.clearCookie("auth_token", sessionCookieOptions());
      res.status(403).json({ message: "Votre compte est suspendu" });
      return;
    }

    if (session.status !== "valid") {
      if (req.cookies.auth_token) {
        res.clearCookie("auth_token", sessionCookieOptions());
      }
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    req.user = session.user;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default authorization;
