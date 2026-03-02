import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | undefined;

export const db = new Proxy({} as DrizzleDb, {
  get: (_target, prop) => {
    if (!_db) {
      const queryClient = postgres(process.env.DATABASE_URL!);
      _db = drizzle(queryClient, { schema });
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
