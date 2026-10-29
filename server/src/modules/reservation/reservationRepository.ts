import type { Rows } from "../../../database/client";
import mysql from "../../../database/client";

// Champs du wallet, tous facultatifs sauf le type ('autre' par défaut).
type ReservationSchedule = {
  reservation_type: string;
  reservation_time_start: string | null;
  reservation_date_end: string | null;
  reservation_time_end: string | null;
};

type Reservation = ReservationSchedule & {
  reservation_id_event: number;
  reservation_id_user: number;
  reservation_name: string;
  reservation_date_start: string;
  reservation_location: string;
  reservation_description: string;
  reservation_link: string | null;
  reservation_picture: string | null;
};

class reservationRepository {
  async readReservationDescriptionEvent(eventId: number) {
    const [rows] = await mysql.query(
      `
      SELECT
  e.event_id,
  u.user_id,
  u.user_username,
  r.reservation_type,
  r.reservation_location,
  r.reservation_date_start,
  r.reservation_id
FROM reservation AS r

JOIN user AS u
  ON u.user_id = r.reservation_id_user

JOIN event AS e
  ON e.event_id = r.reservation_id_event

WHERE e.event_id = ?

ORDER BY r.reservation_id DESC;
      `,
      [eventId],
    );

    return rows;
  }
  async readAllReservation(eventId: number) {
    const [rows] = await mysql.query(
      `
      SELECT * FROM reservation

      WHERE reservation_id_event = ?

      ORDER BY
        reservation_date_start ASC,
        reservation_time_start IS NULL,
        reservation_time_start ASC,
        reservation_id ASC;
      `,
      [eventId],
    );

    return rows;
  }
  async countByEvent(eventId: number) {
    const [rows] = await mysql.query<Rows>(
      "SELECT COUNT(*) AS total FROM reservation WHERE reservation_id_event = ?",
      [eventId],
    );

    return Number(rows[0].total);
  }
  async addReservation(reservation: Reservation) {
    const [results] = await mysql.query(
      `
    INSERT INTO reservation (
      reservation_id_event,
      reservation_id_user,
      reservation_name,
      reservation_date_start,
      reservation_location,
      reservation_description,
      reservation_link,
      reservation_picture,
      reservation_type,
      reservation_time_start,
      reservation_date_end,
      reservation_time_end
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        reservation.reservation_id_event,
        reservation.reservation_id_user,
        reservation.reservation_name,
        reservation.reservation_date_start,
        reservation.reservation_location,
        reservation.reservation_description,
        reservation.reservation_link,
        reservation.reservation_picture,
        reservation.reservation_type,
        reservation.reservation_time_start,
        reservation.reservation_date_end,
        reservation.reservation_time_end,
      ],
    );

    return results;
  }
  async read(reservationId: number) {
    const [rows] = await mysql.query<Rows>(
      "SELECT * FROM reservation WHERE reservation_id = ?",
      [reservationId],
    );

    return rows[0] as (Reservation & { reservation_id: number }) | undefined;
  }
  async deleteReservation(reservationId: number) {
    const [result] = await mysql.query(
      `
    DELETE FROM reservation
    WHERE reservation_id = ?
    `,
      [reservationId],
    );

    return result;
  }
  async updateReservation(
    reservationId: number,
    reservation: ReservationSchedule & {
      reservation_name: string;
      reservation_date_start: string;
      reservation_location: string;
      reservation_description: string;
      reservation_link: string | null;
      reservation_picture?: string | null;
    },
  ) {
    const [result] = await mysql.query(
      `
    UPDATE reservation
    SET
      reservation_name = ?,
      reservation_date_start = ?,
      reservation_location = ?,
      reservation_description = ?,
      reservation_link = ?,
      reservation_picture = COALESCE(?, reservation_picture),
      reservation_type = ?,
      reservation_time_start = ?,
      reservation_date_end = ?,
      reservation_time_end = ?
    WHERE reservation_id = ?
    `,
      [
        reservation.reservation_name,
        reservation.reservation_date_start,
        reservation.reservation_location,
        reservation.reservation_description,
        reservation.reservation_link,
        reservation.reservation_picture ?? null,
        reservation.reservation_type,
        reservation.reservation_time_start,
        reservation.reservation_date_end,
        reservation.reservation_time_end,
        reservationId,
      ],
    );

    return result;
  }
}

export default new reservationRepository();
