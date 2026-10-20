import fs from "node:fs";
import path from "node:path";
import type { RequestHandler } from "express";
import { getPlanLimits } from "../../helper/planLimits";
import { removeUpload } from "../../helper/removeUpload";
import userRepository from "../user/userRepository";
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
    // multer a déjà écrit la photo sur disque : on ne la garde pas pour un
    // événement qui ne sera pas créé.
    if (req.file) fs.rmSync(req.file.path, { force: true });
    res.status(400).json({ message: "Veuillez remplir tous les champs." });
    return;
  }

  // Photo facultative : sans fichier, l'événement prend le logo WeGather.
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const event_picture = req.file
    ? `${baseUrl}/uploads/${req.file.filename}`
    : `${baseUrl}/assets/images/logo-wegather.png`;

  try {
    // Nombre d'événements créés selon la formule du compte. Un événement
    // supprimé libère sa place ; un événement banni la garde, pour que le
    // bannissement ne rende pas un créneau.
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

// Seul l'hôte, identifié par le cookie de session, peut modifier ou supprimer
// son événement. Renvoie l'événement, ou null si la réponse d'erreur a déjà
// été envoyée.
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
    const event = await readHostedEvent(req, res);

    if (!event) {
      // multer a déjà écrit la photo sur disque : on ne la garde pas.
      if (req.file) fs.rmSync(req.file.path, { force: true });
      return;
    }

    await eventRepository.update(event.event_id, {
      event_name,
      event_date_start,
      event_date_end,
      event_description,
      event_location,
      event_picture,
    });
    // L'ancienne photo n'est effacée que si une nouvelle la remplace. Le logo
    // par défaut (sous /assets) est ignoré par removeUpload.
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

    // Les fichiers ne sont effacés qu'une fois la suppression en base réussie.
    const images = await eventRepository.readImages(event.event_id);
    await eventRepository.deleteEvent(event.event_id);
    await Promise.all(images.map(removeUpload));

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
