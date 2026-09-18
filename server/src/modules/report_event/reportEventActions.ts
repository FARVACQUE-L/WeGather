import type { RequestHandler } from "express";
import eventRepository from "../event/eventRepository";
import reportEventRepository from "./reportEventRepository";

const browse: RequestHandler = async (_req, res, next) => {
  try {
    const reported_event = await reportEventRepository.readAll();

    res.json(reported_event);
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

    const newReportEvent = {
      reported_event_id_event: eventId,
      reported_event_description: req.body.reported_event_description,
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

    res.status(201).json({ insertId });
  } catch (err) {
    next(err);
  }
};

export default { browse, add };
