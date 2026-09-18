import mysql from "../../../database/client";

type Reservation = {
  reservation_id_event: number;
  reservation_id_user: number;
  reservation_name: string;
  reservation_date: string;
  reservation_location: string;
  reservation_description: string;
  reservation_picture: string | null;
};

class reservationRepository {
  async readReservationDescriptionEvent(eventId: number) {
    const [rows] = await mysql.query(
      `
      SELECT
  e.event_id,
  u.user_name,
  r.reservation_location,
  r.reservation_date,
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

      ORDER BY reservation_date ASC, reservation_id ASC;
      `,
      [eventId],
    );

    return rows;
  }
  async addReservation(reservation: Reservation) {
    const [results] = await mysql.query(
      `
    INSERT INTO reservation (
      reservation_id_event,
      reservation_id_user,
      reservation_name,
      reservation_date,
      reservation_location,
      reservation_description,
      reservation_picture
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        reservation.reservation_id_event,
        reservation.reservation_id_user,
        reservation.reservation_name,
        reservation.reservation_date,
        reservation.reservation_location,
        reservation.reservation_description,
        reservation.reservation_picture,
      ],
    );

    return results;
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
    reservation: {
      reservation_name: string;
      reservation_date: string;
      reservation_location: string;
      reservation_description: string;
      reservation_picture?: string | null;
    },
  ) {
    const [result] = await mysql.query(
      `
    UPDATE reservation
    SET
      reservation_name = ?,
      reservation_date = ?,
      reservation_location = ?,
      reservation_description = ?,
      reservation_picture = COALESCE(?, reservation_picture)
    WHERE reservation_id = ?
    `,
      [
        reservation.reservation_name,
        reservation.reservation_date,
        reservation.reservation_location,
        reservation.reservation_description,
        reservation.reservation_picture ?? null,
        reservationId,
      ],
    );

    return result;
  }
}

export default new reservationRepository();
