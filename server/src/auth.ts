import { randomBytes, createHash } from "node:crypto";
import type { RequestHandler, Request } from "express";
import type { User } from "@prisma/client";
import { db } from "./db.js";
import { config } from "./config.js";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const token = () => randomBytes(32).toString("hex");
export const cookieName = config.production
  ? "__Host-km_session"
  : "km_session";
export const cookieOptions = {
  httpOnly: true,
  secure: config.production,
  sameSite: "strict" as const,
  path: "/",
};
export interface AuthRequest extends Request {
  staff?: Pick<User, "id" | "name" | "email" | "role">;
  sessionId?: string;
  csrfToken?: string;
}
export const authenticate: RequestHandler = async (
  req: AuthRequest,
  res,
  next,
) => {
  res.set("Cache-Control", "no-store");
  const raw = req.cookies[cookieName];
  if (!raw) {
    res.status(401).json({ error: "Please sign in" });
    return;
  }
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) {
    res
      .clearCookie(cookieName, cookieOptions)
      .status(401)
      .json({ error: "Session expired. Please sign in" });
    return;
  }
  req.staff = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
  req.sessionId = session.id;
  req.csrfToken = session.csrfToken;
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.get("X-CSRF-Token") !== session.csrfToken
  ) {
    res
      .status(403)
      .json({ error: "Invalid security token. Reload and try again" });
    return;
  }
  next();
};
export const adminOnly: RequestHandler = (req: AuthRequest, res, next) => {
  if (req.staff?.role !== "ADMIN") {
    res.status(403).json({ error: "Administrator permission required" });
    return;
  }
  next();
};
