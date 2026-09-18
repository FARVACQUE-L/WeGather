import express from "express";
import authorization from "../../middleware/auth";
import upload, { verifyFileSignatures } from "../../middleware/upload";
import galleryActions from "./galleryActions";

const galleryRoutes = express.Router();

galleryRoutes.get(
  "/api/gallery/:eventUuid",
  authorization,
  galleryActions.browse,
);

galleryRoutes.post(
  "/api/gallery",
  authorization,
  upload.single("photo"),
  verifyFileSignatures,
  galleryActions.uploadPhoto,
);

galleryRoutes.post("/api/gallery", authorization, galleryActions.add);
galleryRoutes.delete(
  "/api/gallery/:gallery_id/:userId",
  authorization,
  galleryActions.destroy,
);
galleryRoutes.put(
  "/api/gallery/:gallery_id/:userId",
  authorization,
  galleryActions.edit,
);

galleryRoutes.get(
  "/api/gallery/:eventUuid/likes/:userId",
  authorization,
  galleryActions.getLikedPhotos,
);
galleryRoutes.post(
  "/api/gallery/:id/like",
  authorization,
  galleryActions.addLike,
);
galleryRoutes.delete(
  "/api/gallery/:id/like/:userId",
  authorization,
  galleryActions.removeLike,
);

export default galleryRoutes;
