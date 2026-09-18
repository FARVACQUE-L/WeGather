import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";
import type RepUser from "../../types/reportedUser";

class reportUserRepository {
  async create(
    reported_user: Omit<
      RepUser,
      "reported_user_id" | "reported_user_date" | "reported_user_is_done"
    >,
    imagePaths: string[],
  ) {
    const connection = await databaseClient.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query<Result>(
        "insert into reported_user (reported_user_id_user, reported_user_description, reported_user_by_id_user, reported_user_id_event) values (?, ?, ?, ?)",
        [
          reported_user.reported_user_id_user,
          reported_user.reported_user_description,
          reported_user.reported_user_by_id_user,
          reported_user.reported_user_id_event,
        ],
      );

      const reportId = result.insertId;

      for (const path of imagePaths) {
        await connection.query(
          "insert into reported_user_image (reported_user_image_path, reported_user_image_by_id_reported_user) values (?, ?)",
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
    reported_user_by_id_user: number,
    reported_user_id_user: number,
  ) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM reported_user WHERE reported_user_by_id_user = ? AND reported_user_id_user = ? AND reported_user_date > NOW() - INTERVAL 72 HOUR",
      [reported_user_by_id_user, reported_user_id_user],
    );
    return rows.length > 0;
  }
}
export default new reportUserRepository();
