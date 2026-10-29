import fs from "node:fs";
import type { RequestHandler } from "express";
import {
  DOCUMENT_FILENAME,
  readDocumentPath,
  removeReservationDocument,
} from "../../helper/removeReservationDocument";
import { detectMimeType } from "../../middleware/upload";
import eventRepository from "../event/eventRepository";
import eventUserJoiningRepository from "../event_user_joining/eventUserJoiningRepository";
import reservationDocumentRepository from "./reservationDocumentRepository";
import reservationRepository from "./reservationRepository";

// Billets aller et retour, confirmation, QR codes : 5 suffisent pour une
// réservation sans transformer le wallet en espace de stockage.
const MAX_DOCUMENTS_PER_RESERVATION = 5;

const isMember = async (eventId: number, userId: number) =>
  (await eventUserJoiningRepository.readBy(eventId, userId)).length > 0;

// multer décode le nom d'origine en latin1 : « é » arrive en « Ã© ».
const readOriginalName = (file: Express.Multer.File) =>
  Buffer.from(file.originalname, "latin1").toString("utf8").slice(0, 255);

const addDocument: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Ajoutez un fichier PDF ou une image." });
      return;
    }

    const reservation = await reservationRepository.read(Number(req.params.id));
    if (!reservation) {
      fs.rmSync(req.file.path, { force: true });
      res.sendStatus(404);
      return;
    }

    // Comme pour les réservations : tout participant peut ajouter un billet.
    if (!(await isMember(reservation.reservation_id_event, req.user.id))) {
      fs.rmSync(req.file.path, { force: true });
      res
        .status(403)
        .json({ message: "Vous n'êtes pas inscrit à cet événement." });
      return;
    }

    if (
      (await reservationDocumentRepository.countByReservation(
        reservation.reservation_id,
      )) >= MAX_DOCUMENTS_PER_RESERVATION
    ) {
      fs.rmSync(req.file.path, { force: true });
      res.status(403).json({
        message: `Une réservation est limitée à ${MAX_DOCUMENTS_PER_RESERVATION} documents.`,
      });
      return;
    }

    const document = {
      document_id_reservation: reservation.reservation_id,
      document_id_user: req.user.id,
      document_name: readOriginalName(req.file),
      document_file: req.file.filename,
    };
    const documentId = await reservationDocumentRepository.create(document);

    res.status(201).json({
      document_id: documentId,
      document_id_reservation: document.document_id_reservation,
      document_id_user: document.document_id_user,
      document_name: document.document_name,
    });
  } catch (error) {
    if (req.file) fs.rmSync(req.file.path, { force: true });
    next(error);
  }
};

// Réservé aux participants de l'événement. Le fichier est stocké sans
// extension : on renvoie son vrai type, relu dans sa signature, et son nom
// d'origine.
const downloadDocument: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const document = await reservationDocumentRepository.read(
      Number(req.params.documentId),
    );
    if (!document || !DOCUMENT_FILENAME.test(document.document_file)) {
      res.status(404).json({ message: "Document introuvable" });
      return;
    }

    if (!(await isMember(document.reservation_id_event, req.user.id))) {
      res
        .status(403)
        .json({ message: "Vous n'êtes pas inscrit à cet événement." });
      return;
    }

    const filePath = readDocumentPath(document.document_file);

    try {
      await fs.promises.access(filePath);
    } catch {
      res.status(404).json({ message: "Document introuvable" });
      return;
    }

    const mimeType = await detectMimeType(filePath);

    res.setHeader("X-Content-Type-Options", "nosniff");
    if (mimeType) {
      res.type(mimeType);
    }
    res.download(filePath, document.document_name);
  } catch (error) {
    next(error);
  }
};

// L'auteur du document et l'hôte de l'événement peuvent le supprimer.
const deleteDocument: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const document = await reservationDocumentRepository.read(
      Number(req.params.documentId),
    );
    if (!document) {
      res.status(404).json({ message: "Document introuvable" });
      return;
    }

    const isAuthor = document.document_id_user === req.user.id;
    const [event] = await eventRepository.readEventHostId(
      document.reservation_id_event,
    );
    const isHost = event?.event_id_host === req.user.id;

    if (!isAuthor && !isHost) {
      res
        .status(403)
        .json({ message: "Vous ne pouvez pas supprimer ce document." });
      return;
    }

    await reservationDocumentRepository.delete(document.document_id);
    await removeReservationDocument(document.document_file);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export default { addDocument, downloadDocument, deleteDocument };
