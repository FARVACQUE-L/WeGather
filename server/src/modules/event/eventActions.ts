import fs from "node:fs";
import path from "node:path";
import type { RequestHandler } from "express";
import eventRepository from "./eventRepository";

const browse: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.query.userId);
    const events = await eventRepository.readAll(userId);
    res.json(events);
  } catch (error) {
    next(error);
  }
};

const add: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const event_id_host = req.user.id;

  const {
    event_name,
    event_date_start,
    event_date_end,
    event_picture,
    event_description,
    event_location,
  } = req.body;

  if (
    !event_name ||
    !event_date_start ||
    !event_date_end ||
    !event_description ||
    !event_location
  ) {
    res.status(400).json({ message: "Veuillez remplir tous les champs." });
    return;
  }

  try {
    const insertId = await eventRepository.create({
      event_name,
      event_date_start,
      event_date_end,
      event_id_host,
      event_picture,
      event_description,
      event_location,
    });
    const newEvent = await eventRepository.read(insertId);
    res.status(201).json(newEvent);
  } catch (error) {
    next(error);
  }
};

const join: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user_id = req.user.id;
  const { event_link_key } = req.body;

  if (!event_link_key || !user_id) {
    res.status(400).json({ message: "Code et utilisateur requis." });
    return;
  }

  try {
    const event = await eventRepository.readByLinkKey(event_link_key);

    if (!event) {
      res
        .status(404)
        .json({ message: "Code invalide ou événement introuvable." });
      return;
    }

    const isBanned = await eventRepository.isUserBanned(
      event.event_id,
      user_id,
    );
    if (isBanned) {
      res
        .status(403)
        .json({ message: "Vous avez été banni de cet événement." });
      return;
    }

    await eventRepository.joinEvent(event.event_id, user_id);
    res.status(201).json(event);
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "ER_DUP_ENTRY") {
      res
        .status(409)
        .json({ message: "Vous participez déjà à cet événement." });
      return;
    }
    next(error);
  }
};

const browseImages: RequestHandler = (_req, res, next) => {
  try {
    const dir = path.join(process.cwd(), "public/assets/images");
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

    if (!files.length) {
      res.status(404).json({ message: "Aucune image disponible." });
      return;
    }

    res.json(files.map((f) => `/assets/images/${f}`));
  } catch (error) {
    next(error);
  }
};

const read: RequestHandler = async (req, res, next) => {
  try {
    const event = await eventRepository.readByUuid(req.params.eventUuid);

    if (!event) {
      res.sendStatus(404);
      return;
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

const edit: RequestHandler = async (req, res, next) => {
  const {
    event_name,
    event_date_start,
    event_date_end,
    event_description,
    event_location,
  } = req.body;

  const event_picture = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : undefined;

  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    await eventRepository.update(eventId, {
      event_name,
      event_date_start,
      event_date_end,
      event_description,
      event_location,
      event_picture,
    });
    const updatedEvent = await eventRepository.read(eventId);
    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
};
const deleteEvent: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    await eventRepository.deleteEvent(eventId);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
const readEventHostId: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const rows = await eventRepository.readEventHostId(eventId);

    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};
const readEventName: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.status(404).json({ message: "eventUuid invalide" });
      return;
    }

    const event = await eventRepository.readEventName(eventId);

    res.json(event[0]);
  } catch (error) {
    next(error);
  }
};
const readByUuid: RequestHandler = async (req, res, next) => {
  try {
    const event = await eventRepository.readByUuid(req.params.uuid);

    if (!event) {
      res.sendStatus(404);
      return;
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};
export default {
  browse,
  read,
  add,
  join,
  browseImages,
  edit,
  deleteEvent,
  readEventHostId,
  readEventName,
  readByUuid,
};
