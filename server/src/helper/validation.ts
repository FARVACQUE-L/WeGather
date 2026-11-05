export const LIMITS = {
  eventName: 45,
  eventDescription: 255,
  eventLocation: 100,
  todoName: 255,
  budgetName: 255,
  galleryDescription: 255,
  reportDescription: 255,
  reservationDescription: 255,
  messageText: 5000,
} as const;

export const MAX_PRICE = 99_999_999.99;

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export const asText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const isText = (value: unknown, max: number, min = 1) => {
  const text = asText(value);
  return text.length >= min && text.length <= max;
};

export const isDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !DATE_FORMAT.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const asPrice = (value: unknown) => {
  const price =
    typeof value === "string" && value.trim() !== "" ? Number(value) : value;

  return typeof price === "number" &&
    Number.isFinite(price) &&
    price >= 0 &&
    price <= MAX_PRICE
    ? Math.round(price * 100) / 100
    : null;
};
