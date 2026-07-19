---
name: Organizer→couple plan sharing consent
description: Why organizers link couples by budget-plan shareToken, never by email
---

# Organizer access to a couple's budget plan is consent-gated by shareToken

An organizer may read a couple's budget plan only when `organizer_clients.coupleUserId`
is set. That link is established by the couple's **budget-plan `shareToken`**
(the random UUID behind the public `/share/:token` read-only page), pasted into
the Add-Client form. Holding the token = the couple's consent.

**Why:** `organizer` (like `couple`/`vendor`) is a self-assignable role at
registration. If linking were by email (or any guessable identifier), any
self-registered organizer could link an arbitrary couple by enumerating emails
and read their private budget data. A code review flagged this as a high-severity
broken-access-control leak. Role-gating alone does NOT protect couple data —
consent (the token) does. The shareToken is unguessable and only the couple can
hand it out, matching the app's existing capability-URL sharing model.

**How to apply:** Any new organizer-side feature that surfaces couple-owned data
must gate on a consent signal the couple controls, not on the organizer having
typed the couple's identifier. Do not add email/phone-based auto-linking. If a
tighter grant is ever needed (e.g. link a *specific* plan rather than "latest
plan of this couple"), add a plan reference to `organizer_clients` rather than
loosening the consent check.
