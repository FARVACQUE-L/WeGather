import type { RequestHandler } from "express";

import { isEventMember, readMemberEventId } from "../../helper/eventMembership";
import { getStatus } from "../../presence";
import { removeFromEventRoom } from "../../socket";
import eventRepository from "../event/eventRepository";
import eventUserJoiningRepository from "./eventUserJoiningRepository";

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const euj = await eventUserJoiningRepository.readAll(eventId);

    res.json(euj);
  } catch (err) {
    next(err);
  }
};

const browseUserEvent: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const event = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!event) {
      res.sendStatus(404);
      return;
    }

    res.status(200).json({
      joined: await isEventMember(event, req.user.id),
    });
  } catch (err) {
    next(err);
  }
};

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

    if (!(await isEventMember(event.event_id, req.user.id))) {
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

    const userId = Number(req.params.userId);
    await eventUserJoiningRepository.ban(eventId, userId);
    removeFromEventRoom(userId, req.params.eventUuid);

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

const leave: RequestHandler = async (req, res, next) => {
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

    if (event.event_id_host === req.user.id) {
      res.status(400).json({
        message:
          "L'hôte ne peut pas quitter son événement, il peut le supprimer.",
      });
      return;
    }

    const affectedRows = await eventUserJoiningRepository.leave(
      event.event_id,
      req.user.id,
    );

    if (affectedRows === 0) {
      res.sendStatus(404);
      return;
    }

    removeFromEventRoom(req.user.id, req.params.eventUuid);
    res.sendStatus(204);
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
  leave,
};
