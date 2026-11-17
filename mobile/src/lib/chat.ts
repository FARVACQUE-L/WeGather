import type { Message } from "@/types/message";

// "2026-11-12 15:59:44" (heure du serveur) lu en heure locale.
export const parseDateTime = (value: string): Date => {
  const [date, time = "00:00:00"] = value.split(/[ T]/);
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, Math.floor(seconds));
};

export const formatHour = (value: string) => {
  const date = parseDateTime(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatDayLabel = (value: string) => {
  const date = parseDateTime(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameDay(date, today)) return "Aujourd'hui";
  if (sameDay(date, yesterday)) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

const dayKey = (value: string) => value.slice(0, 10);

export type ChatItem =
  | { type: "day"; key: string; label: string }
  | {
      type: "message";
      key: string;
      message: Message;
      // Premier / dernier message d'une suite envoyée par la même
      // personne le même jour : on n'affiche le pseudo qu'au début
      // et l'avatar qu'à la fin.
      isFirstOfGroup: boolean;
      isLastOfGroup: boolean;
    };

// Construit la liste affichée, du plus récent au plus ancien
// (la FlatList du chat est inversée).
export const buildChatItems = (messages: Message[]): ChatItem[] => {
  const items: ChatItem[] = [];

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const newDay =
      !previous ||
      dayKey(previous.message_date) !== dayKey(message.message_date);

    if (newDay) {
      items.push({
        type: "day",
        key: `day-${dayKey(message.message_date)}`,
        label: formatDayLabel(message.message_date),
      });
    }

    items.push({
      type: "message",
      key: `message-${message.message_id}`,
      message,
      isFirstOfGroup: newDay || previous.user_id !== message.user_id,
      isLastOfGroup:
        !next ||
        next.user_id !== message.user_id ||
        dayKey(next.message_date) !== dayKey(message.message_date),
    });
  });

  return items.reverse();
};
