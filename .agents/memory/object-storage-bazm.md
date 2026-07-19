---
name: Object storage integration (Bazm)
description: How image upload/serve is wired in Bazm and the non-obvious auth/security/build constraints.
---

# Object storage in Bazm

Sellers upload vendor-tier and product images to Replit Object Storage (App Storage) via presigned URLs. Stored value in DB `photos` arrays is the object path (`/objects/uploads/<uuid>`); displayed by prefixing `/api/storage` (frontend calls the API relatively, same origin).

## Auth adaptation (non-obvious)
The stock storage route template gates uploads with Replit Auth's `req.isAuthenticated()`. Bazm has its own session, so the upload handler uses `getSessionUserId(req)` from `lib/auth` instead. Object GETs are intentionally public (vendor/product images are public) — no ACL check.

## Public-serve hardening (security — do not remove)
**Rule:** the `/storage/objects/*` and `/storage/public-objects/*` serve handlers must force a safe Content-Type (only known image MIME types served as-is; everything else → `application/octet-stream`) plus `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'; sandbox`.
**Why:** the presigned PUT (sidecar `signObjectURL`) signs only method+object+expiry, NOT content-type. A signed-in user can PUT arbitrary bytes with `Content-Type: text/html`, and `downloadObject` echoes the stored content-type. Serving that publicly same-origin = stored XSS. `request-url` also validates an image MIME allowlist + 5 MB cap as defense-in-depth, but the serve-side header override is the real defense (client can bypass the metadata check).
**How to apply:** keep `applySafeHeaders()` on both serve routes; never revert to blindly copying the storage response's content-type.

## Displaying uploaded photos (recurring gotcha)
Stored photo values are object paths (`/objects/uploads/<uuid>`), NOT servable URLs. Every `<img>` that shows a photo must route the value through `resolvePhotoSrc()` (lib/utils) which prefixes `/api/storage` for `/objects/...` paths and passes full URLs through unchanged. Rendering the raw path 404s → broken image. Display sites to keep in sync: `VendorPhoto`, `MarketplacePage` product image, `ImageUploader` previews, and any new photo surface.

## Build/config quirks
- This project uses React 19 (catalog `react: 19.1.0`). Do NOT add the object-storage skill's pnpm `overrides: { react: "$react" }` — `$react` needs react as a root dep (React-18 assumption) and the install fails with "Cannot resolve version $react". Uppy v5's `react>=19` peer is already satisfied.
- Generated/bundled images live in `attached_assets/`; bazm imports them via the `@assets/*` alias. Vite resolves it, but `tsc` needs `@assets/*` added to `paths` in `artifacts/bazm/tsconfig.json` or typecheck fails.
- A new workspace lib referenced by an artifact tsconfig (`lib/object-storage-web`) must set `"composite": true` or tsc build errors TS6306.
