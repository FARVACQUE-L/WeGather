import type { RequestHandler } from "express";
import eventRepository from "../event/eventRepository";
import reservationRepository from "./reservationRepository";

// Champ facultatif. Seuls http et https sont acceptés : le lien est rendu
// cliquable côté client, et un « javascript: » y serait exécutable.
const sanitizeLink = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;

  const link = value.trim();

  return /^https?:\/\//i.test(link) ? link : null;
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const event =
      await reservationRepository.readReservationDescriptionEvent(eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};
const readAllReservation: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const event = await reservationRepository.readAllReservation(eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};
const addReservation: RequestHandler = async (req, res, next) => {
  try {
    const {
      reservation_id_user,
      reservation_name,
      reservation_date,
      reservation_location,
      reservation_description,
    } = req.body;

    const reservation_picture = req.file
      ? `/uploads/${req.file.filename}`
      : null;
    const eventId = await eventRepository.readIdByUuid(req.body.event_uuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const event = await reservationRepository.addReservation({
      reservation_id_event: eventId,
      reservation_id_user,
      reservation_name,
      reservation_date,
      reservation_location,
      reservation_description,
      reservation_link: sanitizeLink(req.body.reservation_link),
      reservation_picture,
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};
const updateReservation: RequestHandler = async (req, res, next) => {
  try {
    const reservationId = Number(req.params.id);
    const {
      reservation_name,
      reservation_date,
      reservation_location,
      reservation_description,
    } = req.body;

    if (
      !reservation_name ||
      !reservation_date ||
      !reservation_location ||
      !reservation_description
    ) {
      res.status(400).json({ message: "Veuillez remplir tous les champs." });
      return;
    }

    const reservation_picture = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const result = await reservationRepository.updateReservation(
      reservationId,
      {
        reservation_name,
        reservation_date,
        reservation_location,
        reservation_description,
        reservation_link: sanitizeLink(req.body.reservation_link),
        reservation_picture,
      },
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteReservation: RequestHandler = async (req, res, next) => {
  try {
    const reservationId = Number(req.params.id);

    await reservationRepository.deleteReservation(reservationId);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export default {
  browse,
  readAllReservation,
  addReservation,
  updateReservation,
  deleteReservation,
};
