import type { Result, Rows } from "../../../database/client";
import mysql from "../../../database/client";

export type ReservationDocument = {
  document_id: number;
  document_id_reservation: number;
  document_id_user: number;
  document_name: string;
  document_file: string;
  document_creation_date: string;
};

// Document avec l'événement et l'auteur de sa réservation, pour vérifier les
// droits sans requête supplémentaire.
type ReservationDocumentWithOwner = ReservationDocument & {
  reservation_id_event: number;
  reservation_id_user: number;
};

class reservationDocumentRepository {
  // Tous les documents des réservations d'un événement, sans le nom du
  // fichier sur disque : le client n'en a pas besoin.
  async readByEvent(eventId: number) {
    const [rows] = await mysql.query<Rows>(
      `
      SELECT
        d.document_id,
        d.document_id_reservation,
        d.document_id_user,
        d.document_name,
        d.document_creation_date
      FROM reservation_document AS d
      JOIN reservation AS r
        ON r.reservation_id = d.document_id_reservation
      WHERE r.reservation_id_event = ?
      ORDER BY d.document_creation_date ASC, d.document_id ASC
      `,
      [eventId],
    );

    return rows as Omit<ReservationDocument, "document_file">[];
  }

  async read(documentId: number) {
    const [rows] = await mysql.query<Rows>(
      `
      SELECT d.*, r.reservation_id_event, r.reservation_id_user
      FROM reservation_document AS d
      JOIN reservation AS r
        ON r.reservation_id = d.document_id_reservation
      WHERE d.document_id = ?
      `,
      [documentId],
    );

    return rows[0] as ReservationDocumentWithOwner | undefined;
  }

  async countByReservation(reservationId: number) {
    const [rows] = await mysql.query<Rows>(
      "SELECT COUNT(*) AS total FROM reservation_document WHERE document_id_reservation = ?",
      [reservationId],
    );

    return Number(rows[0].total);
  }

  // Fichiers à effacer du disque avant que l'ON DELETE CASCADE ne vide la
  // table, à la suppression d'une réservation ou d'un événement.
  async readFilesByReservation(reservationId: number) {
    const [rows] = await mysql.query<Rows>(
      "SELECT document_file FROM reservation_document WHERE document_id_reservation = ?",
      [reservationId],
    );

    return rows.map((row) => row.document_file as string);
  }

  async readFilesByEvent(eventId: number) {
    const [rows] = await mysql.query<Rows>(
      `
      SELECT d.document_file
      FROM reservation_document AS d
      JOIN reservation AS r
        ON r.reservation_id = d.document_id_reservation
      WHERE r.reservation_id_event = ?
      `,
      [eventId],
    );

    return rows.map((row) => row.document_file as string);
  }

  async create(document: {
    document_id_reservation: number;
    document_id_user: number;
    document_name: string;
    document_file: string;
  }) {
    const [result] = await mysql.query<Result>(
      `
      INSERT INTO reservation_document (
        document_id_reservation,
        document_id_user,
        document_name,
        document_file
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        document.document_id_reservation,
        document.document_id_user,
        document.document_name,
        document.document_file,
      ],
    );

    return result.insertId;
  }

  async delete(documentId: number) {
    await mysql.query<Result>(
      "DELETE FROM reservation_document WHERE document_id = ?",
      [documentId],
    );
  }
}

export default new reservationDocumentRepository();
