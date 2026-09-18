import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";
import type RepEvent from "../../types/reportedEvent";

class reportEventRepository {
  async readAll() {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM reported_event",
    );

    return rows as RepEvent[];
  }

  async create(
    reported_event: Omit<
      RepEvent,
      "reported_event_id" | "reported_event_date" | "reported_event_is_done"
    >,
    imagePaths: string[],
  ) {
    const connection = await databaseClient.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query<Result>(
        "insert into reported_event (reported_event_id_event, reported_event_description, reported_event_by_id_user) values (?, ?, ?)",
        [
          reported_event.reported_event_id_event,
          reported_event.reported_event_description,
          reported_event.reported_event_by_id_user,
        ],
      );

      const reportId = result.insertId;

      for (const path of imagePaths) {
        await connection.query(
          "insert into reported_event_image (reported_event_image_path, reported_event_image_by_id_reported_event) values (?, ?)",
          [path, reportId],
        );
      }

      await connection.commit();
      return reportId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async exists(
    reported_event_by_id_user: number,
    reported_event_id_event: number,
  ) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM reported_event WHERE reported_event_by_id_user = ? AND reported_event_id_event = ? AND reported_event_date > NOW() - INTERVAL 72 HOUR",
      [reported_event_by_id_user, reported_event_id_event],
    );
    return rows.length > 0;
  }
}
export default new reportEventRepository();
