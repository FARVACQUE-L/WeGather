import type { Result, Rows } from "../../../database/client";
import databaseClient from "../../../database/client";

type Gallery = {
  gallery_id: number;
  gallery_id_event: number;
  gallery_id_user: number;
  gallery_link: string;
  gallery_description: string | null;
  gallery_creation_date: string | null;
};

class GalleryRepository {
  async readAll(gallery_id_event: number) {
    const [rows] = await databaseClient.query<Rows>(
      `
      SELECT g.*, COUNT(gl.gallery_like_id_user) AS like_count 
      FROM gallery g
      LEFT JOIN gallery_like gl ON g.gallery_id = gl.gallery_like_id_gallery
      WHERE g.gallery_id_event = ?
      GROUP BY g.gallery_id
      ORDER BY g.gallery_creation_date DESC
      `,
      [gallery_id_event],
    );

    return rows;
  }

  async read(gallery_id: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM gallery WHERE gallery_id = ?",
      [gallery_id],
    );
    return rows[0] as Gallery | undefined;
  }

  async create(gallery: Omit<Gallery, "gallery_id" | "gallery_creation_date">) {
    const [result] = await databaseClient.query<Result>(
      `INSERT INTO gallery (
          gallery_id_event,
          gallery_id_user,
          gallery_link,
          gallery_description
        )
        VALUES (?, ?, ?, ?)`,
      [
        gallery.gallery_id_event,
        gallery.gallery_id_user,
        gallery.gallery_link,
        gallery.gallery_description,
      ],
    );

    return result.insertId;
  }

  async delete(gallery_id: number) {
    const [result] = await databaseClient.query<Result>(
      "DELETE FROM gallery WHERE gallery_id = ?",
      [gallery_id],
    );

    return result.affectedRows;
  }

  async updateDescription(gallery_id: number, gallery_description: string) {
    const [result] = await databaseClient.query<Result>(
      "UPDATE gallery SET gallery_description = ? WHERE gallery_id = ?",
      [gallery_description, gallery_id],
    );

    return result.affectedRows;
  }

  async checkUserPermissions(gallery_id_event: number, user_id: number) {
    const [eventRows] = await databaseClient.query<Rows>(
      "SELECT event_id_host FROM event WHERE event_id = ?",
      [gallery_id_event],
    );
    const isHost =
      eventRows.length > 0 && eventRows[0].event_id_host === user_id;

    const [joiningRows] = await databaseClient.query<Rows>(
      "SELECT COUNT(*) AS total FROM event_user_joining WHERE euj_id_event = ? AND euj_id_user = ?",
      [gallery_id_event, user_id],
    );
    const isParticipant = joiningRows.length > 0 && joiningRows[0].total > 0;

    return {
      isHost,
      isParticipant: isParticipant || isHost,
    };
  }

  async checkIfUserLiked(galleryId: number, userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM gallery_like WHERE gallery_like_id_gallery = ? AND gallery_like_id_user = ?",
      [galleryId, userId],
    );
    return rows.length > 0;
  }

  async insertLike(galleryId: number, userId: number) {
    const [result] = await databaseClient.query<Result>(
      "INSERT INTO gallery_like (gallery_like_id_gallery, gallery_like_id_user) VALUES (?, ?)",
      [galleryId, userId],
    );
    return result.insertId;
  }

  async deleteLike(galleryId: number, userId: number) {
    const [result] = await databaseClient.query<Result>(
      "DELETE FROM gallery_like WHERE  gallery_like_id_gallery = ? AND gallery_like_id_user = ?",
      [galleryId, userId],
    );
    return result.affectedRows;
  }

  async getLikesByEventAndUser(eventId: number, userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `
    SELECT gl.gallery_like_id_gallery 
    FROM gallery_like gl
    JOIN gallery g 
      ON gl.gallery_like_id_gallery = g.gallery_id
    WHERE g.gallery_id_event = ? 
    AND gl.gallery_like_id_user = ?
    `,
      [eventId, userId],
    );

    return rows;
  }
}

export default new GalleryRepository();
