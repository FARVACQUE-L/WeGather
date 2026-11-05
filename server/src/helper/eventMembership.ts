import type { Request, Response } from "express";
import eventRepository from "../modules/event/eventRepository";
import eventUserJoiningRepository from "../modules/event_user_joining/eventUserJoiningRepository";

export const isEventMember = async (eventId: number, userId: number) =>
  (await eventUserJoiningRepository.readBy(eventId, userId)).length > 0;

export const readMemberEventId = async (
  req: Request,
  res: Response,
  eventUuid: unknown,
) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  const eventId =
    typeof eventUuid === "string"
      ? await eventRepository.readIdByUuid(eventUuid)
      : undefined;
  if (!eventId) {
    res.sendStatus(404);
    return undefined;
  }

  if (!(await isEventMember(eventId, req.user.id))) {
    res
      .status(403)
      .json({ message: "Vous n'êtes pas inscrit à cet événement." });
    return undefined;
  }

  return eventId;
};
