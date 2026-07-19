import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";
import { getSessionUserId } from "./auth";

/**
 * Resolve the signed-in user, or write a 401 and return null. Shared by every
 * route that requires authentication.
 */
export async function requireUser(
  req: Request,
  res: Response,
): Promise<User | null> {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }
  return user;
}

/**
 * Resolve the signed-in user and require a specific role, or write the
 * appropriate error (401/403) and return null.
 */
export async function requireRole(
  req: Request,
  res: Response,
  role: User["role"],
): Promise<User | null> {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== role) {
    res.status(403).json({ error: `Not a ${role} account` });
    return null;
  }
  return user;
}
