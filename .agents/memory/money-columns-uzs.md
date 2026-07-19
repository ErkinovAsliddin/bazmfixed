---
name: Money columns store whole UZS as bigint mode:number
description: Convention for monetary columns in the Bazm Drizzle schema and why
---

# Money columns: bigint mode:"number", whole UZS

All monetary columns in the Bazm schema (vendor tier prices, budgets, estimated
costs, order totals, product prices, etc.) are declared as Drizzle
`bigint(name, { mode: "number" })` and hold **whole UZS** (no minor units — UZS
has no practical fractional use).

**Why:** `bigint` gives the Postgres column effectively unlimited headroom (avoids
the `integer` ~2.1B ceiling, which a large wedding budget could approach).
`mode: "number"` keeps values as plain JS numbers, which serialize cleanly over
JSON and are precision-safe here — realistic UZS amounts top out in the hundreds
of millions, ~5-6 orders of magnitude below `Number.MAX_SAFE_INTEGER` (~9e15).
A code review flagged this as "lossy," but that only bites near the top of the
bigint range, which this domain never reaches. `mode: "bigint"` was rejected: it
breaks `JSON.stringify` (BigInt isn't serializable) and adds friction everywhere
for no real gain.

**How to apply:** Keep new money columns as `bigint(..., { mode: "number" })`
storing whole UZS, and represent them as `integer` in the OpenAPI spec. Only
revisit if the product ever needs sub-som precision or amounts approaching 1e15.
