---
name: Orval array-response name clash
description: Naming a component schema the same as an operation response makes orval emit a duplicate export
---

If a component schema in `openapi.yaml` shares its name with what orval derives for an operation's response (`<OperationId>` → `<OperationId>Response`, and for a request body `<OperationId>Input`/`Body`), the generated zod re-exports the name twice and `typecheck:libs` fails with TS2308 "already exported a member".

**Why:** orval names operation request/response zod schemas after the operationId; a same-named `components.schemas` entry produces a second export of the identical identifier.

**How to apply:** for list endpoints, **inline** the array in the response (`type: array, items: $ref`) instead of pointing at a top-level `List...Response` component — orval then generates the array zod solely from the operationId (e.g. `ListMarketplaceProductsResponse`). This is the pattern the dasturxon list uses.
