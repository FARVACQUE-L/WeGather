import express from "express";
import authorization from "../../middleware/auth";
import upload from "../../middleware/upload";
import userActions from "./userActions";

const userRoutes = express.Router();

userRoutes.get("/api/auth/authVerif", authorization, userActions.authVerif);

userRoutes.get("/api/users", authorization, userActions.browseInscription);
userRoutes.get("/api/username/:id", authorization, userActions.readUserName);

userRoutes.get(
  "/api/users/description/:eventUuid",
  authorization,
  userActions.readUserDescriptionEvent,
);

userRoutes.get("/api/users/:id", authorization, userActions.read);
userRoutes.get(
  "/api/users/:eventUuid/userAndBudget",
  authorization,
  userActions.browseUserAndBudget,
);

userRoutes.post("/api/users", userActions.add);
userRoutes.get("/api/users/:id/photo", authorization, userActions.browsePhoto);
userRoutes.post(
  "/api/users/:id/photo",
  authorization,
  upload.single("photo"),
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
userRoutes.put(
  "/api/users/change-password",
  authorization,
  userActions.forgotPassword,
);
userRoutes.get(
  "/api/users/admin/:id",
  authorization,
  userActions.browseUserAdmin,
);
userRoutes.get(
  "/api/user/event/:eventUuid",
  authorization,
  userActions.readUserJoinEvent,
);

export default userRoutes;
