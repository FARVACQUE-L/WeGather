import type { ResultSetHeader, RowDataPacket } from "mysql2";
import mysql from "../../../database/client";

type UnreadCountRow = RowDataPacket & {
  count: number;
};

type MessageOwnerRow = RowDataPacket & {
  message_id: number;
  message_id_event: number;
  message_id_user: number;
};

// Emojis proposés pour réagir à un message, dans leur ordre d'affichage.
// Aucun autre emoji n'est accepté.
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type ReactionRow = RowDataPacket & {
  message_id: number;
  emoji: string;
  user_id: number;
  user_username: string;
};

// Réactions d'un message, regroupées par emoji avec les personnes qui l'ont
// mis.
export type Reaction = {
  emoji: string;
  users: { user_id: number; user_username: string }[];
};

// Colonnes renvoyées pour chaque message, avec la citation éventuelle : le
// texte et le pseudo du message auquel il répond.
const MESSAGE_SELECT = `SELECT
  m.message_id,
  m.message_text,
  m.message_date,
  m.message_edited_at,
  m.message_reply_to,
  u.user_name,
  u.user_username,
  u.user_id,
  u.user_profile_picture,
  e.event_name,
  r.message_text AS reply_text,
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
  ) {
    const [result] = await mysql.query<ResultSetHeader>(
      `INSERT INTO message (
      message_id_event,
      message_id_user,
      message_text,
      message_reply_to
    )
    VALUES (?, ?, ?, ?)`,
      [eventId, userId, messageText, replyTo],
    );

    return this.readById(result.insertId);
  }

  async readById(messageId: number) {
    const [rows] = await mysql.query<RowDataPacket[]>(
      `${MESSAGE_SELECT}
    WHERE m.message_id = ?`,
      [messageId],
    );

    const [message] = await this.attachReactions(rows);
    return message;
  }

  // Réactions de plusieurs messages, regroupées par message puis par emoji,
  // dans l'ordre de REACTION_EMOJIS.
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

  async attachReactions(messages: RowDataPacket[]) {
    const reactions = await this.readReactions(
      messages.map((message) => message.message_id),
    );

    return messages.map((message) => ({
      ...message,
      reactions: reactions.get(message.message_id) ?? [],
    }));
  }

  // Ajoute la réaction si l'utilisateur ne l'avait pas mise, la retire
  // sinon. Renvoie les réactions à jour du message.
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

  // Événement et auteur d'un message, pour vérifier les droits avant une
  // réponse, une modification ou une suppression.
  async readOwner(messageId: number) {
    const [rows] = await mysql.query<MessageOwnerRow[]>(
      `SELECT message_id, message_id_event, message_id_user
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
