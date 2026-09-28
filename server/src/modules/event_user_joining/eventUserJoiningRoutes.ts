import express from "express";
import authorization from "../../middleware/auth";
import eventUserJoiningActions from "./eventUserJoiningActions";

const eventUserJoiningRoutes = express.Router();

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
  "/api/euj/delete/:id",
  authorization,
  eventUserJoiningActions.deleteAll,
);

export default eventUserJoiningRoutes;
