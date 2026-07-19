import { Router, type IRouter } from "express";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db, usersTable, phoneOtpsTable } from "@workspace/db";
import {
  RegisterUserBody,
  RegisterUserResponse,
  LoginUserBody,
  LoginUserResponse,
  LogoutUserResponse,
  GetCurrentUserResponse,
  RequestPhoneOtpBody,
  RequestPhoneOtpResponse,
  VerifyPhoneOtpBody,
  VerifyPhoneOtpResponse,
} from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  isSelfAssignableRole,
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionCookieBase,
} from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, phone, role, preferredLocale } = parsed.data;

  // Prevent privilege escalation: never let a public registrant self-assign a
  // privileged role (e.g. admin). Fall back to the safe default otherwise.
  const safeRole = isSelfAssignableRole(role) ? role : "couple";

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      phone: phone ?? null,
      passwordHash: hashPassword(password),
      role: safeRole,
      preferredLocale: preferredLocale ?? "uz",
    })
    .returning();

  res.cookie(SESSION_COOKIE, String(user.id), sessionCookieOptions);
  res.status(201).json(RegisterUserResponse.parse(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email.toLowerCase()));

  if (
    !user ||
    !user.passwordHash ||
    !verifyPassword(parsed.data.password, user.passwordHash)
  ) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.cookie(SESSION_COOKIE, String(user.id), sessionCookieOptions);
  res.json(LoginUserResponse.parse(user));
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(SESSION_COOKIE, sessionCookieBase);
  res.json(LogoutUserResponse.parse({ status: "ok" }));
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const raw = req.signedCookies?.[SESSION_COOKIE];
  const id = raw ? parseInt(String(raw), 10) : NaN;

  if (!id || Number.isNaN(id)) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  res.json(GetCurrentUserResponse.parse(user));
});

// ---------------------------------------------------------------------------
// Phone one-time-code login
// ---------------------------------------------------------------------------

const OTP_TTL_MS = 1000 * 60 * 10; // 10 minutes
const OTP_COOLDOWN_MS = 1000 * 60; // min gap between sends to one phone
const OTP_MAX_PER_HOUR = 5; // max codes issued to one phone per hour
const OTP_MAX_ATTEMPTS = 5; // wrong guesses before a code is locked out
const isProduction = process.env.NODE_ENV === "production";

/** Normalize a phone number to digits (keeping a leading +) for matching. */
function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/[^0-9]/g, "");
}

// POST /auth/phone/request-otp — issue a one-time code (SMS delivery stubbed).
router.post("/auth/phone/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestPhoneOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone.replace(/\D/g, "").length < 6) {
    res.status(400).json({ error: "Enter a valid phone number" });
    return;
  }

  // Throttle per phone: enforce a short cooldown between sends and an hourly
  // cap so the endpoint can't be used to spam SMS or brute the code space.
  const now = new Date();
  const recent = await db
    .select()
    .from(phoneOtpsTable)
    .where(
      and(
        eq(phoneOtpsTable.phone, phone),
        gt(phoneOtpsTable.createdAt, new Date(now.getTime() - 3600_000)),
      ),
    )
    .orderBy(desc(phoneOtpsTable.createdAt));
  if (
    recent[0] &&
    now.getTime() - recent[0].createdAt.getTime() < OTP_COOLDOWN_MS
  ) {
    res
      .status(429)
      .json({ error: "Please wait a moment before requesting another code" });
    return;
  }
  if (recent.length >= OTP_MAX_PER_HOUR) {
    res
      .status(429)
      .json({ error: "Too many code requests. Please try again later." });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.insert(phoneOtpsTable).values({
    phone,
    codeHash: hashPassword(code),
    expiresAt: new Date(now.getTime() + OTP_TTL_MS),
  });

  // SMS is stubbed. Wire up a provider (e.g. Eskiz.uz or Twilio) here to send
  // the code for real. Never log the raw code — it is a sensitive credential;
  // it is surfaced only via the dev-only `devCode` field below.
  logger.info({ phone }, "Phone OTP issued (SMS stubbed)");

  res.json(
    RequestPhoneOtpResponse.parse({
      status: "sent",
      // Surface the code in development so it can be entered without SMS.
      devCode: isProduction ? null : code,
    }),
  );
});

// POST /auth/phone/verify-otp — verify a code, signing in (or registering).
router.post("/auth/phone/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyPhoneOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const phone = normalizePhone(parsed.data.phone);

  const [otp] = await db
    .select()
    .from(phoneOtpsTable)
    .where(
      and(
        eq(phoneOtpsTable.phone, phone),
        isNull(phoneOtpsTable.consumedAt),
        gt(phoneOtpsTable.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(phoneOtpsTable.createdAt))
    .limit(1);

  if (!otp) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  // Lock out a code once too many wrong guesses have been made against it.
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await db
      .update(phoneOtpsTable)
      .set({ consumedAt: new Date() })
      .where(eq(phoneOtpsTable.id, otp.id));
    res
      .status(429)
      .json({ error: "Too many attempts. Please request a new code." });
    return;
  }

  if (!verifyPassword(parsed.data.code, otp.codeHash)) {
    await db
      .update(phoneOtpsTable)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(phoneOtpsTable.id, otp.id));
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  // Atomically consume the code: only the request that flips consumedAt from
  // NULL wins, so concurrent verifies can't both succeed on one code.
  const consumed = await db
    .update(phoneOtpsTable)
    .set({ consumedAt: new Date() })
    .where(and(eq(phoneOtpsTable.id, otp.id), isNull(phoneOtpsTable.consumedAt)))
    .returning({ id: phoneOtpsTable.id });
  if (consumed.length === 0) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  // Find an existing account by phone, or create a fresh one.
  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  if (!user) {
    const role = isSelfAssignableRole(parsed.data.role)
      ? parsed.data.role
      : "couple";
    [user] = await db
      .insert(usersTable)
      .values({
        name: parsed.data.name?.trim() || `Bazm ${phone.slice(-4)}`,
        // Placeholder unique email; phone users may set a real one later.
        email: `phone_${phone.replace(/\D/g, "")}@phone.bazm.local`,
        phone,
        passwordHash: null,
        role,
      })
      .returning();
  }

  res.cookie(SESSION_COOKIE, String(user.id), sessionCookieOptions);
  res.json(VerifyPhoneOtpResponse.parse(user));
});

export default router;
