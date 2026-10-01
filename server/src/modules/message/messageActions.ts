import type { RequestHandler } from "express";
import { getIo } from "../../socket";
import eventRepository from "../event/eventRepository";
import eventUserJoiningRepository from "../event_user_joining/eventUserJoiningRepository";
import messageRepository from "./messageRepository";

// L'auteur est l'utilisateur du cookie de session, jamais un id envoyé par
// le client : sans ça, n'importe qui pouvait écrire au nom d'un autre. Seuls
// les membres de l'événement peuvent y écrire.
const addMessage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);
    const { messagesUser, replyTo } = req.body;

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

    if (!String(messagesUser ?? "").trim()) {
      res.status(400).json({ message: "Le message est vide." });
      return;
    }

    // Une réponse ne peut citer qu'un message du même événement.
    let replyToId: number | null = null;
    if (replyTo !== undefined && replyTo !== null) {
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
      messagesUser,
      replyToId,
    );

    const io = getIo();
    io.to(`event-${req.params.eventUuid}`).emit("new-message", result);
    res.status(201).json(result);
  } catch (error) {
    console.error("messageActions.addMessage erreur", error);
    next(error);
  }
};
const browseMessagesByEventId: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const messages = await messageRepository.getMessagesByEventId(eventId);

    res.json(messages);
  } catch (error) {
    console.error("messageActions.browseMessagesByEventId erreur", error);
    next(error);
  }
};
// Marque comme lus les messages de l'utilisateur du cookie de session, et
// non d'un id envoyé par le client.
const notificationMessage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    await messageRepository.notificationMessage(eventId, req.user.id);

    const message = await messageRepository.getMessagesByEventId(eventId);

    res.status(201).json(message);
  } catch (error) {
    console.error("messageActions.addMessage erreur", error);
    next(error);
  }
};
// Nombre de messages non lus de l'utilisateur du cookie de session : l'id
// n'est plus dans l'URL, où n'importe qui pouvait lire celui d'un autre.
const getUnreadMessages: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const count = await messageRepository.getUnreadMessages(
      eventId,
      req.user.id,
    );

    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};
// Retrouve le message ciblé dans l'événement de l'URL. Renvoie null si la
// réponse d'erreur est déjà envoyée.
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

// Seul l'auteur peut modifier son message.
const editMessage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const messageText = String(req.body.messagesUser ?? "").trim();
    if (!messageText) {
      res.status(400).json({ message: "Le message est vide." });
      return;
    }

    const found = await findEventMessage(
      req.params.eventUuid,
      Number(req.params.messageId),
      res,
    );
    if (!found) return;

    if (found.message.message_id_user !== req.user.id) {
      res
        .status(403)
        .json({ message: "Vous ne pouvez modifier que vos messages." });
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

// L'auteur peut supprimer son message, l'hôte n'importe quel message de son
// événement. Les réponses qui le citaient perdent leur citation.
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

    const isAuthor = found.message.message_id_user === req.user.id;
    const isHost = found.event.event_id_host === req.user.id;

    if (!isAuthor && !isHost) {
      res
        .status(403)
        .json({ message: "Vous ne pouvez pas supprimer ce message." });
      return;
    }

    await messageRepository.delete(found.message.message_id);

    getIo()
      .to(`event-${req.params.eventUuid}`)
      .emit("message-deleted", { message_id: found.message.message_id });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export default {
  addMessage,
  browseMessagesByEventId,
  notificationMessage,
  getUnreadMessages,
  editMessage,
  deleteMessage,
};
