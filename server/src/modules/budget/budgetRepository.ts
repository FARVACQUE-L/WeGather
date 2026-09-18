import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";

type Budget = {
  budget_id: number;
  budget_id_event: number;
  budget_id_user: number;
  budget_name: string;
  user_username: string;
  user_name: string;
  budget_price: number;
  budget_creation_date: string;
};

type BudgetByUser = {
  user_id: number;
  user_username: string;
  user_name: string;
  total_price: number;
};

type BudgetTotalEvent = {
  event_id: number;
  event_name: string;
  total_price: number;
};

class budgetRepository {
  async readByEvent(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
        b.budget_id, 
        b.budget_id_event, 
        b.budget_id_user,
        b.budget_name, 
        u.user_username, 
        u.user_name, 
        b.budget_price, 
        b.budget_creation_date
    FROM budget AS b
    JOIN user AS u ON u.user_id = b.budget_id_user
    WHERE b.budget_id_event = ?
    ORDER BY b.budget_creation_date ASC;`,
      [id],
    );

    return rows as Budget[];
  }

  async readAllTotalBudgetByEvent(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
        u.user_id, 
        u.user_username, 
        u.user_name, 
        COALESCE(SUM(b.budget_price), 0) AS total_price 
      FROM event_user_joining AS euj
      JOIN user AS u 
        ON u.user_id = euj.euj_id_user
      LEFT JOIN budget AS b 
        ON b.budget_id_user = euj.euj_id_user
        AND b.budget_id_event = euj.euj_id_event
      WHERE euj.euj_id_event = ?
      GROUP BY 
        u.user_id, u.user_username, u.user_name`,
      [id],
    );
    return rows as BudgetByUser[];
  }

  async readBudgetInfoByUser(id_event: number, id_user: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
        u.user_id, 
        u.user_username, 
        u.user_name, 
        COALESCE(SUM(b.budget_price), 0) AS total_price 
      FROM event_user_joining AS euj
      JOIN user AS u 
        ON u.user_id = euj.euj_id_user
      LEFT JOIN budget AS b 
        ON b.budget_id_user = euj.euj_id_user 
        AND b.budget_id_event = euj.euj_id_event 
      WHERE euj.euj_id_event = ? AND u.user_id = ?
      GROUP BY 
        u.user_id, 
        u.user_username, 
        u.user_name`,
      [id_event, id_user],
    );

    return rows[0] as BudgetByUser;
  }

  async readBudgetInfoEvent(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
        e.event_id, 
        e.event_name,
        COALESCE(SUM(b.budget_price), 0) AS total_price 
      FROM event AS e
      LEFT JOIN budget AS b ON b.budget_id_event = e.event_id
      WHERE e.event_id = ?`,
      [id],
    );

    return rows as BudgetTotalEvent[];
  }

  async create(id_event: number, id_user: number, name: string, price: number) {
    const [result] = await databaseClient.query<Result>(
      `INSERT INTO budget 
        (budget_id_event, 
        budget_id_user, 
        budget_name, 
        budget_price)
      VALUES (?, ?, ?, ?);`,
      [id_event, id_user, name, price],
    );

    return result.insertId;
  }

  async update(id_budget: number, name: string, price: number) {
    const [result] = await databaseClient.query<Result>(
      `
      UPDATE budget
      SET budget.budget_name = ?, 
	      budget.budget_price = ?
      WHERE budget.budget_id = ?`,
      [name, price, id_budget],
    );

    return result.affectedRows;
  }

  async delete(id: number) {
    const [result] = await databaseClient.query<Result>(
      `DELETE FROM budget 
      WHERE budget.budget_id = ?;`,
      [id],
    );

    return result.affectedRows;
  }
}

export default new budgetRepository();
