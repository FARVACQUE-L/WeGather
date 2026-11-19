// GET /api/reservations/:eventUuid (les plus récentes en premier).
export type ReservationSummary = {
  reservation_id: number;
  user_id: number;
  user_username: string;
  reservation_type: string;
  reservation_location: string;
  reservation_date_start: string;
};

// GET /api/budget/:eventUuid/totalUsers : total dépensé par membre.
export type MemberSpending = {
  user_id: number;
  user_username: string;
  total_price: number | string;
};

// GET /api/todo/:eventUuid (todo_is_done vaut 0 ou 1 en base).
export type Todo = {
  todo_id: number;
  todo_name: string;
  todo_is_done: boolean | number;
};

export const TODO_MAX_LENGTH = 255;

// GET /api/gallery/:eventUuid (les plus récentes en premier).
export type GalleryPhoto = {
  gallery_id: number;
  gallery_link: string;
  gallery_description: string | null;
};
