import express from "express";
import authorization from "../../middleware/auth";
import upload from "../../middleware/upload";
import reservationActions from "./reservationActions";

const reservationRoutes = express.Router();

reservationRoutes.get(
  "/api/reservations/:eventUuid",
  authorization,
  reservationActions.browse,
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
  reservationActions.addReservation,
);
reservationRoutes.put(
  "/api/reservations/update/:id",
  authorization,
  upload.single("reservation_picture"),
  reservationActions.updateReservation,
);
reservationRoutes.delete(
  "/api/reservations/delete/:id",
  authorization,
  reservationActions.deleteReservation,
);

export default reservationRoutes;
