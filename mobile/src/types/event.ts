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

// GET /api/events/:uuid ajoute le code d'invitation.
export type EventDetail = EventData & {
  event_link_key: string;
};

export type PresenceStatus = "online" | "offline";

// GET /api/events/:uuid/group
export type GroupMember = {
  euj_id_user: number;
  user_username: string;
  user_profile_picture: string | null;
  status?: PresenceStatus;
};

export type Group = {
  host_id: number;
  members: GroupMember[];
};

export type EventFilter = "ongoing" | "finished" | "all";
