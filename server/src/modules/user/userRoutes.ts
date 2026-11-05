import express from "express";
import authorization from "../../middleware/auth";
import upload, { verifyFileSignatures } from "../../middleware/upload";
import userActions from "./userActions";

const userRoutes = express.Router();

userRoutes.get("/api/auth/authVerif", authorization, userActions.authVerif);

userRoutes.get("/api/username/:id", authorization, userActions.readUserName);

userRoutes.get(
  "/api/users/description/:eventUuid",
  authorization,
  userActions.readUserDescriptionEvent,
);

userRoutes.post("/api/users", userActions.add);
userRoutes.get("/api/users/:id/photo", authorization, userActions.browsePhoto);
userRoutes.post(
  "/api/users/:id/photo",
  authorization,
  upload.single("photo"),
  verifyFileSignatures,
  userActions.uploadPhoto,
);
userRoutes.post("/api/login", userActions.login);
userRoutes.post("/api/logout", userActions.logout);
userRoutes.post("/api/auth/forgot-password", userActions.forgotPassword);
userRoutes.post("/api/auth/reset-password", userActions.resetPassword);
userRoutes.put(
  "/api/auth/change-password",
  authorization,
  userActions.changePassword,
);
userRoutes.put("/api/users/:id", authorization, userActions.editUserName);

export default userRoutes;
