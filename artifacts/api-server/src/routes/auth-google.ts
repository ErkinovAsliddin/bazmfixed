import { Router, type IRouter, type Request } from "express";
import { randomUUID } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { SESSION_COOKIE, sessionCookieOptions } from "../lib/auth";
import { logger } from "../lib/logger";

/**
 * Google sign-in via a standard OAuth2 authorization-code flow. These are
 * browser redirects (not JSON API calls), so they live outside the OpenAPI
 * contract. On success we issue the same signed `bazm_session` cookie the
 * password/OTP flows use, so Google users share the existing users table/roles.
 */

const router: IRouter = Router();

const STATE_COOKIE = "bazm_g_state";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";

function isConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

/** Public base URL used to build the OAuth redirect URI (must match Google console). */
function baseUrl(req: Request): string {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return `${req.protocol}://${req.get("host")}`;
}

function redirectUri(req: Request): string {
  return `${baseUrl(req)}/api/auth/google/callback`;
}

// GET /auth/google — kick off the OAuth flow.
router.get("/auth/google", (req, res): void => {
  if (!isConfigured()) {
    res.redirect("/login?error=google_not_configured");
    return;
  }

  const state = randomUUID();
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 10,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// GET /auth/google/callback — exchange the code, sign in, and return to the app.
router.get("/auth/google/callback", async (req, res): Promise<void> => {
  if (!isConfigured()) {
    res.redirect("/login?error=google_not_configured");
    return;
  }

  const { code, state } = req.query;
  const expectedState = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, { path: "/" });

  if (
    typeof code !== "string" ||
    typeof state !== "string" ||
    !expectedState ||
    state !== expectedState
  ) {
    res.redirect("/login?error=google");
    return;
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: redirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error(`token exchange failed: ${tokenRes.status}`);
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) throw new Error("no access token");

    const infoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) throw new Error(`userinfo failed: ${infoRes.status}`);
    const info = (await infoRes.json()) as {
      sub: string;
      email?: string;
      name?: string;
    };

    const email = info.email?.toLowerCase() ?? null;

    // Match by Google id first, then by email (linking an existing account).
    let [user] = await db
      .select()
      .from(usersTable)
      .where(
        email
          ? or(eq(usersTable.googleId, info.sub), eq(usersTable.email, email))
          : eq(usersTable.googleId, info.sub),
      )
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({
          name: info.name?.trim() || email?.split("@")[0] || "Bazm user",
          email: email ?? `google_${info.sub}@google.bazm.local`,
          googleId: info.sub,
          passwordHash: null,
          role: "couple",
        })
        .returning();
    } else if (!user.googleId) {
      // Link Google to a pre-existing (password) account.
      [user] = await db
        .update(usersTable)
        .set({ googleId: info.sub })
        .where(eq(usersTable.id, user.id))
        .returning();
    }

    res.cookie(SESSION_COOKIE, String(user.id), sessionCookieOptions);
    res.redirect("/");
  } catch (err) {
    logger.error({ err }, "Google OAuth callback failed");
    res.redirect("/login?error=google");
  }
});

export default router;
