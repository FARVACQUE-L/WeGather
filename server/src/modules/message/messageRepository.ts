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

    return rows[0];
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
    const [rows] = await mysql.query(
      `${MESSAGE_SELECT}
    WHERE m.message_id_event = ?
    ORDER BY m.message_date ASC;`,
      [eventId],
    );

    return rows;
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
