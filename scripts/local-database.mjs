import EmbeddedPostgres from "embedded-postgres";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
await mkdir(".local", { recursive: true });
const file = path.resolve(".local/database.json");
let settings;
try {
  settings = JSON.parse(await readFile(file, "utf8"));
} catch {
  settings = {
    user: "km_local",
    password: randomBytes(32).toString("hex"),
    port: 55432,
  };
  await writeFile(file, JSON.stringify(settings), { mode: 0o600 });
}
const pg = new EmbeddedPostgres({
  databaseDir: path.resolve(".local/postgres"),
  ...settings,
  persistent: true,
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: () => {},
});
try {
  await access(".local/postgres/PG_VERSION");
} catch {
  await pg.initialise();
}
await pg.start();
const client = pg.getPgClient();
await client.connect();
const result = await client.query(
  "SELECT 1 FROM pg_database WHERE datname='km'",
);
if (!result.rowCount) await client.query("CREATE DATABASE km");
await client.end();
const envFile = path.resolve("server/.env");
try {
  await access(envFile);
} catch {
  await writeFile(
    envFile,
    `DATABASE_URL=postgresql://${settings.user}:${settings.password}@127.0.0.1:${settings.port}/km\nPORT=4000\nAPP_ORIGIN=http://localhost:5173\nSITE_URL=http://localhost:4000\nNODE_ENV=development\n`,
    { mode: 0o600 },
  );
}
console.log(
  "Local PostgreSQL listening on 127.0.0.1:55432. Credentials are in ignored local files.",
);
process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});
await new Promise(() => {});
