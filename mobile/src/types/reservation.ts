// GET /api/reservations/all/:eventUuid (mêmes champs que
// client/src/components/Reservation/reservationWallet.ts).
export type ReservationDocument = {
  document_id: number;
  document_id_reservation: number;
  document_id_user: number;
  document_name: string;
};

export type Reservation = {
  reservation_id: number;
  reservation_id_event: number;
  reservation_id_user: number | null;
  reservation_name: string;
  reservation_type: string;
  reservation_date_start: string;
  reservation_time_start: string | null;
  reservation_date_end: string | null;
  reservation_time_end: string | null;
  reservation_location: string;
  reservation_description: string;
  reservation_link: string | null;
  reservation_picture: string;
  documents: ReservationDocument[];
};
