export type ReportData = {
  reported_bug_description?: string;
  reported_event_description?: string;
  reported_user_description?: string;

  reported_bug_date?: string;
  reported_event_date?: string;
  reported_user_date?: string;

  images?: string[];

  event_name?: string;
  host_username?: string;

  reported_bug_is_done?: number;
  reported_event_is_done?: number;
  reported_user_is_done?: number;

  user_username?: string;
  user_mail?: string;
  user_profile_picture?: string;

  author_username?: string;
  author_mail?: string;
  author_picture?: string;
  target_username?: string;
  target_picture?: string;
  // Utilisateur signalé, ou organisateur de l'événement signalé, superadmin :
  // son compte ne peut pas être banni.
  target_is_superadmin?: number;

  reported_event_id_event?: number | null;
  reported_user_id_event?: number;
  reported_bug_by_id_user?: number;
  reported_event_by_id_user?: number;
  reported_user_by_id_user?: number;
  reported_user_id_user?: number;
  reported_event_id_host?: number;
};
