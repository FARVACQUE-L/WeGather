import fs from "node:fs/promises";
import path from "node:path";
import type { RequestHandler } from "express";
import { isEventMember, readMemberEventId } from "../../helper/eventMembership";
import { removeUpload } from "../../helper/removeUpload";
import { LIMITS } from "../../helper/validation";
import { UPLOADS_DIRECTORY } from "../../middleware/upload";
import { getIo } from "../../socket";
import eventRepository from "../event/eventRepository";
import eventUserJoiningRepository from "../event_user_joining/eventUserJoiningRepository";
import messageRepository, { REACTION_EMOJIS } from "./messageRepository";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const MESSAGE_TOO_LONG = `Le message ne doit pas dépasser ${LIMITS.messageText} caractères.`;

const addImageExtension = async (file: Express.Multer.File) => {
  const filename = `${file.filename}${IMAGE_EXTENSIONS[file.mimetype] ?? ""}`;
  const newPath = path.join(UPLOADS_DIRECTORY, filename);

  await fs.rename(file.path, newPath);
  file.path = newPath;

  return `/uploads/${filename}`;
};

const addMessage: RequestHandler = async (req, res, next) => {
  let imageKept = false;

  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);
    const { replyTo } = req.body;
    const messageText = String(req.body.messagesUser ?? "").trim();
    const image = req.file ? await addImageExtension(req.file) : null;

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const membership = await eventUserJoiningRepository.readBy(eventId, userId);
    if (membership.length === 0) {
      res
        .status(403)
        .json({ message: "Vous ne participez pas à cet événement." });
      return;
    }

    if (!messageText && !image) {
      res.status(400).json({ message: "Le message est vide." });
      return;
    }

    if (messageText.length > LIMITS.messageText) {
      res.status(400).json({ message: MESSAGE_TOO_LONG });
      return;
    }

    let replyToId: number | null = null;
    if (replyTo !== undefined && replyTo !== null && replyTo !== "") {
      const repliedMessage = await messageRepository.readOwner(Number(replyTo));

      if (!repliedMessage || repliedMessage.message_id_event !== eventId) {
        res.status(400).json({ message: "Message cité introuvable." });
        return;
      }

      replyToId = repliedMessage.message_id;
    }

    const result = await messageRepository.sendMessage(
      eventId,
      userId,
      messageText,
      replyToId,
      image,
    );
    imageKept = true;

    const io = getIo();
    io.to(`event-${req.params.eventUuid}`).emit("new-message", result);
    res.status(201).json(result);
  } catch (error) {
    console.error("messageActions.addMessage erreur", error);
    next(error);
  } finally {
    if (!imageKept && req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
};
const browseMessagesByEventId: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const messages = await messageRepository.getMessagesByEventId(eventId);

    res.json(messages);
  } catch (error) {
    console.error("messageActions.browseMessagesByEventId erreur", error);
    next(error);
  }
};
const notificationMessage: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId || !req.user) return;

    await messageRepository.notificationMessage(eventId, req.user.id);

    const message = await messageRepository.getMessagesByEventId(eventId);

    res.status(201).json(message);
  } catch (error) {
    console.error("messageActions.addMessage erreur", error);
    next(error);
  }
};
const getUnreadMessages: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId || !req.user) return;

    const count = await messageRepository.getUnreadMessages(
      eventId,
      req.user.id,
    );

    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};
const findEventMessage = async (
  eventUuid: string,
  messageId: number,
  res: Parameters<RequestHandler>[1],
) => {
  const event = await eventRepository.readByUuid(eventUuid);
  const message = await messageRepository.readOwner(messageId);

  if (!event || !message || message.message_id_event !== event.event_id) {
    res.sendStatus(404);
    return null;
  }

  return { event, message };
};

const editMessage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const messageText = String(req.body.messagesUser ?? "").trim();

    const found = await findEventMessage(
      req.params.eventUuid,
      Number(req.params.messageId),
      res,
    );
    if (!found) return;

    if (
      found.message.message_id_user !== req.user.id ||
      !(await isEventMember(found.event.event_id, req.user.id))
    ) {
      res
        .status(403)
        .json({ message: "Vous ne pouvez modifier que vos messages." });
      return;
    }

    if (!messageText && !found.message.message_image) {
      res.status(400).json({ message: "Le message est vide." });
      return;
    }

    if (messageText.length > LIMITS.messageText) {
      res.status(400).json({ message: MESSAGE_TOO_LONG });
      return;
    }

    const updated = await messageRepository.update(
      found.message.message_id,
      messageText,
    );

    getIo()
      .to(`event-${req.params.eventUuid}`)
      .emit("message-updated", updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteMessage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const found = await findEventMessage(
      req.params.eventUuid,
      Number(req.params.messageId),
      res,
    );
    if (!found) return;

    const isAuthor =
      found.message.message_id_user === req.user.id &&
      (await isEventMember(found.event.event_id, req.user.id));
    const isHost = found.event.event_id_host === req.user.id;

    if (!isAuthor && !isHost) {
      res
        .status(403)
        .json({ message: "Vous ne pouvez pas supprimer ce message." });
      return;
    }

    await messageRepository.delete(found.message.message_id);
    await removeUpload(found.message.message_image);

    getIo()
      .to(`event-${req.params.eventUuid}`)
      .emit("message-deleted", { message_id: found.message.message_id });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const toggleReaction: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const emoji = String(req.body.emoji ?? "");
    if (!REACTION_EMOJIS.includes(emoji)) {
      res.status(400).json({ message: "Réaction non autorisée." });
      return;
    }

    const found = await findEventMessage(
      req.params.eventUuid,
      Number(req.params.messageId),
      res,
    );
    if (!found) return;

    const membership = await eventUserJoiningRepository.readBy(
      found.event.event_id,
      req.user.id,
    );
    if (membership.length === 0) {
      res
        .status(403)
        .json({ message: "Vous ne participez pas à cet événement." });
      return;
    }

    const reactions = await messageRepository.toggleReaction(
      found.message.message_id,
      req.user.id,
      emoji,
    );

    const payload = { message_id: found.message.message_id, reactions };
    getIo()
      .to(`event-${req.params.eventUuid}`)
      .emit("message-reactions", payload);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

export default {
  toggleReaction,
  addMessage,
  browseMessagesByEventId,
  notificationMessage,
  getUnreadMessages,
  editMessage,
  deleteMessage,
};
