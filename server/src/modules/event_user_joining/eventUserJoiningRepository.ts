import type { Rows } from "../../../database/client";
import databaseClient from "../../../database/client";
import type EventUserJoin from "../../types/eventUserJoining";

type UserJoinEvent = {
  euj_id_event: number;
  euj_id_user: number;
};

class eventUserJoiningRepository {
  async readAll(euj_id_event: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
        euj_id_user, 
        euj_id_event, 
        user_username, 
        user_profile_picture 
      FROM event_user_joining 
      JOIN user 
        ON event_user_joining.euj_id_user= user.user_id 
      WHERE euj_id_event = ?`,
      [euj_id_event],
    );

    return rows as EventUserJoin[];
  }

  async readBy(id_event: number, id_user: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT 
        euj_id_user, 
        euj_id_event 
      FROM event_user_joining
      WHERE euj_id_event = ? 
      AND euj_id_user = ?`,
      [id_event, id_user],
    );

    return rows as UserJoinEvent[];
  }

  async deleteAll(euj_id_user: number) {
    const [rows] = await databaseClient.query<Rows>(
      "DELETE FROM event_user_joining WHERE euj_id_user = ?",
      [euj_id_user],
    );

    return rows as EventUserJoin[];
  }
}

export default new eventUserJoiningRepository();
