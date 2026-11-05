import crypto from "node:crypto";
import fs from "node:fs";
import argon2 from "argon2";
import type { RequestHandler } from "express";
import nodemailer from "nodemailer";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  PASSWORD_RULES_MESSAGE,
} from "../../helper/credentials";
import { readMemberEventId } from "../../helper/eventMembership";
import {
  encodeJWT,
  passwordFingerprint,
  sessionCookie,
  sessionCookieOptions,
} from "../../helper/jwtHelper";
import { removeUpload } from "../../helper/removeUpload";
import { disconnectUser } from "../../socket";
import userRepository from "./userRepository";

const authVerif: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.sendStatus(401);
      return;
    }

    const user = await userRepository.readUserAdmin(req.user.id);

    const { pwd: _pwd, ...publicUser } = req.user;

    res.status(200).json({
      ...publicUser,
      isAdmin: Boolean(user?.user_is_admin),
      isSuperAdmin: Boolean(user?.user_is_superadmin),
      plan: user?.user_plan ?? "free",
    });
  } catch (error) {
    next(error);
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const readUserName: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;

    const userName = await userRepository.readUserName(userId);

    if (!userName) {
      res.sendStatus(404);
      return;
    }

    res.json(userName);
  } catch (err) {
    next(err);
  }
};

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] as string,
  );

const createSession = (
  res: Parameters<RequestHandler>[1],
  user: {
    user_id: number;
    user_username: string;
    user_mail: string;
    user_password: string;
    user_is_admin: number;
  },
) => {
  const token = encodeJWT({
    id: user.user_id,
    username: user.user_username,
    email: user.user_mail,
    isAdmin: Boolean(user.user_is_admin),
    pwd: passwordFingerprint(user.user_password),
  });

  res.cookie(...sessionCookie(token));
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const username =
      typeof req.body.username === "string" ? req.body.username.trim() : "";
    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";

    if (!isValidUsername(username)) {
      res
        .status(400)
        .json({ message: "Le pseudo doit contenir entre 3 et 45 caractères." });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Adresse e-mail invalide." });
      return;
    }

    if (!isValidPassword(req.body.password)) {
      res.status(400).json({ message: PASSWORD_RULES_MESSAGE });
      return;
    }

    const newUser = {
      username,
      email,
      password: await argon2.hash(req.body.password),
    };

    const existingUsername = await userRepository.findByEmailOrUsername(
      newUser.username,
    );

    if (existingUsername) {
      res.status(409).json({ message: "Ce pseudo existe déjà" });
      return;
    }

    const existingEmail = await userRepository.findByEmailOrUsername(
      newUser.email,
    );

    if (existingEmail) {
      res.status(409).json({ message: "Cet email existe déjà" });
      return;
    }

    const insertId = await userRepository.create(newUser);

    res.status(201).json({
      message: "Inscription réussie 🎉",
      insertId,
    });

    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: newUser.email,
        subject: "Bienvenue sur WeGather",
        html: `
    <h1>Bienvenue sur WeGather 🎉</h1>
    <p>Votre compte a été créé avec succès.</p>
    <p>Pseudo : ${escapeHtml(newUser.username)}</p>
  `,
      })
      .catch((err) => console.error("Échec de l'envoi du mail :", err));
    return;
  } catch (err) {
    next(err);
  }
};

const RESET_TOKEN_DURATION_MS = 1000 * 60 * 30;

const hashResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

let dummyHash: Promise<string> | null = null;

const verifyAgainstDummy = async (password: string) => {
  dummyHash ??= argon2.hash("mot-de-passe-factice-WeGather-1!");
  await argon2.verify(await dummyHash, password);
};

const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(401).json({ message: "Email ou mot de passe incorrect" });
      return;
    }

    const user = await userRepository.findByEmail(email.trim());

    if (!user) {
      await verifyAgainstDummy(password);
      res.status(401).json({ message: "Email ou mot de passe incorrect" });
      return;
    }

    if (!(await argon2.verify(user.user_password, password))) {
      res.status(401).json({ message: "Email ou mot de passe incorrect" });
      return;
    }

    if (user.user_is_ban) {
      res.status(403).json({
        message: "Votre compte a été banni.",
      });
      return;
    }

    createSession(res, user);

    res.status(200).json({
      message: "Connexion réussie",
      user: {
        id: user.user_id,
        username: user.user_username,
        email: user.user_mail,
        isAdmin: Boolean(user.user_is_admin),
      },
    });
  } catch (err) {
    next(err);
  }
};
const logout: RequestHandler = (_req, res) => {
  res.clearCookie("auth_token", sessionCookieOptions());

  res.status(200).json({
    message: "Déconnexion réussie",
  });
};
const readUserDescriptionEvent: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const event = await userRepository.readUserDescriptionEvent(eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};

const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      res.status(400).json({ message: "Email manquant" });
      return;
    }

    const user = await userRepository.findByEmail(email.trim());
    const token = crypto.randomBytes(32).toString("hex");

    if (user) {
      const expires = Date.now() + RESET_TOKEN_DURATION_MS;
      await userRepository.saveResetToken(
        user.user_id,
        hashResetToken(token),
        expires,
      );
    }

    res.json({
      message:
        "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé.",
    });

    if (!user) return;

    const link = `${process.env.CLIENT_URL}/resetpassword?token=${token}`;

    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: user.user_mail,
        subject: "Réinitialisation du mot de passe",
        html: `
    <h1>WeGather</h1>
    <h2>Réinitialisation du mot de passe</h2>
    <p>Cliquez sur le lien suivant :</p>
    <a href="${link}">${link}</a>
  `,
      })
      .catch((err) => console.error("Échec de l'envoi du mail :", err));
  } catch (err) {
    next(err);
  }
};

const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (typeof token !== "string" || !token) {
      res.status(401).json({ message: "Token invalide" });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({ message: PASSWORD_RULES_MESSAGE });
      return;
    }

    const user = await userRepository.findByResetToken(hashResetToken(token));

    if (!user) {
      res.status(401).json({ message: "Token invalide" });
      return;
    }

    if (!user.user_reset_expires || Date.now() > user.user_reset_expires) {
      res.status(401).json({ message: "Token expiré" });
      return;
    }

    const isSamePassword = await argon2.verify(user.user_password, password);

    if (isSamePassword) {
      res.status(400).json({
        message: "Vous ne pouvez pas utiliser l'ancien mot de passe",
      });
      return;
    }
    const hashedPassword = await argon2.hash(password);
    await userRepository.resetPassword(user.user_id, hashedPassword);
    disconnectUser(user.user_id);

    res.json({
      message: "Mot de passe modifié avec succès",
    });

    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: user.user_mail,
        subject: "Mot de passe modifié",
        html: `
    <h1>WeGather</h1>
    <p>Votre mot de passe a été modifié avec succès.</p>
  `,
      })
      .catch((_err) => {});
    return;
  } catch (err) {
    next(err);
  }
};
const changePassword: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== "string") {
      res.status(400).json({ message: "Ancien mot de passe incorrect" });
      return;
    }

    if (!isValidPassword(newPassword)) {
      res.status(400).json({ message: PASSWORD_RULES_MESSAGE });
      return;
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      res.status(404).json({
        message: "Utilisateur introuvable",
      });
      return;
    }

    const isValid = await argon2.verify(user.user_password, currentPassword);

    if (!isValid) {
      res.status(400).json({
        message: "Ancien mot de passe incorrect",
      });
      return;
    }

    const samePassword = await argon2.verify(user.user_password, newPassword);

    if (samePassword) {
      res.status(400).json({
        message: "Le nouveau mot de passe doit être différent",
      });
      return;
    }

    const hashedPassword = await argon2.hash(newPassword);

    await userRepository.resetPassword(userId, hashedPassword);
    disconnectUser(userId);

    createSession(res, { ...user, user_password: hashedPassword });

    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: user.user_mail,
        subject: "Mot de passe modifié",
        html: `
        <h1>WeGather</h1>
        <p>Votre mot de passe a été modifié avec succès.</p>
        <p>Si ce n’était pas vous, contactez le support client.</p>
      `,
      })
      .catch((_err) => {});

    res.status(200).json({
      message: "Mot de passe modifié avec succès",
    });
  } catch (err) {
    next(err);
  }
};

const uploadPhoto: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Aucune image envoyée" });
      return;
    }

    if (!req.user || Number(req.params.id) !== req.user.id) {
      fs.rmSync(req.file.path, { force: true });
      res
        .status(403)
        .json({ message: "Vous ne pouvez modifier que votre photo." });
      return;
    }

    const userId = req.user.id;
    const photoUrl = `/uploads/${req.file.filename}`;
    const previous = await userRepository.readUserPhoto(userId);

    await userRepository.updatePhoto(userId, photoUrl);
    await removeUpload(previous?.user_profile_picture);

    res.status(200).json({
      message: "Photo mise à jour",
      photoUrl,
    });
  } catch (error) {
    next(error);
  }
};
const browsePhoto: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const photo = await userRepository.readUserPhoto(req.user.id);

    res.json(photo);
  } catch (error) {
    next(error);
  }
};
const editUserName: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const userName =
      typeof req.body.user_name === "string" ? req.body.user_name.trim() : "";

    if (!userName) {
      res.status(400).json({ message: "Rentrer un pseudo" });
      return;
    }

    if (!isValidUsername(userName)) {
      res
        .status(400)
        .json({ message: "Le pseudo doit contenir entre 3 et 45 caractères." });
      return;
    }

    const existingUser = await userRepository.findByEmailOrUsername(userName);

    if (existingUser && existingUser.user_id !== userId) {
      res.status(409).json({ message: "Ce pseudo est déjà utilisé" });
      return;
    }

    await userRepository.updateUserName(userId, userName);

    res.status(200).json({
      message: "Nom modifié",
    });
  } catch (err) {
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      res.status(409).json({ message: "Ce pseudo est déjà utilisé" });
      return;
    }
    next(err);
  }
};
export default {
  authVerif,
  readUserDescriptionEvent,
  browsePhoto,
  add,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  uploadPhoto,
  editUserName,
  readUserName,
};
