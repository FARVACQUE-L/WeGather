import type { RequestHandler } from "express";
import { discardUploadedFiles } from "../../helper/discardUploadedFiles";
import { isEventMember } from "../../helper/eventMembership";
import { asText, isText, LIMITS } from "../../helper/validation";
import eventRepository from "../event/eventRepository";
import reportEventRepository from "./reportEventRepository";

const add: RequestHandler = async (req, res, next) => {
  let filesKept = false;

  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (
      !isText(req.body.reported_event_description, LIMITS.reportDescription)
    ) {
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

    const newReportEvent = {
      reported_event_id_event: eventId,
      reported_event_description: asText(req.body.reported_event_description),
      reported_event_by_id_user: req.user.id,
    };

    const alreadyExists = await reportEventRepository.exists(
      newReportEvent.reported_event_by_id_user,
      newReportEvent.reported_event_id_event,
    );

    if (alreadyExists) {
      res
        .status(409)
        .json({ message: "Vous avez déjà signalé cet événement récemment." });
      return;
    }

    const insertId = await reportEventRepository.create(
      newReportEvent,
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
