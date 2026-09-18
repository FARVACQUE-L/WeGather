import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";

type Todo = {
  todo_id: number;
  todo_id_event: number;
  todo_id_user: number;
  todo_name: string;
  todo_creation_date: string | null;
  todo_deadline: string | null;
  todo_is_done: boolean;
};

class TodoRepository {
  async readAll(todo_id_event: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from todo where todo_id_event = ?",
      [todo_id_event],
    );

    return rows as Todo[];
  }

  async create(todo: Omit<Todo, "todo_id" | "todo_creation_date">) {
    const [result] = await databaseClient.query<Result>(
      "insert into todo (todo_id_event, todo_id_user, todo_name, todo_deadline, todo_is_done) values (?, ?, ?, ?, ?)",
      [
        todo.todo_id_event,
        todo.todo_id_user,
        todo.todo_name,
        todo.todo_deadline,
        todo.todo_is_done,
      ],
    );
    return result.insertId;
  }

  async update(todo: Pick<Todo, "todo_id" | "todo_name" | "todo_is_done">) {
    const [result] = await databaseClient.query<Result>(
      "UPDATE todo SET todo_name = ?, todo_is_done = ? WHERE todo_id = ?",
      [todo.todo_name, todo.todo_is_done, todo.todo_id],
    );
    return result.affectedRows;
  }

  async delete(todo_id: number) {
    const [result] = await databaseClient.query<Result>(
      "DELETE from todo WHERE todo_id = ?",
      [todo_id],
    );
    return result.affectedRows;
  }
}

export default new TodoRepository();
