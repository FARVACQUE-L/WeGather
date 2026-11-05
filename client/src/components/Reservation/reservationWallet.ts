import {
  BedDouble,
  Bookmark,
  type LucideIcon,
  Plane,
  Ticket,
  Utensils,
} from "lucide-react";

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

export const MAX_DOCUMENTS_PER_RESERVATION = 5;
export const ACCEPTED_DOCUMENTS =
  "application/pdf,image/jpeg,image/png,image/webp,image/gif,image/avif";

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

export const shortTime = (time: string | null) => time?.slice(0, 5) ?? null;

export const formatDayHeader = (day: string) => {
  const label = parseDay(day).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

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

export const formatShortDate = (day: string) =>
  parseDay(day).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

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

export const formatCountdown = (day: string, now = new Date()) => {
  const today = parseDay(toDayString(now));
  const days = Math.round(
    (parseDay(day).getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
};
