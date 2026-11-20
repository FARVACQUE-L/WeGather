import {
  BedDouble,
  Bookmark,
  type LucideIcon,
  Plane,
  Ticket,
  Utensils,
} from "lucide-react-native";

import { parseDay } from "@/lib/dates";
import type { Reservation } from "@/types/reservation";

// Mêmes types que client/src/components/Reservation/reservationWallet.ts.
export const RESERVATION_TYPES = [
  "hebergement",
  "transport",
  "restaurant",
  "activite",
  "autre",
] as const;

export type ReservationType = (typeof RESERVATION_TYPES)[number];

type TypeInfo = {
  label: string;
  Icon: LucideIcon;
  // Dégradé de la couverture sans photo et couleur de l'icône (site).
  cover: [string, string];
  color: string;
};

export const RESERVATION_TYPE_INFO: Record<ReservationType, TypeInfo> = {
  hebergement: {
    label: "Hébergement",
    Icon: BedDouble,
    cover: ["#cde5ff", "#7fb3e6"],
    color: "#0b4a7a",
  },
  transport: {
    label: "Transport",
    Icon: Plane,
    cover: ["#ffd6bf", "#ff9d76"],
    color: "#8a3a1c",
  },
  restaurant: {
    label: "Restaurant",
    Icon: Utensils,
    cover: ["#ffe0e6", "#f59ab0"],
    color: "#9f1239",
  },
  activite: {
    label: "Activité",
    Icon: Ticket,
    cover: ["#d1fae5", "#7fd8b0"],
    color: "#047857",
  },
  autre: {
    label: "Autre",
    Icon: Bookmark,
    cover: ["#fbf2ed", "#e3c9bc"],
    color: "#a53b22",
  },
};

export const readTypeInfo = (type: string | null | undefined): TypeInfo =>
  RESERVATION_TYPE_INFO[(type ?? "autre") as ReservationType] ??
  RESERVATION_TYPE_INFO.autre;

// Couleurs des pastilles d'initiales, reprises du tableau de bord du site.
const INITIALS_COLORS = [
  "#0080005c",
  "#fa985f8c",
  "#4a90e266",
  "#a53b2259",
  "#9b59b666",
  "#f1c40f80",
  "#1abc9c66",
  "#e84a8a59",
];

export const initialsColor = (userId: number) =>
  INITIALS_COLORS[userId % INITIALS_COLORS.length];

export const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

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

const LONG_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const WEEKDAYS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];

const toDayString = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const shortTime = (time: string | null) => time?.slice(0, 5) ?? null;

// "12 Déc" sur la pastille de date de la carte.
export const formatBadgeDate = (day: string) => {
  const date = parseDay(day);
  return { day: date.getDate(), month: SHORT_MONTHS[date.getMonth()] };
};

// "14 décembre"
const formatDayMonth = (day: string) => {
  const date = parseDay(day);
  return `${date.getDate()} ${LONG_MONTHS[date.getMonth()]}`;
};

// "Ven. 12 décembre"
export const formatDayHeader = (day: string) =>
  `${WEEKDAYS[parseDay(day).getDay()]} ${formatDayMonth(day)}`;

// Horaires de la carte, mêmes textes que le site.
export const formatSchedule = (reservation: Reservation) => {
  const start = shortTime(reservation.reservation_time_start);
  const end = shortTime(reservation.reservation_time_end);
  const endDay = reservation.reservation_date_end;

  if (endDay) {
    const endDate = formatDayMonth(endDay);
    if (start) return `${start} → ${end ? `${end} le ` : "le "}${endDate}`;
    return `Jusqu'au ${endDate}${end ? ` à ${end}` : ""}`;
  }

  if (start && end) return `${start} → ${end}`;
  if (start) return `À ${start}`;
  if (end) return `Jusqu'à ${end}`;
  return null;
};

// Passée quand sa fin (jour de fin, sinon de début ; heure de fin,
// sinon 23:59) est dépassée.
export const isPastReservation = (
  reservation: Reservation,
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
