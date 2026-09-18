import type { RequestHandler } from "express";
import eventRepository from "../event/eventRepository";
import eventUserJoiningRepository from "../event_user_joining/eventUserJoiningRepository";
import reportUserRepository from "./reportUserRepository";

const browse: RequestHandler = async (_req, res, next) => {
  try {
    const reported_user = await reportUserRepository.readAll();

    res.json(reported_user);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const imagePaths = files?.map((file) => file.filename) ?? [];

    const eventId = await eventRepository.readIdByUuid(req.body.event_uuid);
    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const reportedUserId = Number(req.body.reported_user_id_user);

    if (!reportedUserId) {
      res.status(400).json({ message: "Utilisateur signalé invalide." });
      return;
    }

    const targetInEvent = await eventUserJoiningRepository.readBy(
      eventId,
      reportedUserId,
    );

    if (targetInEvent.length === 0) {
      res.status(400).json({
        message: "Cet utilisateur ne participe pas à cet événement.",
      });
      return;
    }

    const newReportUser = {
      reported_user_id_user: reportedUserId,
      reported_user_description: req.body.reported_user_description,
      // Le signaleur vient de la session, jamais du corps de la requête :
      // sinon n'importe qui peut signaler au nom d'un autre utilisateur et
      // contourner l'anti-spam de exists(), qui est indexé sur cet id.
      reported_user_by_id_user: req.user.id,
      reported_user_id_event: eventId,
    };

    const alreadyExists = await reportUserRepository.exists(
      newReportUser.reported_user_by_id_user,
      newReportUser.reported_user_id_user,
    );

    if (alreadyExists) {
      res
        .status(409)
        .json({ message: "Vous avez déjà signalé cet utilisateur récemment." });
      return;
    }

    const insertId = await reportUserRepository.create(
      newReportUser,
      imagePaths,
    );

    res.status(201).json({ insertId });
  } catch (err) {
    next(err);
  }
};

export default { browse, add };
