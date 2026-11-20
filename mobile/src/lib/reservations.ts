import {
  BedDouble,
  Bookmark,
  type LucideIcon,
  Plane,
  Ticket,
  Utensils,
} from "lucide-react-native";

// Mêmes types que client/src/components/Reservation/reservationWallet.ts.
const RESERVATION_TYPE_INFO: Record<
  string,
  { label: string; Icon: LucideIcon }
> = {
  hebergement: { label: "Hébergement", Icon: BedDouble },
  transport: { label: "Transport", Icon: Plane },
  restaurant: { label: "Restaurant", Icon: Utensils },
  activite: { label: "Activité", Icon: Ticket },
  autre: { label: "Autre", Icon: Bookmark },
};

export const readTypeInfo = (type: string | null | undefined) =>
  RESERVATION_TYPE_INFO[type ?? "autre"] ?? RESERVATION_TYPE_INFO.autre;

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
