import crypto from "node:crypto";
import argon2 from "argon2";
import type { RequestHandler } from "express";
import nodemailer from "nodemailer";
import { encodeJWT } from "../../helper/jwtHelper";
import eventRepository from "../event/eventRepository";
import userRepository from "./userRepository";

const authVerif: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.sendStatus(401);
      return;
    }

    // Le rôle est relu en base : le JWT vit 30 jours, il porterait un isAdmin
    // périmé si les droits de l'utilisateur ont changé depuis sa connexion.
    const user = await userRepository.readUserAdmin(req.user.id);

    res.status(200).json({
      ...req.user,
      isAdmin: Boolean(user?.user_is_admin),
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

const browseInscription: RequestHandler = async (_req, res, next) => {
  try {
    const users = await userRepository.readAll();

    res.json(users);
  } catch (err) {
    next(err);
  }
};

const read: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    const user = await userRepository.read(userId);

    if (!user) {
      res.sendStatus(404);
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

const readUserName: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

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

const add: RequestHandler = async (req, res, next) => {
  try {
    const hashedPassword = await argon2.hash(req.body.password);
    const newUser = {
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
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

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: newUser.email,
      subject: "Bienvenue sur WeGather",
      html: `
    <h1>Bienvenue sur WeGather 🎉</h1>
    <p>Votre compte a été créé avec succès.</p>
    <p>Pseudo : ${newUser.username}</p>
  `,
    });
    return;
  } catch (err) {
    next(err);
  }
};

const login: RequestHandler = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const user = await userRepository.findByEmailOrUsername(identifier);

    if (!user) {
      res.status(401).json({
        message: "Utilisateur introuvable",
      });
      return;
    }

    const isPasswordValid = await argon2.verify(user.user_password, password);
    if (user.user_is_ban) {
      res.status(403).json({
        message: "Votre compte a été banni.",
      });
      return;
    }
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Mot de passe incorrect",
      });
      return;
    }

    const token = encodeJWT({
      id: user.user_id,
      username: user.user_username,
      email: user.user_mail,
      isAdmin: Boolean(user.user_is_admin),
    });

    res.cookie("auth_token", `Bearer ${token}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

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
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.status(200).json({
    message: "Déconnexion réussie",
  });
};
const readUserDescriptionEvent: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const event = await userRepository.readUserDescriptionEvent(eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};

const browseUserAndBudget: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const event = await userRepository.readUserAndBudgetOnDashboard(eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};

const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({ message: "Identifier manquant" });
      return;
    }

    const user = await userRepository.findByEmailOrUsername(identifier);

    if (!user) {
      res.status(401).json({
        message: "Pseudo ou email incorrect",
      });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 1000 * 60 * 3;

    await userRepository.saveResetToken(user.user_id, token, expires);

    const link = `${process.env.CLIENT_URL}/resetpassword?token=${token}`;

    res.json({ message: "Lien envoyé" });

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.user_mail,
      subject: "Réinitialisation du mot de passe",
      html: `
    <h1>WeGather</h1>
    <h2>Réinitialisation du mot de passe</h2>
    <p>Cliquez sur le lien suivant :</p>
    <a href="${link}">${link}</a>
  `,
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await userRepository.findByResetToken(token);

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

    const user = await userRepository.read(userId);

    if (!user) {
      res.status(404).json({
        message: "Utilisateur introuvable",
      });
      return;
    }

    const isValid = await argon2.verify(user.password, currentPassword);

    if (!isValid) {
      res.status(400).json({
        message: "Ancien mot de passe incorrect",
      });
      return;
    }

    const samePassword = await argon2.verify(user.password, newPassword);

    if (samePassword) {
      res.status(400).json({
        message: "Le nouveau mot de passe doit être différent",
      });
      return;
    }

    const hashedPassword = await argon2.hash(newPassword);

    await userRepository.resetPassword(userId, hashedPassword);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Mot de passe modifié",
      html: `
        <h1>WeGather</h1>
        <p>Votre mot de passe a été modifié avec succès.</p>
        <p>Si ce n’était pas vous, contactez le support client.</p>
      `,
    });

    res.status(200).json({
      message: "Mot de passe modifié avec succès",
    });
  } catch (err) {
    next(err);
  }
};

const uploadPhoto: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!req.file) {
      res.status(400).json({ message: "Aucune image envoyée" });
      return;
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await userRepository.updatePhoto(userId, photoUrl);

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
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
      res.status(400).json({
        message: "ID invalide",
      });
      return;
    }

    const photo = await userRepository.readUserPhoto(userId);

    res.json(photo);
  } catch (error) {
    next(error);
  }
};
const editUserName: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { user_name } = req.body;

    await userRepository.updateUserName(userId, user_name);

    res.status(200).json({
      message: "Nom modifié",
    });
  } catch (err) {
    next(err);
  }
};
const readUserJoinEvent: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const userName = await userRepository.readUserJoinEvent(eventId);

    if (!userName) {
      res.sendStatus(404);
      return;
    }

    res.json(userName);
  } catch (err) {
    next(err);
  }
};
export default {
  authVerif,
  readUserDescriptionEvent,
  browseInscription,
  browsePhoto,
  read,
  add,
  login,
  logout,
  browseUserAndBudget,
  forgotPassword,
  resetPassword,
  changePassword,
  uploadPhoto,
  editUserName,
  readUserName,
  readUserJoinEvent,
};
