import type { RequestHandler } from "express";
import { discardUploadedFiles } from "../../helper/discardUploadedFiles";
import { isEventMember } from "../../helper/eventMembership";
import { asText, isText, LIMITS } from "../../helper/validation";
import eventRepository from "../event/eventRepository";
import eventUserJoiningRepository from "../event_user_joining/eventUserJoiningRepository";
import reportUserRepository from "./reportUserRepository";

const add: RequestHandler = async (req, res, next) => {
  let filesKept = false;

  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!isText(req.body.reported_user_description, LIMITS.reportDescription)) {
      res.status(400).json({
        message: `La description doit contenir entre 1 et ${LIMITS.reportDescription} caractères.`,
      });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const imagePaths = files?.map((file) => file.filename) ?? [];

    const eventId = await eventRepository.readIdByUuid(req.body.event_uuid);
    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    if (!(await isEventMember(eventId, req.user.id))) {
      res
        .status(403)
        .json({ message: "Vous n'êtes pas inscrit à cet événement." });
      return;
    }

    const reportedUserId = Number(req.body.reported_user_id_user);

    if (!reportedUserId || reportedUserId === req.user.id) {
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
      reported_user_description: asText(req.body.reported_user_description),
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
    filesKept = true;

    res.status(201).json({ insertId });
  } catch (err) {
    next(err);
  } finally {
    if (!filesKept) await discardUploadedFiles(req);
  }
};

export default { add };
