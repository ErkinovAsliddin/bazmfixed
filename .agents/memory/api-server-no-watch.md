---
name: API server dev build has no watch
description: Backend route/code changes require a manual workflow restart before they take effect.
---

# api-server dev script builds once (no watch)

The `artifacts/api-server: API Server` workflow runs a single esbuild bundle and serves it — there is **no file watcher / hot reload**.

**Why:** after editing any backend code (routes, lib, etc.), the running server keeps serving the *old* bundle. New/changed routes return 404 or stale behavior until rebuilt.

**How to apply:** after any backend change (or after codegen that the server imports), restart the `artifacts/api-server: API Server` workflow, then re-verify with curl against `$REPLIT_DEV_DOMAIN/api/...`.
