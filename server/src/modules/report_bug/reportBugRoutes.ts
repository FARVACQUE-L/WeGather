import express from "express";
import authorization from "../../middleware/auth";
import upload from "../../middleware/upload";
import reportBugActions from "./reportBugActions";

const reportBugRoutes = express.Router();

reportBugRoutes.get(
  "/api/userreport-bug",
  authorization,
  reportBugActions.browse,
);
reportBugRoutes.post(
  "/api/userreport-bug",
  authorization,
  upload.array("reported_bug_image"),
  reportBugActions.add,
);

export default reportBugRoutes;
