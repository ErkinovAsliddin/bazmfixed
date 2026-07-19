import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;

/**
 * Hash a plaintext password using scrypt. Returns a `salt:hash` string.
 * Placeholder credentials scheme — intended to be swapped for OTP later.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${derived}`;
}

/** Verify a plaintext password against a stored `salt:hash` string. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, KEY_LEN);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derived.length) return false;
  return timingSafeEqual(derived, keyBuffer);
}

export const SESSION_COOKIE = "bazm_session";

/**
 * Resolve the signed-in user's id from the signed session cookie, or null when
 * there is no valid session. Shared by all routes that require authentication.
 */
export function getSessionUserId(req: {
  signedCookies?: Record<string, string | undefined>;
}): number | null {
  const raw = req.signedCookies?.[SESSION_COOKIE];
  const id = raw ? parseInt(String(raw), 10) : NaN;
  return Number.isNaN(id) || id <= 0 ? null : id;
}

const isProduction = process.env.NODE_ENV === "production";

/** Attributes shared between setting and clearing the session cookie. */
export const sessionCookieBase = {
  httpOnly: true,
  // "none" is required for the browser to send this cookie on cross-origin
  // fetch calls (e.g. a Vercel-hosted frontend calling an API on a different
  // domain). It requires `secure: true`, which we already set in production.
  // In dev (http://localhost) we fall back to "lax" since browsers reject
  // SameSite=None cookies that aren't Secure.
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  secure: isProduction,
  path: "/",
};

export const sessionCookieOptions = {
  ...sessionCookieBase,
  signed: true,
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
};

/**
 * Roles a user may self-assign at public registration. `admin` is intentionally
 * excluded to prevent privilege escalation — it must be granted out-of-band.
 */
export const SELF_ASSIGNABLE_ROLES = [
  "couple",
  "vendor",
  "organizer",
] as const;

export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

export function isSelfAssignableRole(
  role: string | undefined,
): role is SelfAssignableRole {
  return (
    role !== undefined &&
    (SELF_ASSIGNABLE_ROLES as readonly string[]).includes(role)
  );
}
