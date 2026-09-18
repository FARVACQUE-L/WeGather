import express from "express";
import authorization from "../../middleware/auth";
import {
  MAX_FILES,
  uploadEvidence,
  verifyFileSignatures,
} from "../../middleware/upload";
import reportBugActions from "./reportBugActions";

const reportBugRoutes = express.Router();

reportBugRoutes.post(
  "/api/userreport-bug",
  authorization,
  uploadEvidence.array("reported_bug_image", MAX_FILES),
  verifyFileSignatures,
  reportBugActions.add,
);

export default reportBugRoutes;
