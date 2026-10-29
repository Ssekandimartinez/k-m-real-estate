import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = (p) => path.join(root, "node_modules", p);
function run(args, cwd = root) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Command failed (${code}): ${args[0]}`)),
    );
    child.on("error", reject);
  });
}
const task = process.argv[2];
try {
  if (task === "build") {
    await run([
      bin("typescript/bin/tsc"),
      "--noEmit",
      "-p",
      "client/tsconfig.json",
    ]);
    await run([bin("vite/bin/vite.js"), "build"], path.join(root, "client"));
    await run([bin("typescript/bin/tsc"), "-p", "server/tsconfig.json"]);
  } else if (task === "typecheck") {
    for (const part of ["client", "server"])
      await run([
        bin("typescript/bin/tsc"),
        "--noEmit",
        "-p",
        `${part}/tsconfig.json`,
      ]);
  } else if (task === "test") {
    await run([
      bin("vitest/vitest.mjs"),
      "run",
      "--config",
      "server/vitest.config.ts",
    ]);
    await run([
      bin("vitest/vitest.mjs"),
      "run",
      "--config",
      "client/vitest.config.ts",
    ]);
  } else if (task === "dev") {
    const children = [
      spawn(
        process.execPath,
        [bin("tsx/dist/cli.mjs"), "watch", "src/index.ts"],
        { cwd: path.join(root, "server"), stdio: "inherit" },
      ),
      spawn(
        process.execPath,
        [bin("vite/bin/vite.js"), "--host", "127.0.0.1"],
        { cwd: path.join(root, "client"), stdio: "inherit" },
      ),
    ];
    process.on("SIGINT", () => children.forEach((c) => c.kill()));
    await Promise.all(children.map((c) => new Promise((r) => c.on("exit", r))));
  } else if (task === "db:generate")
    await run(
      [bin("prisma/build/index.js"), "generate"],
      path.join(root, "server"),
    );
  else if (task === "db:migrate")
    await run(
      [bin("prisma/build/index.js"), "migrate", "deploy"],
      path.join(root, "server"),
    );
  else if (task === "db:seed")
    await run([bin("tsx/dist/cli.mjs"), "server/prisma/seed.ts"]);
  else if (task === "admin:create")
    await run([bin("tsx/dist/cli.mjs"), "server/src/create-admin.ts"]);
  else throw new Error("Unknown task");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
