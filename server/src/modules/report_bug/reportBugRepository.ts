import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";
import type RepBug from "../../types/reportedBug";

class reportBugRepository {
  async readAll() {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM reported_bug",
    );

    return rows as RepBug[];
  }

  async create(
    reported_bug: Omit<
      RepBug,
      "reported_bug_id" | "reported_bug_date" | "reported_bug_is_done"
    >,
    imagePaths: string[],
  ) {
    const connection = await databaseClient.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query<Result>(
        "insert into reported_bug (reported_bug_description, reported_bug_by_id_user) values (?, ?)",
        [
          reported_bug.reported_bug_description,
          reported_bug.reported_bug_by_id_user,
        ],
      );

      const reportId = result.insertId;

      for (const path of imagePaths) {
        await connection.query(
          "insert into reported_bug_image (reported_bug_image_path,reported_bug_image_by_id_reported_bug) values (?, ?)",
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

  async exists(reported_bug_by_id_user: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM reported_bug WHERE reported_bug_by_id_user = ? AND reported_bug_date > NOW() - INTERVAL 24 HOUR",
      [reported_bug_by_id_user],
    );
    return rows.length > 0;
  }
}
export default new reportBugRepository();
