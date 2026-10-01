import express from "express";
import authorization from "../../middleware/auth";
import messageActions from "./messageActions";

const messageRoutes = express.Router();

messageRoutes.get(
  "/api/messages/:eventUuid",
  authorization,
  messageActions.browseMessagesByEventId,
);
messageRoutes.post(
  "/api/messages/:eventUuid",
  authorization,
  messageActions.addMessage,
);
messageRoutes.post(
  "/api/messages/notification/:eventUuid",
  authorization,
  messageActions.notificationMessage,
);
messageRoutes.get(
  "/api/messages/unread/:eventUuid",
  authorization,
  messageActions.getUnreadMessages,
);
messageRoutes.put(
  "/api/messages/:eventUuid/:messageId",
  authorization,
  messageActions.editMessage,
);
messageRoutes.delete(
  "/api/messages/:eventUuid/:messageId",
  authorization,
  messageActions.deleteMessage,
);

export default messageRoutes;
