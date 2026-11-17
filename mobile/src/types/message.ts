// Données renvoyées par GET /api/messages/:eventUuid et par les événements
// Socket.io "new-message" / "message-updated".
export type Reaction = {
  emoji: string;
  users: { user_id: number; user_username: string }[];
};

export type Message = {
  message_id: number;
  message_text: string;
  message_date: string;
  message_edited_at: string | null;
  message_reply_to: number | null;
  message_image: string | null;
  message_link_url: string | null;
  message_link_site: string | null;
  message_link_title: string | null;
  message_link_description: string | null;
  message_link_image: string | null;
  user_id: number;
  user_username: string;
  user_profile_picture: string | null;
  reply_text: string | null;
  reply_image: string | null;
  reply_username: string | null;
  reactions: Reaction[];
};

export const MESSAGE_MAX_LENGTH = 5000;
