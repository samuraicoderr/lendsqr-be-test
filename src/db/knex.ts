import knex, { Knex } from "knex";
import { env } from "../config/env";

export const db: Knex = knex({
  client: "mysql2",
  connection: {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database
  },
  pool: {
    min: 0,
    max: env.db.poolMax
  },
  acquireConnectionTimeout: 10000
});
