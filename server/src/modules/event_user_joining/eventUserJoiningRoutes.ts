import express from "express";
import authorization from "../../middleware/auth";
import { validateIds } from "../../middleware/validateIds";
import eventUserJoiningActions from "./eventUserJoiningActions";

const eventUserJoiningRoutes = express.Router();

validateIds(eventUserJoiningRoutes, "userId");

eventUserJoiningRoutes.get(
  "/api/events/:eventUuid/users",
  authorization,
  eventUserJoiningActions.browse,
);
eventUserJoiningRoutes.get(
  "/api/user-in-event/:eventUuid/:user",
  authorization,
  eventUserJoiningActions.browseUserEvent,
);
eventUserJoiningRoutes.get(
  "/api/events/:eventUuid/group",
  authorization,
  eventUserJoiningActions.browseGroup,
);
eventUserJoiningRoutes.post(
  "/api/events/:eventUuid/ban/:userId",
  authorization,
  eventUserJoiningActions.ban,
);
eventUserJoiningRoutes.delete(
  "/api/events/:eventUuid/ban/:userId",
  authorization,
  eventUserJoiningActions.unban,
);
eventUserJoiningRoutes.delete(
  "/api/events/:eventUuid/leave",
  authorization,
  eventUserJoiningActions.leave,
);

export default eventUserJoiningRoutes;
