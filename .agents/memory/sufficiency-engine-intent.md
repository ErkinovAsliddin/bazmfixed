---
name: Sufficiency engine intent
description: Quantity-sufficiency calculator's strict-vs-recommended semantics and duration rules
---

The sufficiency engine (`portion-estimates.ts`) answers "will the food be enough?" — a separate anxiety from budget.

- `strictAmount` = honest headcount math with **no buffer**, and it must **floor** to the round step (it is presented as the lower/minimum edge). `recommendedAmount` = headcount +12% buffer, and it **ceils**. If you ever touch the rounding helper, keep floor for strict / ceil for recommended — using round for strict inflates the "minimum needed" and breaks the contract.
- **Why:** the whole value prop is a trustworthy range; strict > true minimum misleads and erodes trust.
- Buffer is a single tunable `BUFFER_PERCENT` (~0.10–0.15). Only **duration-sensitive** categories (currently just `drinks`) scale with event length, clamped 1–2× around a 4h baseline; set-course food is fixed regardless of how long guests linger.
- Never return 0 for a category the host explicitly selected (floor bottoms out at one round step).
- Portion ratios are deliberately tunable constants, not inline magic numbers — refine them, don't rewrite the engine.
