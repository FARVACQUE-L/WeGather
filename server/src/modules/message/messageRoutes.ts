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
  "/api/messages/unread/:eventUuid/:userId",
  authorization,
  messageActions.getUnreadMessages,
);

export default messageRoutes;
