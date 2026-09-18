import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";
import type EventData from "../../types/event";

const generateLinkKey = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
};

class EventRepository {
  async create(
    event: Omit<EventData, "event_id" | "event_uuid" | "event_link_key">,
  ) {
    const linkKey = generateLinkKey();
    const eventUuid = randomUUID();

    const [result] = await databaseClient.query<Result>(
      "INSERT INTO event (event_name, event_date_start, event_date_end, event_id_host, event_picture, event_description, event_location, event_link_key, event_uuid) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?)",
      [
        event.event_name,
        event.event_date_start,
        event.event_date_end,
        event.event_id_host,
        event.event_picture,
        event.event_description,
        event.event_location,
        linkKey,
        eventUuid,
      ],
    );
    const eventId = result.insertId;

    await this.joinEvent(eventId, event.event_id_host);

    return eventId;
  }
  async read(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `
    SELECT * 
    FROM event 
    WHERE event_id = ?
    AND event_is_ban = FALSE
    `,
      [id],
    );

    return rows[0] as EventData;
  }
  async isUserBanned(eventId: number, userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM event_user_ban WHERE eub_id_event = ? AND eub_id_user = ?",
      [eventId, userId],
    );
    return rows.length > 0;
  }

  async readAll(userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT DISTINCT e.* FROM event e
      LEFT JOIN event_user_joining euj ON euj.euj_id_event = e.event_id
      WHERE (e.event_id_host = ?
      OR euj.euj_id_user = ?)
      AND e.event_is_ban = FALSE
      ORDER BY e.event_date_start ASC`,
      [userId, userId],
    );

    return rows as EventData[];
  }
  async readByLinkKey(linkKey: string) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM event WHERE event_link_key = ?",
      [linkKey],
    );
    return rows[0] as EventData | undefined;
  }

  async joinEvent(eventId: number, userId: number) {
    const [event] = await databaseClient.query<Rows>(
      `
    SELECT event_is_ban
    FROM event
    WHERE event_id = ?
    `,
      [eventId],
    );

    if (!event[0] || event[0].event_is_ban) {
      throw new Error("Cet événement est indisponible");
    }

    const [ban] = await databaseClient.query<Rows>(
      `
    SELECT *
    FROM event_user_ban
    WHERE eub_id_event=? 
    AND eub_id_user=?
    `,
      [eventId, userId],
    );

    if (ban.length) {
      throw new Error("Vous êtes banni de cet événement");
    }

    await databaseClient.query<Result>(
      `
    INSERT INTO event_user_joining
    (euj_id_event,euj_id_user)
    VALUES (?,?)
    `,
      [eventId, userId],
    );
  }
  async update(
    eventId: number,
    event: {
      event_name: string;
      event_date_start: string;
      event_date_end: string;
      event_description: string;
      event_location: string;
      event_picture?: string;
    },
  ) {
    await databaseClient.query<Result>(
      "UPDATE event SET event_name = COALESCE(?, event_name), event_date_start = COALESCE(?, event_date_start), event_date_end = COALESCE(?, event_date_end), event_description = COALESCE(?, event_description), event_location = COALESCE(?, event_location), event_picture = COALESCE (?, event_picture) WHERE event_id = ?",
      [
        event.event_name ?? null,
        event.event_date_start ?? null,
        event.event_date_end ?? null,
        event.event_description ?? null,
        event.event_location ?? null,
        event.event_picture ?? null,
        eventId,
      ],
    );
  }
  async deleteEvent(eventId: number) {
    await databaseClient.query("DELETE FROM budget WHERE budget_id_event = ?", [
      eventId,
    ]);

    await databaseClient.query(
      "DELETE FROM event_user_joining WHERE euj_id_event = ?",
      [eventId],
    );

    await databaseClient.query(
      "DELETE FROM reservation WHERE reservation_id_event = ?",
      [eventId],
    );

    await databaseClient.query(
      "DELETE FROM reported_event WHERE reported_event_id_event = ?",
      [eventId],
    );

    await databaseClient.query(
      "DELETE FROM gallery WHERE gallery_id_event = ?",
      [eventId],
    );

    await databaseClient.query(
      "DELETE FROM message WHERE message_id_event = ?",
      [eventId],
    );

    await databaseClient.query("DELETE FROM todo WHERE todo_id_event = ?", [
      eventId,
    ]);

    await databaseClient.query(
      "DELETE FROM event_user_ban WHERE eub_id_event = ?",
      [eventId],
    );

    const [result] = await databaseClient.query(
      "DELETE FROM event WHERE event_id = ?",
      [eventId],
    );

    return result;
  }
  async readEventHostId(eventId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT event_id_host FROM event WHERE event_id=?;",
      [eventId],
    );
    return rows;
  }
  async readEventName(eventId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT event_name, event_date_start, event_date_end FROM event WHERE event_id=?;",
      [eventId],
    );
    return rows;
  }

  async readByUuid(uuid: string) {
    const [rows] = await databaseClient.query<RowDataPacket[]>(
      "SELECT * FROM event WHERE event_uuid = ? AND event_is_ban = FALSE",
      [uuid],
    );

    return rows[0] as EventData | undefined;
  }

  async readIdByUuid(uuid: string) {
    const [rows] = await databaseClient.query<RowDataPacket[]>(
      "SELECT event_id FROM event WHERE event_uuid = ?",
      [uuid],
    );

    return rows[0]?.event_id as number | undefined;
  }
}

export default new EventRepository();
