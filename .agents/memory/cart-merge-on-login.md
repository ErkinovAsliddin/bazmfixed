---
name: Cart merge-on-login race
description: Why the server-synced cart gates debounced pushes behind a merge-complete state, not a "merge-started" ref.
---

# Cart merge-on-login sequencing

The client cart is guest-localStorage + merge-on-login + debounced `PUT /cart`.
When a user signs in, we fetch the server cart, merge with local items, and
commit — asynchronously.

**Rule:** the debounced server-push effect must be gated behind a state that
flips true only *after* the merge has committed (a `mergedUserId` state), NOT
behind a ref that is set when the merge *starts* (`syncedUserRef`).

**Why:** if pushes are allowed as soon as the merge starts, a debounced push
(e.g. local cart empty, 500ms timer) can fire and `replaceCart` the empty/stale
local items to the server *before* the async merge fetch+commit finishes,
wiping a non-empty server cart. A code review caught exactly this.

**How to apply:** keep the one-shot guard ref (`syncedUserRef`) to ensure the
merge runs once per user, but set a separate `mergedUserId` state in the merge's
`finally` (only if not cancelled) and require `mergedUserId === userId` in the
push effect's dependency list and guard.
