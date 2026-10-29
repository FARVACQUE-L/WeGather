import {
  BedDouble,
  Bookmark,
  type LucideIcon,
  Plane,
  Ticket,
  Utensils,
} from "lucide-react";

// Valeurs de la colonne reservation_type, dans l'ordre des filtres.
export const RESERVATION_TYPES = [
  "hebergement",
  "transport",
  "restaurant",
  "activite",
  "autre",
] as const;

export type ReservationType = (typeof RESERVATION_TYPES)[number];

export const RESERVATION_TYPE_INFO: Record<
  ReservationType,
  { label: string; Icon: LucideIcon }
> = {
  hebergement: { label: "Hébergement", Icon: BedDouble },
  transport: { label: "Transport", Icon: Plane },
  restaurant: { label: "Restaurant", Icon: Utensils },
  activite: { label: "Activité", Icon: Ticket },
  autre: { label: "Autre", Icon: Bookmark },
};

export const readTypeInfo = (type: string | null | undefined) =>
  RESERVATION_TYPE_INFO[(type as ReservationType) ?? "autre"] ??
  RESERVATION_TYPE_INFO.autre;

export type ReservationDocument = {
  document_id: number;
  document_id_reservation: number;
  document_id_user: number;
  document_name: string;
};

export type WalletReservation = {
  reservation_id: number;
  reservation_id_event: number;
  reservation_id_user: number | null;
  reservation_name: string;
  reservation_type: ReservationType;
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

// Mêmes limites que le serveur (reservationDocumentActions.ts, upload.ts).
export const MAX_DOCUMENTS_PER_RESERVATION = 5;
export const ACCEPTED_DOCUMENTS =
  "application/pdf,image/jpeg,image/png,image/webp,image/gif,image/avif";

// Les dates arrivent en « AAAA-MM-JJ ». new Date("2026-06-28") les lirait en
// UTC et afficherait la veille à l'ouest de Greenwich : on construit la date
// en heure locale.
export const parseDay = (day: string) => {
  const [year, month, date] = day.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, date);
};

const toDayString = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

// « 14:00:00 » (MySQL) → « 14:00 ».
export const shortTime = (time: string | null) => time?.slice(0, 5) ?? null;

// « Sam. 28 juin », en-tête d'une journée du wallet.
export const formatDayHeader = (day: string) => {
  const label = parseDay(day).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

// Pastille de date sur l'image, comme celle des cartes d'événement
// (CardEvents.tsx) : « 28 » et « Juin ».
const SHORT_MONTHS = [
  "Jan",
  "Fév",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
];

export const formatBadgeDate = (day: string) => {
  const date = parseDay(day);
  return { day: date.getDate(), month: SHORT_MONTHS[date.getMonth()] };
};

// « 30 juin ».
export const formatShortDate = (day: string) =>
  parseDay(day).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

// Horaires sous le nom de la réservation, null s'il n'y a rien à ajouter à
// l'en-tête de la journée : « 14:00 → 16:00 », « À 20:30 »,
// « 15:00 → 11:00 le 30 juin », « Jusqu'au 30 juin ».
export const formatSchedule = (reservation: WalletReservation) => {
  const start = shortTime(reservation.reservation_time_start);
  const end = shortTime(reservation.reservation_time_end);
  const endDay = reservation.reservation_date_end;

  if (endDay) {
    const endDate = formatShortDate(endDay);
    if (start) return `${start} → ${end ? `${end} le ` : "le "}${endDate}`;
    return `Jusqu'au ${endDate}${end ? ` à ${end}` : ""}`;
  }

  if (start && end) return `${start} → ${end}`;
  if (start) return `À ${start}`;
  if (end) return `Jusqu'à ${end}`;
  return null;
};

// Une réservation est passée une fois sa fin dépassée : la fin de sa
// journée de fin si aucune heure n'est donnée.
export const isPastReservation = (
  reservation: WalletReservation,
  now = new Date(),
) => {
  const endDay =
    reservation.reservation_date_end ?? reservation.reservation_date_start;
  const endTime = shortTime(reservation.reservation_time_end) ?? "23:59";
  const nowKey = `${toDayString(now)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return `${endDay.slice(0, 10)} ${endTime}` < nowKey;
};

// « Aujourd'hui », « Demain », « Dans 3 jours ».
export const formatCountdown = (day: string, now = new Date()) => {
  const today = parseDay(toDayString(now));
  const days = Math.round(
    (parseDay(day).getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
};

// Réservations regroupées par jour de début, dans l'ordre reçu (le serveur
// trie déjà par date puis par heure).
export const groupByDay = (reservations: WalletReservation[]) => {
  const days = new Map<string, WalletReservation[]>();

  for (const reservation of reservations) {
    const day = reservation.reservation_date_start.slice(0, 10);
    days.set(day, [...(days.get(day) ?? []), reservation]);
  }

  return [...days.entries()].map(([day, items]) => ({ day, items }));
};
