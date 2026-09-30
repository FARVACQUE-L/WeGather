import type { RequestHandler } from "express";

import { getStatus } from "../../presence";
import eventRepository from "../event/eventRepository";
import eventUserJoiningRepository from "./eventUserJoiningRepository";

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const euj = await eventUserJoiningRepository.readAll(eventId);

    res.json(euj);
  } catch (err) {
    next(err);
  }
};

const browseUserEvent: RequestHandler = async (req, res, next) => {
  try {
    const event = await eventRepository.readIdByUuid(req.params.eventUuid);
    const user = Number(req.params.user);

    if (!event) {
      res.sendStatus(404);
      return;
    }

    const rows = await eventUserJoiningRepository.readBy(event, user);

    res.status(200).json({
      joined: rows.length > 0,
    });
  } catch (err) {
    next(err);
  }
};

// Membres de l'événement, visibles par tous ses membres. La liste des bannis
// n'est envoyée qu'à l'hôte, seul à pouvoir les débannir.
const browseGroup: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const event = await eventRepository.readByUuid(req.params.eventUuid);

    if (!event) {
      res.sendStatus(404);
      return;
    }

    const membership = await eventUserJoiningRepository.readBy(
      event.event_id,
      req.user.id,
    );

    if (membership.length === 0) {
      res
        .status(403)
        .json({ message: "Vous ne participez pas à cet événement." });
      return;
    }

    const isHost = event.event_id_host === req.user.id;
    const members = await eventUserJoiningRepository.readAll(event.event_id);
    const banned = isHost
      ? await eventUserJoiningRepository.readBanned(event.event_id)
      : [];

    // Statut de présence de chaque membre (en ligne, inactif, hors ligne).
    const membersWithStatus = members.map((member) => ({
      ...member,
      status: getStatus(member.euj_id_user),
    }));

    res.json({
      host_id: event.event_id_host,
      members: membersWithStatus,
      banned,
    });
  } catch (err) {
    next(err);
  }
};

// Vérifie que l'utilisateur connecté est l'hôte et que la cible n'est pas
// l'hôte lui-même. Renvoie l'id de l'événement, ou null si la réponse
// d'erreur a déjà été envoyée.
const resolveHostAction = async (
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
    res.status(403).json({ message: "Seul l'hôte peut gérer les membres." });
    return null;
  }

  if (Number(req.params.userId) === event.event_id_host) {
    res.status(400).json({ message: "L'hôte ne peut pas se bannir." });
    return null;
  }

  return event.event_id;
};

const ban: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await resolveHostAction(req, res);
    if (eventId === null) return;

    await eventUserJoiningRepository.ban(eventId, Number(req.params.userId));

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const unban: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await resolveHostAction(req, res);
    if (eventId === null) return;

    const affectedRows = await eventUserJoiningRepository.unban(
      eventId,
      Number(req.params.userId),
    );

    if (affectedRows === 0) {
      res.sendStatus(404);
      return;
    }

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const deleteAll: RequestHandler = async (req, res, next) => {
  try {
    const UserId = Number(req.params.id);
    const euj = await eventUserJoiningRepository.deleteAll(UserId);
    res.json(euj);
  } catch (err) {
    next(err);
  }
};

export default {
  browse,
  browseUserEvent,
  browseGroup,
  ban,
  unban,
  deleteAll,
};
