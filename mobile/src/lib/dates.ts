const MONTHS = [
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

// Les dates arrivent au format "AAAA-MM-JJ" : on les lit en heure locale
// (new Date("AAAA-MM-JJ") les lirait en UTC).
export const parseDay = (date: string): Date => {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const formatDay = (date: string) => `${parseDay(date).getDate()}`;

export const formatMonth = (date: string) => MONTHS[parseDay(date).getMonth()];

// "20 oct. 2026"
export const formatLongDate = (date: string) =>
  parseDay(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Dates d'un séjour en version courte, comme le tableau de bord du site :
// "12 Déc", "12-14 Déc" ou "28 Déc - 2 Jan".
export const formatStayDates = (start: string, end: string) => {
  const startDate = parseDay(start);
  const endDate = parseDay(end);
  const endMonth = MONTHS[endDate.getMonth()];

  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    if (startDate.getDate() === endDate.getDate()) {
      return `${endDate.getDate()} ${endMonth}`;
    }
    return `${startDate.getDate()}-${endDate.getDate()} ${endMonth}`;
  }

  return `${startDate.getDate()} ${MONTHS[startDate.getMonth()]} - ${endDate.getDate()} ${endMonth}`;
};

// "20/10/2026"
export const formatShortDate = (date: string) =>
  parseDay(date).toLocaleDateString("fr-FR");

// Date d'un ajout, comme le budget du site : "aujourd'hui", "hier",
// "avant-hier", "il y a 5 jours", puis "20/10/2026".
// Reçoit une date complète (ISO), lue en heure locale.
export const formatRelativeDay = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return "";

  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (startOfToday().getTime() - day.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays === 2) return "avant-hier";
  if (diffDays <= 7) return `il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR");
};
