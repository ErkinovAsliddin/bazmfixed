---
name: DB schema composite rebuild
description: Why api-server typechecks against stale db types after a lib/db schema change, and how to fix it.
---

# lib/db is a composite project — rebuild its emitted types after schema edits

After editing a Drizzle schema in `lib/db/src/schema/*.ts`, the `api-server`
package will keep typechecking against the **old** emitted declarations and fail
with errors like `Property 'attempts' does not exist on type '{ ... }'` even
though the source is correct.

**Why:** `lib/db` is a TypeScript composite project consumed by artifacts via
project references (see `artifacts/*/tsconfig.json` `references`). Consumers read
`lib/db/dist/*.d.ts`, not the source. There is **no** `build` script on the db
package, so the emitted `.d.ts` is only refreshed by a composite build.

**How to apply:**
- After any `lib/db` schema/source change, run `pnpm exec tsc -b lib/db` from the
  repo root before typechecking or restarting any artifact — otherwise stale
  types surface as phantom "property does not exist" errors.
- When adding a new column type (e.g. `integer`), remember to import it from
  `drizzle-orm/pg-core` in the schema file, or `tsc -b` fails with
  `Cannot find name '<type>'`.
- DB DDL is separate: apply the actual column with direct SQL
  (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`) since `db push` needs a TTY.
