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
eventUserJoiningRoutes.delete(
  "/api/euj/delete/:id",
  authorization,
  eventUserJoiningActions.deleteAll,
);

export default eventUserJoiningRoutes;
