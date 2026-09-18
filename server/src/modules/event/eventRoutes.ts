import express from "express";
import authorization from "../../middleware/auth";
import upload from "../../middleware/upload";
import eventActions from "./eventActions";

const eventRoutes = express.Router();

eventRoutes.get("/api/events", authorization, eventActions.browse);
eventRoutes.get(
  "/api/events/name/:eventUuid",
  authorization,
  eventActions.readEventName,
);
eventRoutes.get("/api/events/images", authorization, eventActions.browseImages);
eventRoutes.get(
  "/api/events/uuid/:uuid",
  authorization,
  eventActions.readByUuid,
);
eventRoutes.get("/events/uuid/:uuid", authorization, eventActions.readByUuid);
eventRoutes.get("/api/events/:eventUuid", authorization, eventActions.read);
eventRoutes.post("/api/events/join", authorization, eventActions.join);
eventRoutes.post("/api/events", authorization, eventActions.add);
eventRoutes.put(
  "/api/events/:eventUuid/",
  authorization,
  upload.single("picture"),
  eventActions.edit,
);
eventRoutes.delete(
  "/api/event/delete/:eventUuid",
  authorization,
  eventActions.deleteEvent,
);
eventRoutes.get(
  "/api/event/host/:eventUuid",
  authorization,
  eventActions.readEventHostId,
);

export default eventRoutes;
