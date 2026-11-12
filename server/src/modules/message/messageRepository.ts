import type { ResultSetHeader, RowDataPacket } from "mysql2";
import mysql from "../../../database/client";
import type { LinkPreview } from "../../helper/linkPreview";

type UnreadCountRow = RowDataPacket & {
  count: number;
};

type MessageOwnerRow = RowDataPacket & {
  message_id: number;
  message_id_event: number;
  message_id_user: number;
  message_image: string | null;
};

type MessageRow = RowDataPacket & {
  message_id: number;
  message_link_url: string | null;
};

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type ReactionRow = RowDataPacket & {
  message_id: number;
  emoji: string;
  user_id: number;
  user_username: string;
};

export type Reaction = {
  emoji: string;
  users: { user_id: number; user_username: string }[];
};

const MESSAGE_SELECT = `SELECT
  m.message_id,
  m.message_text,
  m.message_date,
  m.message_edited_at,
  m.message_reply_to,
  m.message_image,
  m.message_link_url,
  m.message_link_site,
  m.message_link_title,
  m.message_link_description,
  m.message_link_image,
  u.user_name,
  u.user_username,
  u.user_id,
  u.user_profile_picture,
  e.event_name,
  r.message_text AS reply_text,
  r.message_image AS reply_image,
  ru.user_username AS reply_username
FROM message AS m
JOIN user AS u
  ON m.message_id_user = u.user_id
JOIN event AS e
  ON m.message_id_event = e.event_id
LEFT JOIN message AS r
  ON m.message_reply_to = r.message_id
LEFT JOIN user AS ru
  ON r.message_id_user = ru.user_id`;

class MessageRepository {
  async sendMessage(
    eventId: number,
    userId: number,
    messageText: string,
    replyTo: number | null,
    image: string | null,
  ) {
    const [result] = await mysql.query<ResultSetHeader>(
      `INSERT INTO message (
      message_id_event,
      message_id_user,
      message_text,
      message_reply_to,
      message_image
    )
    VALUES (?, ?, ?, ?, ?)`,
      [eventId, userId, messageText, replyTo, image],
    );

    return this.readById(result.insertId);
  }

  async readById(messageId: number) {
    const [rows] = await mysql.query<MessageRow[]>(
      `${MESSAGE_SELECT}
    WHERE m.message_id = ?`,
      [messageId],
    );

    const [message] = await this.attachReactions(rows);
    return message;
  }

  async readReactions(messageIds: number[]) {
    const reactions = new Map<number, Reaction[]>();
    if (messageIds.length === 0) return reactions;

    const [rows] = await mysql.query<ReactionRow[]>(
      `SELECT
      mr.message_reaction_id_message AS message_id,
      mr.message_reaction_emoji AS emoji,
      u.user_id,
      u.user_username
    FROM message_reaction AS mr
    JOIN user AS u
      ON mr.message_reaction_id_user = u.user_id
    WHERE mr.message_reaction_id_message IN (?)
    ORDER BY mr.message_reaction_id ASC`,
      [messageIds],
    );

    for (const row of rows) {
      const messageReactions = reactions.get(row.message_id) ?? [];
      let reaction = messageReactions.find((r) => r.emoji === row.emoji);

      if (!reaction) {
        reaction = { emoji: row.emoji, users: [] };
        messageReactions.push(reaction);
      }

      reaction.users.push({
        user_id: row.user_id,
        user_username: row.user_username,
      });
      reactions.set(row.message_id, messageReactions);
    }

    for (const messageReactions of reactions.values()) {
      messageReactions.sort(
        (a, b) =>
          REACTION_EMOJIS.indexOf(a.emoji) - REACTION_EMOJIS.indexOf(b.emoji),
      );
    }

    return reactions;
  }

  async attachReactions<T extends RowDataPacket>(messages: T[]) {
    const reactions = await this.readReactions(
      messages.map((message) => message.message_id),
    );

    return messages.map((message) => ({
      ...message,
      reactions: reactions.get(message.message_id) ?? [],
    }));
  }

  async toggleReaction(messageId: number, userId: number, emoji: string) {
    const [deleted] = await mysql.query<ResultSetHeader>(
      `DELETE FROM message_reaction
    WHERE message_reaction_id_message = ?
      AND message_reaction_id_user = ?
      AND message_reaction_emoji = ?`,
      [messageId, userId, emoji],
    );

    if (deleted.affectedRows === 0) {
      await mysql.query<ResultSetHeader>(
        `INSERT IGNORE INTO message_reaction (
        message_reaction_id_message,
        message_reaction_id_user,
        message_reaction_emoji
      )
      VALUES (?, ?, ?)`,
        [messageId, userId, emoji],
      );
    }

    const reactions = await this.readReactions([messageId]);
    return reactions.get(messageId) ?? [];
  }

  async readOwner(messageId: number) {
    const [rows] = await mysql.query<MessageOwnerRow[]>(
      `SELECT message_id, message_id_event, message_id_user, message_image
    FROM message
    WHERE message_id = ?`,
      [messageId],
    );

    return rows[0] as MessageOwnerRow | undefined;
  }

  async update(messageId: number, messageText: string) {
    await mysql.query<ResultSetHeader>(
      `UPDATE message
    SET message_text = ?, message_edited_at = NOW()
    WHERE message_id = ?`,
      [messageText, messageId],
    );

    return this.readById(messageId);
  }

  // N'écrit que si le texte n'a pas changé entre-temps : une modification
  // du message pendant la récupération de l'aperçu garde la priorité.
  async saveLinkPreview(
    messageId: number,
    messageText: string,
    preview: LinkPreview | null,
  ) {
    const [result] = await mysql.query<ResultSetHeader>(
      `UPDATE message
    SET message_link_url = ?,
      message_link_site = ?,
      message_link_title = ?,
      message_link_description = ?,
      message_link_image = ?
    WHERE message_id = ? AND message_text = ?`,
      [
        preview?.url ?? null,
        preview?.site ?? null,
        preview?.title ?? null,
        preview?.description ?? null,
        preview?.image ?? null,
        messageId,
        messageText,
      ],
    );

    return result.affectedRows > 0 ? this.readById(messageId) : null;
  }

  async delete(messageId: number) {
    await mysql.query<ResultSetHeader>(
      "DELETE FROM message WHERE message_id = ?",
      [messageId],
    );
  }

  async getMessagesByEventId(eventId: number) {
    const [rows] = await mysql.query<RowDataPacket[]>(
      `${MESSAGE_SELECT}
    WHERE m.message_id_event = ?
    ORDER BY m.message_date ASC;`,
      [eventId],
    );

    return this.attachReactions(rows);
  }
  async notificationMessage(eventId: number, userId: number) {
    const [result] = await mysql.query(
      `INSERT INTO message_read (
      message_read_id_message,
      message_read_user_id
    )
    SELECT
      m.message_id,
      ?
    FROM message m
    LEFT JOIN message_read mr
      ON mr.message_read_id_message = m.message_id
      AND mr.message_read_user_id = ?
    WHERE
      m.message_id_event = ?
      AND m.message_id_user <> ?
      AND mr.message_read_id_message IS NULL;`,
      [userId, userId, eventId, userId],
    );

    return result;
  }
  async getUnreadMessages(eventId: number, userId: number) {
    const [rows] = await mysql.query<UnreadCountRow[]>(
      `SELECT COUNT(*) AS count
    FROM message m
    LEFT JOIN message_read mr
      ON mr.message_read_id_message = m.message_id
      AND mr.message_read_user_id = ?
    WHERE m.message_id_event = ?
      AND m.message_id_user <> ?
      AND mr.message_read_id_message IS NULL;`,
      [userId, eventId, userId],
    );

    return rows[0].count;
  }
}
export default new MessageRepository();
