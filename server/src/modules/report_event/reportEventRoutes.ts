import express from "express";
import authorization from "../../middleware/auth";
import {
  MAX_FILES,
  uploadEvidence,
  verifyFileSignatures,
} from "../../middleware/upload";
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
  uploadEvidence.array("reported_event_image", MAX_FILES),
  verifyFileSignatures,
  reportEventActions.add,
);

export default reportEventRoutes;
