import type { Faker } from "@faker-js/faker";
import { faker } from "@faker-js/faker";
import type { Result } from "../client";
import database from "../client";

type Ref = object & { insertId: number };

const refs: { [key: string]: Ref } = {};

type SeederOptions = {
  table: string;
  truncate?: boolean;
  dependencies?: (typeof AbstractSeeder)[];
};

abstract class AbstractSeeder implements SeederOptions {
  table: string;
  truncate: boolean;
  dependencies: (typeof AbstractSeeder)[];
  promises: Promise<void>[];
  faker: Faker;

  constructor({
    table,
    truncate = true,
    dependencies = [] as (typeof AbstractSeeder)[],
  }: SeederOptions) {
    this.table = table;

    this.truncate = truncate;

    this.dependencies = dependencies;

    this.promises = [];

    this.faker = faker;
  }

  async #doInsert(data: { refName?: string } & object) {
    const { refName, ...values } = data;

    const fields = Object.keys(values).join(",");
    const placeholders = new Array(Object.keys(values).length)
      .fill("?")
      .join(",");

    const sql = `insert into ${this.table}(${fields}) values (${placeholders})`;

    const [result] = await database.query<Result>(sql, Object.values(values));

    if (refName != null) {
      const { insertId } = result;

      refs[refName] = { ...values, insertId };
    }
  }

  insert(data: { refName?: string } & object) {
    this.promises.push(this.#doInsert(data));
  }

  run() {
    throw new Error("You must implement this function");
  }

  getRef(name: string) {
    return refs[name];
  }
}

export default AbstractSeeder;

export type { AbstractSeeder };
