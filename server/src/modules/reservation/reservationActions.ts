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

// Valeurs de la colonne reservation_type.
const RESERVATION_TYPES = [
  "hebergement",
  "transport",
  "restaurant",
  "activite",
  "autre",
];

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
// « 14:00 » depuis un <input type="time">, « 14:00:00 » tel que le renvoie
// MySQL.
const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

// Champ facultatif : une chaîne vide du formulaire devient null.
const optionalValue = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

type ReservationExtraFields = {
  reservation_type: string;
  reservation_time_start: string | null;
  reservation_date_end: string | null;
  reservation_time_end: string | null;
};

// Renvoie les champs du wallet normalisés, ou le message d'erreur à afficher.
// Les dates arrivent en « AAAA-MM-JJ » (dateStrings) et les heures en
// « HH:MM » : la comparaison de chaînes suit l'ordre chronologique.
const validateReservationFields = async (
  eventId: number,
  body: Record<string, unknown>,
): Promise<{ message: string } | { fields: ReservationExtraFields }> => {
  const { reservation_name, reservation_date, reservation_location } = body;

  // 255 : taille des colonnes reservation_name et reservation_location.
  if (
    String(reservation_name).length > 255 ||
    String(reservation_location).length > 255
  ) {
    return {
      message: "Le nom et le lieu ne doivent pas dépasser 255 caractères.",
    };
  }

  const type = optionalValue(body.reservation_type) ?? "autre";
  if (!RESERVATION_TYPES.includes(type)) {
    return { message: "Type de réservation inconnu." };
  }

  const dateStart = String(reservation_date);
  const dateEnd = optionalValue(body.reservation_date_end);
  const timeStart = optionalValue(body.reservation_time_start);
  const timeEnd = optionalValue(body.reservation_time_end);
  const [event] = await eventRepository.readEventName(eventId);

  const isInEvent = (date: string) =>
    DATE_FORMAT.test(date) &&
    !!event &&
    date >= event.event_date_start &&
    date <= event.event_date_end;

  if (!isInEvent(dateStart) || (dateEnd && !isInEvent(dateEnd))) {
    return {
      message: "Les dates doivent être comprises dans les dates de l'événement",
    };
  }

  if (
    (timeStart && !TIME_FORMAT.test(timeStart)) ||
    (timeEnd && !TIME_FORMAT.test(timeEnd))
  ) {
    return { message: "Heure invalide." };
  }

  // Sans date de fin, la réservation finit le jour même.
  const endDay = dateEnd ?? dateStart;
  const endsBeforeStart =
    endDay < dateStart ||
    (endDay === dateStart &&
      timeStart !== null &&
      timeEnd !== null &&
      timeEnd.slice(0, 5) <= timeStart.slice(0, 5));

  if (endsBeforeStart) {
    return { message: "La fin doit être après le début." };
  }

  return {
    fields: {
      reservation_type: type,
      reservation_time_start: timeStart,
      // Une date de fin égale au début n'apporte rien : on ne la garde pas.
      reservation_date_end: dateEnd && dateEnd !== dateStart ? dateEnd : null,
      reservation_time_end: timeEnd,
    },
  };
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

    const validation = await validateReservationFields(eventId, req.body);
    if ("message" in validation) {
      fs.rmSync(req.file.path, { force: true });
      res.status(400).json({ message: validation.message });
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
      ...validation.fields,
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

    const validation = await validateReservationFields(
      reservation.reservation_id_event,
      req.body,
    );
    if ("message" in validation) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      res.status(400).json({ message: validation.message });
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
        ...validation.fields,
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
