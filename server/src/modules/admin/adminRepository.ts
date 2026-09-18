import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";

class AdminRepository {
  async readAllUser() {
    const [rows] = await databaseClient.query(`SELECT user_id FROM user
`);
    return rows;
  }
  async readAllEvent() {
    const [rows] = await databaseClient.query(`SELECT event_id FROM event
`);
    return rows;
  }
  async readArrayReport() {
    const [rows] = await databaseClient.query(`SELECT
    u.user_name,
    'user' AS report_type,
    ru.reported_user_description AS description,
    ru.reported_user_date AS report_date
FROM reported_user AS ru
JOIN user AS u
    ON u.user_id = ru.reported_user_by_id_user

UNION ALL

SELECT
    u.user_name,
    'event' AS report_type,
    re.reported_event_description AS description,
    re.reported_event_date AS report_date
FROM reported_event AS re
JOIN user AS u
    ON u.user_id = re.reported_event_by_id_user

UNION ALL

SELECT
    u.user_name,
    'bug' AS report_type,
    rb.reported_bug_description AS description,
    rb.reported_bug_date AS report_date
FROM reported_bug AS rb
JOIN user AS u
    ON u.user_id = rb.reported_bug_by_id_user

ORDER BY report_date DESC;
`);
    return rows;
  }
  async readArrayUser() {
    const [rows] =
      await databaseClient.query(`SELECT user_name, user_id, user_profile_picture, user_username, user_joining_date
FROM user
`);
    return rows;
  }
  async readDashboardChart(year: number) {
    const [rows] = await databaseClient.query<Rows>(
      `
    SELECT
      month_number,
      month,
      SUM(users) AS users,
      SUM(events) AS events,
      SUM(reports) AS reports
    FROM (
      SELECT
        MONTH(user_joining_date) AS month_number,
        DATE_FORMAT(user_joining_date, '%b') AS month,
        COUNT(user_id) AS users,
        0 AS events,
        0 AS reports
      FROM user
      WHERE YEAR(user_joining_date) = ?
      GROUP BY MONTH(user_joining_date), DATE_FORMAT(user_joining_date, '%b')

      UNION ALL

      SELECT
        MONTH(event_creation_date) AS month_number,
        DATE_FORMAT(event_creation_date, '%b') AS month,
        0 AS users,
        COUNT(event_id) AS events,
        0 AS reports
      FROM event
      WHERE YEAR(event_creation_date) = ?
      GROUP BY MONTH(event_creation_date), DATE_FORMAT(event_creation_date, '%b')

      UNION ALL

      SELECT
        MONTH(report_date) AS month_number,
        DATE_FORMAT(report_date, '%b') AS month,
        0 AS users,
        0 AS events,
        COUNT(*) AS reports
      FROM (
        SELECT reported_user_date AS report_date FROM reported_user
        UNION ALL
        SELECT reported_event_date AS report_date FROM reported_event
        UNION ALL
        SELECT reported_bug_date AS report_date FROM reported_bug
      ) AS all_reports
      WHERE YEAR(report_date) = ?
      GROUP BY MONTH(report_date), DATE_FORMAT(report_date, '%b')
    ) AS dashboard_data
    GROUP BY month_number, month
    ORDER BY month_number;
    `,
      [year, year, year],
    );

    return rows;
  }

  async readAvailableYears() {
    const [rows] = await databaseClient.query<Rows>(`
    SELECT YEAR(user_joining_date) AS year FROM user
    UNION
    SELECT YEAR(event_creation_date) FROM event
    UNION
    SELECT YEAR(reported_user_date) FROM reported_user
    UNION
    SELECT YEAR(reported_event_date) FROM reported_event
    UNION
    SELECT YEAR(reported_bug_date) FROM reported_bug
    ORDER BY year DESC;
  `);

    return rows;
  }
  async readReportUser() {
    const [rows] = await databaseClient.query(
      `SELECT
      ru.*, 
      u.user_username AS username, 
      u.user_mail AS email 
      FROM reported_user AS ru 
      JOIN user AS u ON u.user_id = ru.reported_user_by_id_user 
      ORDER BY ru.reported_user_date DESC`,
    );
    return rows;
  }
  async readReportBug() {
    const [rows] = await databaseClient.query(
      `SELECT
      rb.*, u.user_username AS username,
      u.user_mail AS email
    FROM reported_bug AS rb
    JOIN user AS u ON u.user_id = rb.reported_bug_by_id_user
    ORDER BY rb.reported_bug_date DESC`,
    );
    return rows;
  }
  async readReportEvent() {
    const [rows] = await databaseClient.query(
      `SELECT
      re.*,
      u.user_username AS username,
      u.user_mail AS email
    FROM reported_event AS re
    JOIN user AS u ON u.user_id = re.reported_event_by_id_user
    ORDER BY re.reported_event_date DESC`,
    );
    return rows;
  }
  async readReportBugById(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
      rb.*,
      u.user_username,
      u.user_mail,
      u.user_profile_picture
    FROM reported_bug AS rb
    JOIN user AS u ON u.user_id = rb.reported_bug_by_id_user
    WHERE rb.reported_bug_id = ?`,
      [id],
    );

    const report = rows[0];
    if (!report) return undefined;

    const [images] = await databaseClient.query<Rows>(
      `SELECT reported_bug_image_path
     FROM reported_bug_image
     WHERE reported_bug_image_by_id_reported_bug = ?`,
      [id],
    );

    return {
      ...report,
      images: images.map((img) => img.reported_bug_image_path),
    };
  }

  async readReportEventById(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
    re.*,
    e.event_id_host,
    e.event_name,
    host.user_username AS host_username,
    u.user_username,
    u.user_mail,
    u.user_profile_picture
  FROM reported_event AS re
  JOIN user AS u ON u.user_id = re.reported_event_by_id_user
  JOIN event AS e ON e.event_id = re.reported_event_id_event
  JOIN user AS host ON host.user_id = e.event_id_host
  WHERE re.reported_event_id = ?`,
      [id],
    );

    const report = rows[0];
    if (!report) return undefined;

    const [images] = await databaseClient.query<Rows>(
      `SELECT reported_event_image_path
     FROM reported_event_image
     WHERE reported_event_image_by_id_reported_event = ?`,
      [id],
    );

    return {
      ...report,
      images: images.map((img) => img.reported_event_image_path),
    };
  }

  async readReportUserById(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
      ru.*,
      author.user_username AS author_username,
      author.user_mail AS author_mail,
      author.user_profile_picture AS author_picture,
      target.user_username AS target_username,
      target.user_profile_picture AS target_picture
    FROM reported_user AS ru
    JOIN user AS author ON author.user_id = ru.reported_user_by_id_user
    JOIN user AS target ON target.user_id = ru.reported_user_id_user
    WHERE ru.reported_user_id = ?`,
      [id],
    );

    const report = rows[0];
    if (!report) return undefined;

    const [images] = await databaseClient.query<Rows>(
      `SELECT reported_user_image_path
     FROM reported_user_image
     WHERE reported_user_image_by_id_reported_user = ?`,
      [id],
    );

    return {
      ...report,
      images: images.map((img) => img.reported_user_image_path),
    };
  }

  async markBugAsDone(id: number) {
    const [result] = await databaseClient.query<Result>(
      "UPDATE reported_bug SET reported_bug_is_done = TRUE WHERE reported_bug_id = ?",
      [id],
    );
    return result.affectedRows;
  }

  async markEventAsDone(id: number) {
    const [result] = await databaseClient.query<Result>(
      "UPDATE reported_event SET reported_event_is_done = TRUE WHERE reported_event_id = ?",
      [id],
    );
    return result.affectedRows;
  }

  async markUserAsDone(id: number) {
    const [result] = await databaseClient.query<Result>(
      "UPDATE reported_user SET reported_user_is_done = TRUE WHERE reported_user_id = ?",
      [id],
    );
    return result.affectedRows;
  }

  async banUser(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT user_mail, user_username FROM user WHERE user_id = ?",
      [id],
    );
    const user = rows[0];
    if (!user) return null;

    await databaseClient.query<Result>(
      "UPDATE user SET user_is_ban = TRUE WHERE user_id = ?",
      [id],
    );

    return user;
  }

  async banUserFromEvent(eventId: number, userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT user_mail, user_username FROM user WHERE user_id = ?",
      [userId],
    );
    const user = rows[0];
    if (!user) return null;

    await databaseClient.query<Result>(
      "INSERT IGNORE INTO event_user_ban (eub_id_event, eub_id_user) VALUES (?, ?)",
      [eventId, userId],
    );

    await databaseClient.query<Result>(
      "DELETE FROM event_user_joining WHERE euj_id_event = ? AND euj_id_user = ?",
      [eventId, userId],
    );

    return user;
  }

  async banEvent(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT e.event_name, u.user_mail, u.user_username
     FROM event AS e
     JOIN user AS u ON u.user_id = e.event_id_host
     WHERE e.event_id = ?`,
      [id],
    );
    const data = rows[0];
    if (!data) return null;

    await databaseClient.query<Result>(
      "UPDATE event SET event_is_ban = TRUE WHERE event_id = ?",
      [id],
    );

    return data;
  }
}

export default new AdminRepository();
