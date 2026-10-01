import express from "express";
import authorization from "../../middleware/auth";
import upload, { verifyFileSignatures } from "../../middleware/upload";
import messageActions from "./messageActions";

const messageRoutes = express.Router();

messageRoutes.get(
  "/api/messages/:eventUuid",
  authorization,
  messageActions.browseMessagesByEventId,
);
// Image jointe facultative, vérifiée comme celles de la galerie (type
// déclaré puis signature du fichier).
messageRoutes.post(
  "/api/messages/:eventUuid",
  authorization,
  upload.single("image"),
  verifyFileSignatures,
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
messageRoutes.post(
  "/api/messages/:eventUuid/:messageId/reactions",
  authorization,
  messageActions.toggleReaction,
);

export default messageRoutes;
