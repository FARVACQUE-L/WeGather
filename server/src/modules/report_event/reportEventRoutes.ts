import express from "express";
import authorization from "../../middleware/auth";
import { reportLimit } from "../../middleware/rateLimit";
import {
  MAX_FILES,
  uploadEvidence,
  verifyFileSignatures,
} from "../../middleware/upload";
import reportEventActions from "./reportEventActions";

const reportEventRoutes = express.Router();

reportEventRoutes.post(
  "/api/userreport-event",
  authorization,
  reportLimit,
  uploadEvidence.array("reported_event_image", MAX_FILES),
  verifyFileSignatures,
  reportEventActions.add,
);

export default reportEventRoutes;
