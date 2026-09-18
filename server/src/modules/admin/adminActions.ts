import type { RequestHandler } from "express";
import transporter from "../services/mailer";
import adminRepository from "./adminRepository";

const readAllUsers: RequestHandler = async (_req, res, next) => {
  try {
    const allUsers = await adminRepository.readAllUser();
    res.json(allUsers);
  } catch (err) {
    next(err);
  }
};

const readAllEvents: RequestHandler = async (_req, res, next) => {
  try {
    const allEvents = await adminRepository.readAllEvent();
    res.json(allEvents);
  } catch (err) {
    next(err);
  }
};

const readArrayReport: RequestHandler = async (_req, res, next) => {
  try {
    const arrayReport = await adminRepository.readArrayReport();
    res.json(arrayReport);
  } catch (err) {
    next(err);
  }
};

const readArrayUsers: RequestHandler = async (_req, res, next) => {
  try {
    const arrayUsers = await adminRepository.readArrayUser();
    res.json(arrayUsers);
  } catch (err) {
    next(err);
  }
};

const readDashboardChart: RequestHandler = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const chartData = await adminRepository.readDashboardChart(year);
    res.json(chartData);
  } catch (error) {
    next(error);
  }
};

const readAvailableYears: RequestHandler = async (_req, res, next) => {
  try {
    const years = await adminRepository.readAvailableYears();
    res.json(years);
  } catch (error) {
    next(error);
  }
};

const readReportEvent: RequestHandler = async (_req, res, next) => {
  try {
    const reportEvent = await adminRepository.readReportEvent();
    res.json(reportEvent);
  } catch (error) {
    next(error);
  }
};

const readReportBug: RequestHandler = async (_req, res, next) => {
  try {
    const reportBug = await adminRepository.readReportBug();
    res.json(reportBug);
  } catch (error) {
    next(error);
  }
};

const readReportUser: RequestHandler = async (_req, res, next) => {
  try {
    const reportUser = await adminRepository.readReportUser();
    res.json(reportUser);
  } catch (error) {
    next(error);
  }
};

const readReportBugById: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const report = await adminRepository.readReportBugById(id);
    if (!report) {
      res.status(404).json({ message: "Signalement introuvable" });
      return;
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
};

const readReportEventById: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const report = await adminRepository.readReportEventById(id);
    if (!report) {
      res.status(404).json({ message: "Signalement introuvable" });
      return;
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
};

const readReportUserById: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const report = await adminRepository.readReportUserById(id);
    if (!report) {
      res.status(404).json({ message: "Signalement introuvable" });
      return;
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
};

const markBugAsDone: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await adminRepository.markBugAsDone(id);
    res.json({ message: "Signalement bug marqué comme traité" });
  } catch (err) {
    next(err);
  }
};

const markEventAsDone: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await adminRepository.markEventAsDone(id);
    res.json({ message: "Signalement event marqué comme traité" });
  } catch (err) {
    next(err);
  }
};

const markUserAsDone: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await adminRepository.markUserAsDone(id);
    res.json({ message: "Signalement user marqué comme traité" });
  } catch (err) {
    next(err);
  }
};

const banUser: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await adminRepository.banUser(id);

    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }

    try {
      await transporter.sendMail({
        from: `"Équipe Wedoo" <${process.env.EMAIL_USER}>`,
        to: user.user_mail,
        subject: "Votre compte Wedoo a été suspendu",
        text: `Bonjour ${user.user_username},\n\nVotre compte Wedoo a été suspendu suite à un signalement.\n\nSi vous estimez qu'il s'agit d'une erreur, contactez notre support.\n\nL'équipe Wedoo.`,
      });
    } catch (mailErr) {
      console.error("Échec de l'envoi du mail :", mailErr);
    }

    res.json({ message: "Utilisateur banni" });
  } catch (err) {
    next(err);
  }
};

const banUserFromEvent: RequestHandler = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    const userId = Number(req.params.userId);
    const user = await adminRepository.banUserFromEvent(eventId, userId);

    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }

    try {
      await transporter.sendMail({
        from: `"Équipe Wedoo" <${process.env.EMAIL_USER}>`,
        to: user.user_mail,
        subject: "Vous avez été retiré d'un événement Wedoo",
        text: `Bonjour ${user.user_username},\n\nVous avez été retiré d'un événement suite à un signalement.\n\nSi vous estimez qu'il s'agit d'une erreur, contactez notre support.\n\nL'équipe Wedoo.`,
      });
    } catch (mailErr) {
      console.error("Échec de l'envoi du mail :", mailErr);
    }

    res.json({ message: "Utilisateur retiré de l'événement" });
  } catch (err) {
    next(err);
  }
};

const banEvent: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await adminRepository.banEvent(id);

    if (!data) {
      res.status(404).json({ message: "Événement introuvable" });
      return;
    }

    try {
      await transporter.sendMail({
        from: `"Équipe Wedoo" <${process.env.EMAIL_USER}>`,
        to: data.user_mail,
        subject: "Votre événement Wedoo a été retiré",
        text: `Bonjour ${data.user_username},\n\nVotre événement "${data.event_name}" a été retiré des listes publiques suite à un signalement.\n\nSi vous estimez qu'il s'agit d'une erreur, contactez notre support.\n\nL'équipe Wedoo.`,
      });
    } catch (mailErr) {
      console.error("Échec de l'envoi du mail :", mailErr);
    }

    res.json({ message: "Événement banni" });
  } catch (err) {
    next(err);
  }
};

export default {
  readAllUsers,
  readAllEvents,
  readArrayReport,
  readArrayUsers,
  readDashboardChart,
  readAvailableYears,
  readReportBug,
  readReportEvent,
  readReportUser,
  readReportBugById,
  readReportEventById,
  readReportUserById,
  markBugAsDone,
  markEventAsDone,
  markUserAsDone,
  banUser,
  banUserFromEvent,
  banEvent,
};
