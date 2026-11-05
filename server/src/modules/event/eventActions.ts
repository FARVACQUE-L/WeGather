import fs from "node:fs";
import type { RequestHandler } from "express";
import { readMemberEventId } from "../../helper/eventMembership";
import { getPlanLimits } from "../../helper/planLimits";
import { removeReservationDocument } from "../../helper/removeReservationDocument";
import { removeUpload } from "../../helper/removeUpload";
import { asText, isDate, isText, LIMITS } from "../../helper/validation";
import reservationDocumentRepository from "../reservation/reservationDocumentRepository";
import userRepository from "../user/userRepository";
import eventRepository from "./eventRepository";

const browse: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const events = await eventRepository.readAll(req.user.id);
    res.json(events);
  } catch (error) {
    next(error);
  }
};

type EventFields = {
  event_name: string;
  event_date_start: string;
  event_date_end: string;
  event_description: string;
  event_location: string;
};

const validateEventFields = (
  body: Record<string, unknown>,
  current?: EventFields,
): { message: string } | { fields: EventFields } => {
  const pick = (key: keyof EventFields) =>
    body[key] === undefined && current ? current[key] : asText(body[key]);

  const fields: EventFields = {
    event_name: pick("event_name"),
    event_date_start: pick("event_date_start"),
    event_date_end: pick("event_date_end"),
    event_description: pick("event_description"),
    event_location: pick("event_location"),
  };

  if (
    !fields.event_name ||
    !fields.event_date_start ||
    !fields.event_date_end ||
    !fields.event_description ||
    !fields.event_location
  ) {
    return { message: "Veuillez remplir tous les champs." };
  }

  if (
    !isText(fields.event_name, LIMITS.eventName) ||
    !isText(fields.event_description, LIMITS.eventDescription) ||
    !isText(fields.event_location, LIMITS.eventLocation)
  ) {
    return {
      message: `Le nom (${LIMITS.eventName} caractères), la description (${LIMITS.eventDescription}) et le lieu (${LIMITS.eventLocation}) sont trop longs.`,
    };
  }

  if (!isDate(fields.event_date_start) || !isDate(fields.event_date_end)) {
    return { message: "Dates invalides." };
  }

  if (fields.event_date_end < fields.event_date_start) {
    return { message: "La date de fin doit être après la date de début." };
  }

  return { fields };
};

const add: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const event_id_host = req.user.id;
  const validation = validateEventFields(req.body);

  if ("message" in validation) {
    if (req.file) fs.rmSync(req.file.path, { force: true });
    res.status(400).json({ message: validation.message });
    return;
  }

  const event_picture = req.file
    ? `/uploads/${req.file.filename}`
    : "/assets/images/logo-wegather.png";

  try {
    const { hostedEvents: maxHostedEvents } = getPlanLimits(
      await userRepository.readUserPlan(event_id_host),
    );
    const hostedEvents = await eventRepository.countHostedEvents(event_id_host);
    if (hostedEvents >= maxHostedEvents) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      res.status(403).json({
        message: `Vous ne pouvez pas créer plus de ${maxHostedEvents} événements avec votre formule.`,
      });
      return;
    }

    const insertId = await eventRepository.create({
      ...validation.fields,
      event_id_host,
      event_picture,
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
  const event_link_key = asText(req.body.event_link_key).toUpperCase();

  if (!/^[A-Z0-9]{6}$/.test(event_link_key)) {
    res.status(400).json({ message: "Le code doit contenir 6 caractères." });
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

const read: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

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

const readHostedEvent = async (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  const event = await eventRepository.readByUuid(req.params.eventUuid);

  if (!event) {
    res.sendStatus(404);
    return null;
  }

  if (event.event_id_host !== req.user.id) {
    res.status(403).json({ message: "Seul l'hôte peut gérer l'événement." });
    return null;
  }

  return event;
};

const edit: RequestHandler = async (req, res, next) => {
  const event_picture = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const event = await readHostedEvent(req, res);

    if (!event) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      return;
    }

    const validation = validateEventFields(req.body, event);

    if ("message" in validation) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      res.status(400).json({ message: validation.message });
      return;
    }

    await eventRepository.update(event.event_id, {
      ...validation.fields,
      event_picture,
    });
    if (req.file) await removeUpload(event.event_picture);

    const updatedEvent = await eventRepository.read(event.event_id);
    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
};
const deleteEvent: RequestHandler = async (req, res, next) => {
  try {
    const event = await readHostedEvent(req, res);
    if (!event) return;

    const images = await eventRepository.readImages(event.event_id);
    const documentFiles = await reservationDocumentRepository.readFilesByEvent(
      event.event_id,
    );
    await eventRepository.deleteEvent(event.event_id);
    await Promise.all(images.map(removeUpload));
    await Promise.all(documentFiles.map(removeReservationDocument));

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
const readEventHostId: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const rows = await eventRepository.readEventHostId(eventId);

    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};
const readEventName: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const event = await eventRepository.readEventName(eventId);

    res.json(event[0]);
  } catch (error) {
    next(error);
  }
};
export default {
  browse,
  read,
  add,
  join,
  edit,
  deleteEvent,
  readEventHostId,
  readEventName,
};
