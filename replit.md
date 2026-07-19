# Bazm

Bazm is a wedding planning and marketplace platform for Uzbekistan, helping couples, vendors, and organizers plan a "to'y" — with a trilingual (Uzbek / Russian / English) interface and a festive, culturally-resonant design.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Frontend app: `artifacts/bazm/` (React + Vite, wouter, Tailwind + shadcn/ui)
- Theme/design tokens: `artifacts/bazm/src/index.css` (emerald/gold/blush/ivory palette; Playfair Display + Plus Jakarta Sans)
- i18n messages: `artifacts/bazm/src/messages/{uz,ru,en}.json` (react-i18next; locale persisted in the `bazm_locale` cookie; default `uz`)
- API contract (source of truth): `lib/api-spec/openapi.yaml` → codegen produces hooks (`@workspace/api-client-react`) and Zod (`@workspace/api-zod`)
- Auth backend: `artifacts/api-server/src/routes/auth.ts` + `artifacts/api-server/src/lib/auth.ts`
- DB schema (source of truth): `lib/db/src/schema/` — `users`, `vendors`/`vendor_tiers`, `budget_plans`/`budget_plan_items`, `dasturxon_entries`, `marketplace_products`, `orders`/`order_items`, `organizer_clients`. `budget_plans` carries `title` (nullable), nullable `totalBudget`, and a unique `shareToken` for public sharing.
- Wedding Budget Planner: engine `artifacts/api-server/src/lib/budget-engine.ts` (pure/deterministic), routes `artifacts/api-server/src/routes/budget.ts` (estimate is public; save/list/get are auth-gated; shared-by-token is public and leaks no owner identity), UI in `artifacts/bazm/src/components/budget/*` and pages `BudgetPlannerPage` (`/budget`), `MyPlansPage` (`/my-plans`), `PlanDetailPage` (`/plans/:id`), public `SharedPlanPage` (`/share/:token`). Money is whole UZS formatted via `artifacts/bazm/src/lib/format.ts`.
- Dasturxon Comparison: routes `artifacts/api-server/src/routes/dasturxon.ts` (public feed + per-guest stats over `isPublic` entries only, anonymized — never leaks `userId`; `/dasturxon/mine` and `/dasturxon/comparison` session-gated; POST validates whole-number integers by hand since the generated zod only checks ranges). Reuses the existing `dasturxon_entries` table — no schema change. "Active plan" = the user's most recent `budget_plans` row; planned food spend = its `catering` line's `estimatedCost`, planned menu = chosen catering tier's `description`; "similar weddings" = public entries with guest count in ±20%. UI in `artifacts/bazm/src/components/dasturxon/*` (dish names localized via `normalizeDishKey` keyword matcher → `dasturxon.dishes.*`, keeping local names like osh/non/choy) and page `DasturxonPage` (`/dasturxon`).
- Vendor Marketplace & Comparison: routes `artifacts/api-server/src/routes/vendors.ts` (public list/detail/category-comparison; phone hidden everywhere except the inquiry-POST response; comparison `estimatedCost` + price sort computed server-side; `/vendor/me` profile + tier CRUD gated to `role=vendor` and scoped by `ownerUserId`), UI in `artifacts/bazm/src/components/vendors/*` and pages `VendorsPage` (`/vendors`), `CategoryComparisonPage` (`/vendors/category/:category`, reads `guestCount`/`maxCost`/`city` query params), `VendorDetailPage` (`/vendors/:id`), `VendorDashboardPage` (`/vendor-dashboard`). Budget planner deep-links into the comparison via `CategoryBreakdown` (remaining category budget = `totalBudget − (estimatedTotal − thisCategory.estimatedCost)`).
- Quantity Sufficiency Calculator: engine `artifacts/api-server/src/lib/portion-estimates.ts` (tunable per-guest constants + pure `recommendForCategory`; `strictAmount` floors headcount math, `recommendedAmount` ceils headcount +12% buffer; only `drinks` scales with event duration, clamped 1–2×), route `artifacts/api-server/src/routes/sufficiency.ts` (`POST /sufficiency`, public; validates whole-number integers by hand, dedups categories in canonical order, cross-references `marketplace_products` for a "buy the recommended amount" shortcut — tableware → Disposable Tableware Set). UI in `artifacts/bazm/src/components/sufficiency/*` and page `SufficiencyPage` (`/sufficiency`; auto-calculates on mount, reads `?guests=` carried from the budget planner). Budget results deep-link in via `BudgetResults` ("check if your planned quantities will be enough").
- Marketplace: route `artifacts/api-server/src/routes/marketplace.ts` (`GET /marketplace/products`, public; active products only, optional `category` filter, LEFT JOIN vendors for `sellerName`), page `MarketplacePage` (`/marketplace`, replaced the ComingSoon stub) with a category filter and a client-only cart. Cart lives in `artifacts/bazm/src/lib/cart.tsx` (`CartProvider`/`useCart`, localStorage key `bazm_cart`, items `{productId, quantity}`) — no server order flow yet; checkout is a future phase.
- Organizer Dashboard: routes `artifacts/api-server/src/routes/organizer.ts` (all gated to `role=organizer` via `requireOrganizerUser`; per-client budget snapshots batched to avoid N+1 — a category is "decided" when its `budget_plan_items.chosenVendorTierId` is set, "pending"/"undecided" when null; `undecidedTotal` = sum of `estimatedCost` over null-tier items). Endpoints: `GET/POST /organizer/clients`, `GET /organizer/clients/:id` (ownership-checked; joins chosen tiers → `vendor_tiers`/`vendors` for names), `GET /organizer/summary` (upcoming weddings in the next 30 days + count of clients with unresolved categories). UI in `artifacts/bazm/src/components/organizer/*` (`useOrganizerI18n` reuses `budget.categories.*`/`budget.cities.*`) and pages `OrganizerDashboardPage` (`/organizer-dashboard`), `OrganizerClientDetailPage` (`/organizer-dashboard/clients/:id`).
  - **Client↔plan link = consent (privacy model):** an organizer sees a couple's budget plan only when `organizer_clients.coupleUserId` points at that couple's account. Linking requires the couple's **budget-plan `shareToken`** — the same capability the public `/share/:token` page uses — so possession of the token *is* the couple's consent. Linking never happens by email or any guessable identifier (that would let a self-registered organizer read any couple's plan by enumeration). Add-Client's optional `shareToken` resolves to the plan owner; an invalid token is a 400, an empty one makes a manual/unlinked client. The couple's most recent `budget_plans` row is the one surfaced. `organizer`/`vendor`/`couple` are self-assignable roles, so consent-gated reads (not role-gating alone) are what protect couple data here.
- Seed data: `scripts/src/seed.ts` (run `pnpm --filter @workspace/scripts run seed`); idempotent — clears and re-inserts vendors, tiers, dasturxon entries, products, plus a demo organizer (`organizer@bazm.uz` / `organizer123`), several couple accounts with budget plans (mixed decided/pending tiers), and organizer clients (linked + manual, varied wedding dates and statuses). Only the seeded demo users are deleted on re-run (by email); real registered users are preserved.

## Architecture decisions

- Requested stack was Next.js + NextAuth + next-intl; this environment runs React+Vite + shared Express, so the equivalent stack is React+Vite (SPA), custom credentials auth, and react-i18next. Feature parity, different framework names.
- Auth is a placeholder credentials scheme (email + password, scrypt hashing) using a signed, httpOnly session cookie (`bazm_session`). Intended to be swapped for phone/email OTP later.
- Registration is public but never grants privileged roles: only `couple`/`vendor`/`organizer` are self-assignable; `admin` must be granted out-of-band.

## Product

- Trilingual (Uzbek default / Russian / English) landing page: hero with tagline + "Start Planning" CTA, and 4 feature teasers (Budget Planner, Vendor Marketplace, Dasturxon Comparison, Organizer Dashboard).
- Language switcher (UZ / RU / EN) in the top nav; instant re-render, cookie-persisted.
- Auth: register, login, logout, current-user; dashboard greets the signed-in user.
- Dasturxon Comparison: a warm, communal feed of real (anonymized) weddings showing guest count, city, total food spend, per-guest spend, and the dishes on the table; filter by guest-count range and city; see the average food spend per guest for a city; logged-in couples with a budget plan compare their planned dasturxon against similar-size weddings (±20% guests) and can submit their own after the wedding (public entries are anonymized). Fully trilingual, with local dish names (osh/plov, non, choy) kept intact rather than over-translated.
- Vendor Marketplace & Comparison: browse/filter vendors by category & city; per-vendor package tiers; a category page comparing every vendor's tiers in one price-sortable table; "contact vendor" reveals the phone only after logging an inquiry; vendor-role users self-manage their profile, tiers, and see their inquiry count. Couples jump from a budget line item straight into the comparison pre-filtered to what fits the remaining category budget.
- Wedding Budget Planner (flagship): couples enter city, guest count, optional budget, and rank 6 categories; the server recomputes a tier-based cost breakdown from seeded vendor data (never trusting client math), answers "is my money enough?" (calm surplus/shortfall with concrete adjustments), and shows guest-count scenarios. Logged-in users save plans and share a read-only "we did the math" family view via random `shareToken`.
- Quantity Sufficiency Calculator: answers a different anxiety than budget — "will the food I bought actually be enough?" Enter guest count, event duration, and which categories you're serving (osh/plov, salads, meat, non, fruit, sweets, drinks/tea, disposable tableware); get a recommended amount per category with a plain-language portion note and a visible +12% "so you don't run out" buffer. Where a marketplace product matches (e.g. tableware), a "Buy the recommended quantity" button pre-fills the cart. Reachable standalone or from the budget results, carrying guest count over. Fully trilingual, local dish names kept intact.
- Marketplace: browse physical wedding goods (tableware, décor, rentals) by category with a client-side cart (add, adjust quantity, line + grand totals) persisted per device; checkout is a future phase.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
