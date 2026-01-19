import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { getDatabaseUrl } from "./dbConfig";

const { Pool } = pg;

const databaseUrl = getDatabaseUrl();

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
