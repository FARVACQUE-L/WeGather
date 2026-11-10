import crypto from "node:crypto";
import fs from "node:fs";
import argon2 from "argon2";
import type { RequestHandler } from "express";
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
import { purgeUnverifiedUsers } from "../../helper/purgeUnverifiedUsers";
import { removeUpload } from "../../helper/removeUpload";
import { disconnectUser } from "../../socket";
import transporter, {
  CONTACT_URL,
  escapeHtml,
  MAIL_FROM,
  renderMail,
} from "../services/mailer";
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

    // Libère tout de suite le pseudo et l'adresse d'une inscription expirée,
    // sans attendre la purge horaire.
    await purgeUnverifiedUsers();

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

    const token = crypto.randomBytes(32).toString("hex");

    await userRepository.create(
      newUser,
      hashToken(token),
      Date.now() + VERIFY_TOKEN_DURATION_MS,
    );

    res.status(201).json({
      message:
        "Inscription réussie 🎉 Un e-mail de confirmation vient de vous être envoyé.",
    });

    sendVerificationMail(newUser.email, newUser.username, token);
  } catch (err) {
    next(err);
  }
};

const RESET_TOKEN_DURATION_MS = 1000 * 60 * 30;
const VERIFY_TOKEN_DURATION_MS = 1000 * 60 * 60 * 24;

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const passwordChangedMail = () =>
  renderMail({
    title: "Mot de passe modifié",
    paragraphs: [
      "Le mot de passe de votre compte WeGather vient d'être modifié.",
    ],
    note: `Si vous n'êtes pas à l'origine de ce changement, réinitialisez votre mot de passe avec « Mot de passe oublié » et prévenez-nous via <a href="${CONTACT_URL}" style="color:#b44708;">notre formulaire de contact</a>.`,
  });

const sendVerificationMail = (
  email: string,
  username: string,
  token: string,
) => {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  transporter
    .sendMail({
      from: MAIL_FROM,
      to: email,
      subject: "Confirmez votre adresse e-mail",
      html: renderMail({
        title: `Bienvenue, ${escapeHtml(username)} 🎉`,
        paragraphs: [
          "Merci de votre inscription sur WeGather. Pour activer votre compte, confirmez votre adresse e-mail :",
        ],
        button: { label: "Confirmer mon adresse", url: link },
        note: "Ce lien est valable 24 heures à compter de votre inscription. Sans confirmation dans ce délai, l'inscription est annulée et le compte supprimé. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.",
      }),
    })
    .catch((err) => console.error("Échec de l'envoi du mail :", err));
};

const verifyEmail: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (typeof token !== "string" || !token) {
      res.status(400).json({ message: "Lien de confirmation invalide." });
      return;
    }

    const user = await userRepository.findByVerifyToken(hashToken(token));

    if (!user) {
      res.status(400).json({
        message:
          "Ce lien de confirmation est invalide ou a déjà été utilisé. Si votre inscription date de plus de 24 heures, elle a été annulée : inscrivez-vous à nouveau.",
      });
      return;
    }

    if (!user.user_verify_expires || Date.now() > user.user_verify_expires) {
      res.status(400).json({
        message:
          "Ce lien de confirmation a expiré et votre inscription a été annulée. Inscrivez-vous à nouveau.",
      });
      return;
    }

    if (user.user_is_ban) {
      res.status(403).json({ message: "Votre compte a été banni." });
      return;
    }

    await userRepository.markVerified(user.user_id);

    createSession(res, user);

    res.status(200).json({ message: "Adresse e-mail confirmée 🎉" });
  } catch (err) {
    next(err);
  }
};

const resendVerification: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      res.status(400).json({ message: "Email manquant" });
      return;
    }

    const user = await userRepository.findByEmail(email.trim());

    res.json({
      message:
        "Si un compte non confirmé existe avec cette adresse, un nouveau lien vient d'être envoyé.",
    });

    if (
      !user ||
      user.user_is_verified ||
      !user.user_verify_expires ||
      Date.now() > user.user_verify_expires
    ) {
      return;
    }

    // Le nouveau lien garde l'échéance de l'inscription : le compte est
    // supprimé 24 h après l'inscription, même après un renvoi.
    const token = crypto.randomBytes(32).toString("hex");
    await userRepository.saveVerifyToken(
      user.user_id,
      hashToken(token),
      user.user_verify_expires,
    );

    sendVerificationMail(user.user_mail, user.user_username, token);
  } catch (err) {
    next(err);
  }
};

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

    if (
      !user.user_is_verified &&
      (!user.user_verify_expires || Date.now() > user.user_verify_expires)
    ) {
      res.status(403).json({
        message:
          "Votre inscription a expiré faute de confirmation de l'adresse e-mail. Inscrivez-vous à nouveau.",
      });
      return;
    }

    if (!user.user_is_verified) {
      res.status(403).json({
        message:
          "Confirmez votre adresse e-mail avant de vous connecter. Pensez à vérifier vos spams.",
        unverified: true,
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
        hashToken(token),
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
        from: MAIL_FROM,
        to: user.user_mail,
        subject: "Réinitialisation du mot de passe",
        html: renderMail({
          title: "Réinitialisation du mot de passe",
          paragraphs: [
            "Vous avez demandé à réinitialiser le mot de passe de votre compte WeGather. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :",
          ],
          button: { label: "Choisir un nouveau mot de passe", url: link },
          note: "Ce lien est valable 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.",
        }),
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

    const user = await userRepository.findByResetToken(hashToken(token));

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
        from: MAIL_FROM,
        to: user.user_mail,
        subject: "Mot de passe modifié",
        html: passwordChangedMail(),
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
        from: MAIL_FROM,
        to: user.user_mail,
        subject: "Mot de passe modifié",
        html: passwordChangedMail(),
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
  verifyEmail,
  resendVerification,
  changePassword,
  uploadPhoto,
  editUserName,
  readUserName,
};
