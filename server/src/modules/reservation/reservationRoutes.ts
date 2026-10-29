import express from "express";
import authorization from "../../middleware/auth";
import upload, {
  uploadReservationDocument,
  verifyFileSignatures,
} from "../../middleware/upload";
import reservationActions from "./reservationActions";
import reservationDocumentActions from "./reservationDocumentActions";

const reservationRoutes = express.Router();

reservationRoutes.get(
  "/api/reservations/:eventUuid",
  authorization,
  reservationActions.browse,
);
reservationRoutes.get(
  "/api/reservations/:eventUuid/limit",
  authorization,
  reservationActions.readLimit,
);
reservationRoutes.get(
  "/api/reservations/all/:eventUuid",
  authorization,
  reservationActions.readAllReservation,
);
reservationRoutes.post(
  "/api/reservations",
  authorization,
  upload.single("reservation_picture"),
  verifyFileSignatures,
  reservationActions.addReservation,
);
reservationRoutes.put(
  "/api/reservations/update/:id",
  authorization,
  upload.single("reservation_picture"),
  verifyFileSignatures,
  reservationActions.updateReservation,
);
reservationRoutes.delete(
  "/api/reservations/delete/:id",
  authorization,
  reservationActions.deleteReservation,
);

// Billets et confirmations (PDF ou image) d'une réservation.
reservationRoutes.post(
  "/api/reservations/:id/documents",
  authorization,
  uploadReservationDocument.single("document"),
  verifyFileSignatures,
  reservationDocumentActions.addDocument,
);
reservationRoutes.get(
  "/api/reservations/documents/:documentId/download",
  authorization,
  reservationDocumentActions.downloadDocument,
);
reservationRoutes.delete(
  "/api/reservations/documents/:documentId",
  authorization,
  reservationDocumentActions.deleteDocument,
);

export default reservationRoutes;
