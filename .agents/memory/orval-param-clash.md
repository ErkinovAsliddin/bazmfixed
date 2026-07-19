---
name: Orval param/type name clash on query-param endpoints
description: Why the zod client must disable param/query/header generation, and how query params are validated instead.
---

# Orval `*Params` name clash

When an OpenAPI operation gains **query parameters**, orval emits a `<OperationName>Params` type. Both the api-client-react generator and the zod generator write into `@workspace/api-zod`'s combined index, so the two `*Params` symbols collide and the `typecheck:libs` build fails.

**Fix (in `lib/api-spec/orval.config.ts`):** on the zod output, set
`override.zod.generate = { param: false, query: false, header: false, body: true, response: true }`
(and keep `coerce` limited to body/response). This stops the zod client from emitting param/query/header schemas entirely.

**Why:** we don't need generated zod schemas for query/path/header params — routes validate those manually (path params via `parseInt`, enum params against a local allow-list). Only request bodies and responses need generated zod.

**How to apply:** whenever you add the *first* query-param (or header-param) endpoint to `openapi.yaml`, expect this clash if the override is ever removed. Keep the override in place; validate query/path params by hand in the route.
