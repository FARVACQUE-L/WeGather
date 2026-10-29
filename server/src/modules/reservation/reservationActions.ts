import fs from "node:fs";
import type { RequestHandler } from "express";
import { getPlanLimits } from "../../helper/planLimits";
import { removeUpload } from "../../helper/removeUpload";
import eventRepository from "../event/eventRepository";
import eventUserJoiningRepository from "../event_user_joining/eventUserJoiningRepository";
import reservationRepository from "./reservationRepository";

type Req = Parameters<RequestHandler>[0];
type Res = Parameters<RequestHandler>[1];

// Seuls les participants de l'événement (l'hôte en fait partie) voient et
// ajoutent ses réservations. Renvoie l'id de l'événement, ou undefined si la
// réponse d'erreur a déjà été envoyée.
const readMemberEventId = async (req: Req, res: Res, eventUuid: string) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  const eventId = await eventRepository.readIdByUuid(eventUuid);
  if (!eventId) {
    res.sendStatus(404);
    return undefined;
  }

  const joined = await eventUserJoiningRepository.readBy(eventId, req.user.id);
  if (joined.length === 0) {
    res
      .status(403)
      .json({ message: "Vous n'êtes pas inscrit à cet événement." });
    return undefined;
  }

  return eventId;
};

// Renvoie le message d'erreur à afficher, ou null si les champs sont valides.
// Les dates arrivent en « AAAA-MM-JJ » (dateStrings) : la comparaison de
// chaînes suit l'ordre chronologique.
const validateReservationFields = async (
  eventId: number,
  body: Record<string, unknown>,
) => {
  const { reservation_name, reservation_date, reservation_location } = body;

  // 255 : taille des colonnes reservation_name et reservation_location.
  if (
    String(reservation_name).length > 255 ||
    String(reservation_location).length > 255
  ) {
    return "Le nom et le lieu ne doivent pas dépasser 255 caractères.";
  }

  const date = String(reservation_date);
  const [event] = await eventRepository.readEventName(eventId);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !event ||
    date < event.event_date_start ||
    date > event.event_date_end
  ) {
    return "La date doit être comprise dans les dates de l'événement";
  }

  return null;
};

// Champ facultatif. Seuls http et https sont acceptés : le lien est rendu
// cliquable côté client, et un « javascript: » y serait exécutable.
const sanitizeLink = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;

  const link = value.trim();

  return /^https?:\/\//i.test(link) ? link : null;
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const event =
      await reservationRepository.readReservationDescriptionEvent(eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};
// Nombre de réservations d'un événement selon la formule de l'organisateur.
// Infinity (sans limite) est envoyé en JSON comme null.
const readReservationLimit = async (eventId: number) =>
  getPlanLimits(await eventRepository.readHostPlan(eventId)).reservations;

const readLimit: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    res.json({ limit: await readReservationLimit(eventId) });
  } catch (error) {
    next(error);
  }
};
const readAllReservation: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const event = await reservationRepository.readAllReservation(eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};
const addReservation: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // L'auteur est l'utilisateur du cookie de session, jamais un id envoyé
    // par le client.
    const reservation_id_user = req.user.id;
    const {
      reservation_name,
      reservation_date,
      reservation_location,
      reservation_description,
    } = req.body;

    // L'image est obligatoire à la création (colonne NOT NULL), comme dans le
    // formulaire du client.
    if (
      !reservation_name ||
      !reservation_date ||
      !reservation_location ||
      !reservation_description ||
      !req.file
    ) {
      // multer a déjà écrit l'image sur disque : on ne la garde pas.
      if (req.file) fs.rmSync(req.file.path, { force: true });
      res.status(400).json({
        message: "Veuillez remplir tous les champs et ajouter une image.",
      });
      return;
    }

    const reservation_picture = `/uploads/${req.file.filename}`;
    const eventId = await readMemberEventId(
      req,
      res,
      String(req.body.event_uuid),
    );

    if (!eventId) {
      fs.rmSync(req.file.path, { force: true });
      return;
    }

    const invalidMessage = await validateReservationFields(eventId, req.body);
    if (invalidMessage) {
      fs.rmSync(req.file.path, { force: true });
      res.status(400).json({ message: invalidMessage });
      return;
    }

    const maxReservations = await readReservationLimit(eventId);
    if (
      (await reservationRepository.countByEvent(eventId)) >= maxReservations
    ) {
      fs.rmSync(req.file.path, { force: true });
      res.status(403).json({
        message: `Un événement est limité à ${maxReservations} réservations.`,
      });
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
// L'auteur peut gérer sa réservation, l'hôte n'importe quelle réservation de
// son événement. Renvoie la réservation, ou undefined si la réponse d'erreur
// a déjà été envoyée.
const readManagedReservation = async (req: Req, res: Res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  const reservation = await reservationRepository.read(Number(req.params.id));
  if (!reservation) {
    res.sendStatus(404);
    return undefined;
  }

  const isAuthor = reservation.reservation_id_user === req.user.id;
  const [event] = await eventRepository.readEventHostId(
    reservation.reservation_id_event,
  );
  const isHost = event?.event_id_host === req.user.id;

  if (!isAuthor && !isHost) {
    res
      .status(403)
      .json({ message: "Vous ne pouvez pas gérer cette réservation." });
    return undefined;
  }

  return reservation;
};

const updateReservation: RequestHandler = async (req, res, next) => {
  try {
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
      // multer a déjà écrit l'image sur disque : on ne la garde pas.
      if (req.file) fs.rmSync(req.file.path, { force: true });
      res.status(400).json({ message: "Veuillez remplir tous les champs." });
      return;
    }

    const reservation = await readManagedReservation(req, res);
    if (!reservation) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      return;
    }

    const invalidMessage = await validateReservationFields(
      reservation.reservation_id_event,
      req.body,
    );
    if (invalidMessage) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      res.status(400).json({ message: invalidMessage });
      return;
    }

    const reservation_picture = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const result = await reservationRepository.updateReservation(
      reservation.reservation_id,
      {
        reservation_name,
        reservation_date,
        reservation_location,
        reservation_description,
        reservation_link: sanitizeLink(req.body.reservation_link),
        reservation_picture,
      },
    );
    // L'ancienne image n'est effacée que si une nouvelle la remplace.
    if (req.file) await removeUpload(reservation.reservation_picture);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteReservation: RequestHandler = async (req, res, next) => {
  try {
    const reservation = await readManagedReservation(req, res);
    if (!reservation) return;

    await reservationRepository.deleteReservation(reservation.reservation_id);
    await removeUpload(reservation.reservation_picture);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export default {
  browse,
  readLimit,
  readAllReservation,
  addReservation,
  updateReservation,
  deleteReservation,
};
