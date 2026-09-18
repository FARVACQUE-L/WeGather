import express from "express";
import authorization from "../../middleware/auth";
import {
  MAX_FILES,
  uploadEvidence,
  verifyFileSignatures,
} from "../../middleware/upload";
import reportUserActions from "./reportUserActions";

const reportUserRoutes = express.Router();

reportUserRoutes.get(
  "/api/userreport-user",
  authorization,
  reportUserActions.browse,
);
reportUserRoutes.post(
  "/api/userreport-user",
  authorization,
  uploadEvidence.array("reported_user_image", MAX_FILES),
  verifyFileSignatures,
  reportUserActions.add,
);

export default reportUserRoutes;
