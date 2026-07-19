---
name: Orval Zod codegen version quirk
description: Why certain OpenAPI string "format" hints break the api-zod typecheck in this monorepo
---

# Orval Zod codegen + Zod version mismatch

Adding string `format` hints in `lib/api-spec/openapi.yaml` (e.g. `format: email`, and likely `date`, `uuid`, `url`) makes Orval emit **Zod v4-only** top-level helpers like `zod.email()` into `lib/api-zod/src/generated/api.ts`.

The chained `pnpm -w run typecheck:libs` (run automatically at the end of `codegen`) fails with:

```
error TS2339: Property 'email' does not exist on type 'typeof import(".../zod@3.25.x/.../index")'.
```

**Why:** the installed root `zod` resolves to v3.25.x, whose top-level object has no `.email()` (that's `z.string().email()` in v3, and only a top-level `z.email()` in v4). Orval generates the v4 form.

**How to apply:** For request/response fields, omit `format` and use `type: string` (+ `minLength`/`maxLength`) instead. If you need real email/format validation, enforce it in the Express route handler manually rather than via the OpenAPI `format`. `format: date-time` on responses is fine — it generates `zod.coerce.date()`, which works.

## `type: integer` does NOT emit `.int()`

Orval generates plain `zod.number().min().max()` for OpenAPI `type: integer` — the integer constraint is silently dropped. So decimals pass request-body validation. Since money columns are `bigint mode:number` (whole UZS) and counts are integers, a fractional value slips past zod and then fails at the DB layer as a 500 instead of a clean 400.

**Why:** the zod-v3 orval preset has no integer helper wired up; only `minimum`/`maximum` survive.

**How to apply:** After `safeParse`, hand-check `Number.isInteger(...)` on every count/money field in the Express handler and return 400 on failure. Also enforce query-param integer bounds by hand — remember `override.zod.generate` has param/query/header:false, so query params get no generated validation at all.
