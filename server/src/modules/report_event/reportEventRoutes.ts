import express from "express";
import authorization from "../../middleware/auth";
import upload from "../../middleware/upload";
import reportEventActions from "./reportEventActions";

const reportEventRoutes = express.Router();

reportEventRoutes.get(
  "/api/userreport-event",
  authorization,
  reportEventActions.browse,
);
reportEventRoutes.post(
  "/api/userreport-event",
  authorization,
  upload.array("reported_event_image"),
  reportEventActions.add,
);

export default reportEventRoutes;
