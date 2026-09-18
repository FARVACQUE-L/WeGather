import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";

type User = {
  id: number;
  username: string;
  email: string;
  password: string;
};

type UserRow = {
  user_name: string;
  user_id: number;
  user_username: string;
  user_mail: string;
  user_password: string;
  user_reset_token?: string | null;
  user_reset_expires?: number | null;
  user_is_admin: number;
  user_is_ban: number;
};

class UserRepository {
  async create(user: Omit<User, "id">) {
    const [result] = await databaseClient.query<Result>(
      `INSERT INTO user
      (user_name, user_username, user_mail, user_password, user_profile_picture)
      VALUES (?, ?, ?, ?, ?)`,
      [
        user.username,
        user.username,
        user.email,
        user.password,
        "/assets/images/default-pp.png",
      ],
    );

    return result.insertId;
  }

  async findByEmailOrUsername(identifier: string) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT *
       FROM user
       WHERE user_mail = ? OR user_username = ?`,
      [identifier, identifier],
    );

    return (rows[0] as UserRow) ?? null;
  }

  async read(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM user WHERE user_id = ?",
      [id],
    );

    const user = rows[0] as UserRow;

    if (!user) {
      return null;
    }

    return {
      id: user.user_id,
      username: user.user_username,
      email: user.user_mail,
      password: user.user_password,
    };
  }

  async isBanned(userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT user_is_ban FROM user WHERE user_id = ?",
      [userId],
    );

    return rows[0];
  }

  async readAll() {
    const [rows] = await databaseClient.query<Rows>("SELECT * FROM user");

    return (rows as UserRow[]).map((user) => ({
      id: user.user_id,
      username: user.user_username,
      email: user.user_mail,
      password: user.user_password,
    }));
  }
  async readUserName(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT user_username FROM user WHERE user_id = ?",
      [id],
    );
    const user = rows[0] as UserRow;

    if (!user) {
      return null;
    }

    return {
      username: user.user_username,
    };
  }
  async readUserDescriptionEvent(eventId: number) {
    const [rows] = await databaseClient.query(
      `
      SELECT 
      e.event_name,
      e.event_description,
      e.event_link_key,
        count(distinct euj.euj_id_user) AS total_users,
        COUNT(distinct r.reservation_id) AS total_reservations,
        COALESCE(SUM(distinct b.budget_price), 0) AS total_budgets
      FROM event AS e
      LEFT JOIN event_user_joining AS euj
        ON euj.euj_id_event = e.event_id
      LEFT JOIN reservation AS r
        ON r.reservation_id_event = e.event_id
      LEFT JOIN budget AS b
        ON b.budget_id_event = e.event_id
      WHERE e.event_id = ?
      GROUP BY 
        e.event_id, 
        e.event_name, 
        e.event_description,
        e.event_link_key;
      `,
      [eventId],
    );

    return rows;
  }
  async readUserAndBudgetOnDashboard(eventId: number) {
    const [rows] = await databaseClient.query(
      `
        SELECT 
        user_name, 
        budget_price, 
        event_id

        FROM user AS u

        JOIN budget AS b 

        ON u.user_id = b.budget_id_user

        JOIN event AS e

        ON e.event_id = b.budget_id_event

        WHERE e.event_id = ?
      `,
      [eventId],
    );

    return rows;
  }

  async findByResetToken(token: string) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM user WHERE user_reset_token = ?",
      [token],
    );

    return (rows[0] as UserRow) ?? null;
  }

  async saveResetToken(userId: number, token: string, expires: number) {
    await databaseClient.query(
      "UPDATE user SET user_reset_token = ?, user_reset_expires = ? WHERE user_id = ?",
      [token, expires, userId],
    );
  }

  async resetPassword(userId: number, password: string) {
    await databaseClient.query(
      `UPDATE user 
       SET user_password = ?, user_reset_token = NULL, user_reset_expires = NULL 
       WHERE user_id = ?`,
      [password, userId],
    );
  }
  async updatePhoto(userId: number, photoUrl: string) {
    const [result] = await databaseClient.query(
      "UPDATE user SET user_profile_picture = ? WHERE user_id = ?",
      [photoUrl, userId],
    );

    return result;
  }
  async readUserPhoto(userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `
    SELECT user_profile_picture
    FROM user
    WHERE user_id = ?
    `,
      [userId],
    );

    return rows[0];
  }
  async updateUserName(userId: number, userName: string) {
    await databaseClient.query(
      `
    UPDATE user
    SET user_username = ?
    WHERE user_id = ?
    `,
      [userName, userId],
    );
  }

  async readUserAdmin(userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `
    SELECT user_is_admin
    FROM user
    WHERE user_id = ?
    `,
      [userId],
    );

    return rows[0];
  }
  async readUserJoinEvent(eventId: number) {
    const [rows] = await databaseClient.query(
      `
      SELECT user_username, user_profile_picture, user_joining_date FROM user
      JOIN event_user_joining
      ON user_id = euj_id_user
      WHERE euj_id_event = ?;
      `,
      [eventId],
    );

    return rows;
  }
}

export default new UserRepository();
