import express from "express";
import authorization from "../../middleware/auth";
import { reportLimit } from "../../middleware/rateLimit";
import {
  MAX_FILES,
  uploadEvidence,
  verifyFileSignatures,
} from "../../middleware/upload";
import reportUserActions from "./reportUserActions";

const reportUserRoutes = express.Router();

reportUserRoutes.post(
  "/api/userreport-user",
  authorization,
  reportLimit,
  uploadEvidence.array("reported_user_image", MAX_FILES),
  verifyFileSignatures,
  reportUserActions.add,
);

export default reportUserRoutes;
