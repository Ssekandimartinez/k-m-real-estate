import { createInterface } from "node:readline/promises";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "./db.js";
import { passwordSchema } from "./validation.js";
const rl = createInterface({ input: process.stdin, output: process.stdout });
try {
  const name = z
    .string()
    .min(2)
    .parse(await rl.question("Administrator name: "));
  const email = z
    .email()
    .parse((await rl.question("Administrator email: ")).toLowerCase());
  console.log("Enter a unique password (12+ characters). Input is hidden.");
  // Read password directly from terminal in raw mode to prevent echo.
  if (!process.stdin.isTTY)
    throw new Error("Run this command in an interactive terminal");
  rl.close();
  process.stdin.setRawMode(true);
  process.stdin.resume();
  const password = await new Promise<string>((resolve, reject) => {
    let input = "";
    const handler = (chunk: Buffer) => {
      for (const ch of chunk.toString()) {
        if (ch === "\u0003") {
          process.stdin.off("data", handler);
          reject(new Error("Cancelled"));
          return;
        }
        if (ch === "\r" || ch === "\n") {
          process.stdin.off("data", handler);
          resolve(input);
          return;
        }
        if (ch === "\u007f" || ch === "\b") input = input.slice(0, -1);
        else input += ch;
      }
    };
    process.stdin.on("data", handler);
  });
  process.stdin.setRawMode(false);
  process.stdin.pause();
  passwordSchema.parse(password);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await argon2.hash(password),
      role: "ADMIN",
    },
  });
  console.log(`\nAdministrator created: ${user.email}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Setup failed");
  process.exitCode = 1;
} finally {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  rl.close();
  await db.$disconnect();
}
