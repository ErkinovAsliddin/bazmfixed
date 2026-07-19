---
name: Budget engine design intent
description: Non-obvious rules behind the wedding budget planner's estimate engine (Bazm)
---

# Budget engine (Bazm wedding planner)

The estimate engine (`artifacts/api-server/src/lib/budget-engine.ts`) is pure and
deterministic; the same input always yields the same breakdown. A few intents are
NOT obvious from the code:

- **Priorities are stored as weights, not an ordered list.** The API accepts an
  ordered `priorities` array; the DB persists weights. Round-trip helpers
  (`prioritiesToWeights` / `weightsToPriorities`) must stay inverses, or saved
  plans reorder on read.
  **Why:** recompute-on-read rebuilds the full estimate from stored input, so the
  stored representation has to reconstruct the original ranking faithfully.

- **Upgrade suggestions draw the "premium" ceiling from the full category
  catalog, not just the vendor chosen for the breakdown.**
  **Why:** local vendors in a city may top out at "standard"; without pulling the
  premium price from the whole catalog, a couple with a surplus would see zero
  upgrade suggestions, defeating the "you have room to spend more" moment.

- **Sufficiency tone is intentional, not incidental:** sufficient = emerald,
  short = warm amber/gold (never destructive red), unknown = neutral. Keep this if
  restyling — the product promise is "calm, we did the math," not alarmist.

**How to apply:** when changing the engine or its response shape, preserve the
weight round-trip and the full-catalog upgrade ceiling, and never trust
client-sent totals — always recompute server-side.
