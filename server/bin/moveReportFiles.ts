import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import type { Rows } from "../database/client";
import database from "../database/client";
import { REPORTS_DESTINATION } from "../src/middleware/upload";

// Script à passer une seule fois : les pièces jointes des signalements créés
// avant la mise en place de la route admin sont encore dans public/uploads,
// donc lisibles par n'importe qui connaissant leur nom. On les déplace vers
// le dossier privé, où la nouvelle route va les chercher.

const PUBLIC_UPLOADS = path.resolve(process.cwd(), "public/uploads");
const PRIVATE_REPORTS = path.resolve(process.cwd(), REPORTS_DESTINATION);

const IMAGE_QUERIES = [
  "SELECT reported_user_image_path AS filename FROM reported_user_image",
  "SELECT reported_bug_image_path AS filename FROM reported_bug_image",
  "SELECT reported_event_image_path AS filename FROM reported_event_image",
];

const moveReportFiles = async () => {
  await fs.mkdir(PRIVATE_REPORTS, { recursive: true });

  const filenames = new Set<string>();

  for (const query of IMAGE_QUERIES) {
    const [rows] = await database.query<Rows>(query);

    for (const row of rows) {
      if (row.filename) filenames.add(row.filename as string);
    }
  }

  let moved = 0;
  let alreadyDone = 0;
  let missing = 0;

  for (const filename of filenames) {
    const from = path.join(PUBLIC_UPLOADS, filename);
    const to = path.join(PRIVATE_REPORTS, filename);

    try {
      await fs.access(to);
      alreadyDone += 1;
      continue;
    } catch {
      // pas encore déplacé, on continue
    }

    try {
      await fs.rename(from, to);
      moved += 1;
    } catch {
      missing += 1;
      console.warn(`introuvable dans public/uploads : ${filename}`);
    }
  }

  console.info(
    `${filenames.size} pièces jointes référencées — ${moved} déplacées, ${alreadyDone} déjà en place, ${missing} introuvables`,
  );

  await database.end();
};

moveReportFiles().catch((error) => {
  console.error(error);
  process.exit(1);
});
