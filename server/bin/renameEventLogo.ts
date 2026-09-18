import "dotenv/config";
import type { Result } from "../database/client";
import database from "../database/client";

// Script à passer une seule fois : le logo serveur a été renommé de
// logo-wedoo.png en logo-wegather.png. CreateForm enregistre son URL complète
// dans event_picture pour chaque événement créé sans image, donc les lignes
// existantes pointent vers un fichier qui n'existe plus.

const OLD_FILENAME = "logo-wedoo.png";
const NEW_FILENAME = "logo-wegather.png";

const renameEventLogo = async () => {
  const [result] = await database.query<Result>(
    `UPDATE event
     SET event_picture = REPLACE(event_picture, ?, ?)
     WHERE event_picture LIKE ?`,
    [OLD_FILENAME, NEW_FILENAME, `%${OLD_FILENAME}`],
  );

  console.info(
    `${result.affectedRows} événement(s) mis à jour vers ${NEW_FILENAME}`,
  );

  await database.end();
};

renameEventLogo().catch((error) => {
  console.error(error);
  process.exit(1);
});
