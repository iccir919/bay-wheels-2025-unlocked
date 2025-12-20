// db/index.js
import pg from "pg"
const { Pool } = pg

const DB_TARGET = process.env.DB_TARGET || "local"

let db;

if (DB_TARGET === "local") {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = {
    query: (text, params) => pool.query(text, params),
    runSQL: (text, params) => pool.query(text, params),
    end: () => pool.end(),
  }
} else if (DB_TARGET === "supabase") {
  // Placeholder
}

export default db