import "dotenv/config";

import fs from "node:fs";
import type { Rows } from "../database/client";
import databaseClient from "../database/client";

afterAll((done) => {
  databaseClient.end().then(done);
});

describe("Installation", () => {
  test("You have created /server/.env", async () => {
    expect(fs.existsSync(`${__dirname}/../.env`)).toBe(true);
  });

  test("You have retained /server/.env.sample", async () => {
    expect(fs.existsSync(`${__dirname}/../.env.sample`)).toBe(true);
  });

  test("You have filled /server/.env with valid information to connect to your database", async () => {
    expect.assertions(0);

    try {
      await databaseClient.getConnection();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("You have executed the db:migrate scripts", async () => {
    const [rows] = await databaseClient.query<Rows>("select * from item");

    expect(rows.length).toBeGreaterThanOrEqual(0);
  });
});
