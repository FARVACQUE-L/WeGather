// GET /api/gallery/:eventUuid (les plus récentes en premier).
export type Photo = {
  gallery_id: number;
  gallery_id_event: number;
  gallery_id_user: number;
  gallery_link: string;
  gallery_description: string | null;
  gallery_creation_date: string | null;
  event_host_id: number;
  like_count: number | string;
};
