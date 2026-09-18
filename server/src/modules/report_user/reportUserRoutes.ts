import express from "express";
import authorization from "../../middleware/auth";
import upload from "../../middleware/upload";
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
  upload.array("reported_user_image"),
  reportUserActions.add,
);

export default reportUserRoutes;
