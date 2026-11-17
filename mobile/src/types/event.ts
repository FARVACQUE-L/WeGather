// Données renvoyées par GET /api/events (mêmes champs que client/src/types/Events.ts).
export type EventData = {
  event_id: number;
  event_uuid: string;
  event_id_host: number | null;
  event_name: string;
  event_date_start: string;
  event_date_end: string;
  event_description: string;
  event_location: string;
  event_picture: string;
};

export type EventFilter = "ongoing" | "finished" | "all";
