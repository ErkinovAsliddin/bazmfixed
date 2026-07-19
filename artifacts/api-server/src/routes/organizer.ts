import { Router, type IRouter, type Request } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  organizerClientsTable,
  budgetPlansTable,
  budgetPlanItemsTable,
  vendorTiersTable,
  vendorsTable,
  type OrganizerClient,
  type BudgetPlan,
  type BudgetPlanItem,
} from "@workspace/db";
import {
  ListOrganizerClientsResponse,
  CreateOrganizerClientBody,
  CreateOrganizerClientResponse,
  GetOrganizerClientResponse,
  GetOrganizerSummaryResponse,
} from "@workspace/api-zod";
import { getSessionUserId } from "../lib/auth";

const router: IRouter = Router();

const UPCOMING_WINDOW_DAYS = 30;
const TIER_LEVELS = ["budget", "standard", "premium"] as const;

/**
 * Resolve the signed-in user and require the `organizer` role. Writes the
 * appropriate error response and returns null when the check fails.
 */
async function requireOrganizerUser(
  req: Request,
  res: {
    status: (code: number) => { json: (body: unknown) => void };
  },
): Promise<number | null> {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user || user.role !== "organizer") {
    res.status(403).json({ error: "Not an organizer account" });
    return null;
  }
  return userId;
}

/** Today's date as a UTC "YYYY-MM-DD" string. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole days from today until an ISO date string, or null if unparseable. */
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = Date.parse(`${dateStr}T00:00:00Z`);
  const today = Date.parse(`${todayIso()}T00:00:00Z`);
  if (Number.isNaN(target)) return null;
  return Math.round((target - today) / 86_400_000);
}

/** Sort clients by wedding date ascending, with undated clients last. */
function byWeddingDate(a: OrganizerClient, b: OrganizerClient): number {
  if (a.weddingDate && b.weddingDate) {
    return a.weddingDate < b.weddingDate ? -1 : a.weddingDate > b.weddingDate ? 1 : 0;
  }
  if (a.weddingDate) return -1;
  if (b.weddingDate) return 1;
  return a.id - b.id;
}

type PlanStats = {
  hasPlan: boolean;
  budgetTotal: number | null;
  undecidedTotal: number | null;
  pendingCount: number;
  decidedCount: number;
  plan: BudgetPlan | null;
  items: BudgetPlanItem[];
};

const EMPTY_STATS: PlanStats = {
  hasPlan: false,
  budgetTotal: null,
  undecidedTotal: null,
  pendingCount: 0,
  decidedCount: 0,
  plan: null,
  items: [],
};

/**
 * Compute per-client budget snapshots from the couple's most recent plan.
 * A category counts as "decided" when its item has a chosen vendor tier.
 * Batched to avoid per-client queries. Returns a map keyed by client id.
 */
async function planStatsByClient(
  clients: OrganizerClient[],
): Promise<Map<number, PlanStats>> {
  const result = new Map<number, PlanStats>();
  for (const c of clients) result.set(c.id, EMPTY_STATS);

  const coupleIds = [
    ...new Set(
      clients
        .map((c) => c.coupleUserId)
        .filter((v): v is number => v !== null),
    ),
  ];
  if (coupleIds.length === 0) return result;

  // Most recent plan per couple.
  const plans = await db
    .select()
    .from(budgetPlansTable)
    .where(inArray(budgetPlansTable.userId, coupleIds))
    .orderBy(desc(budgetPlansTable.createdAt));
  const latestByUser = new Map<number, BudgetPlan>();
  for (const plan of plans) {
    if (!latestByUser.has(plan.userId)) latestByUser.set(plan.userId, plan);
  }

  const planIds = [...latestByUser.values()].map((p) => p.id);
  const items = planIds.length
    ? await db
        .select()
        .from(budgetPlanItemsTable)
        .where(inArray(budgetPlanItemsTable.budgetPlanId, planIds))
    : [];
  const itemsByPlan = new Map<number, BudgetPlanItem[]>();
  for (const item of items) {
    const list = itemsByPlan.get(item.budgetPlanId) ?? [];
    list.push(item);
    itemsByPlan.set(item.budgetPlanId, list);
  }

  for (const c of clients) {
    const plan =
      c.coupleUserId !== null ? latestByUser.get(c.coupleUserId) : undefined;
    if (!plan) continue;
    const planItems = itemsByPlan.get(plan.id) ?? [];
    let budgetTotal = 0;
    let undecidedTotal = 0;
    let pendingCount = 0;
    let decidedCount = 0;
    for (const item of planItems) {
      budgetTotal += item.estimatedCost;
      if (item.chosenVendorTierId === null) {
        undecidedTotal += item.estimatedCost;
        pendingCount += 1;
      } else {
        decidedCount += 1;
      }
    }
    result.set(c.id, {
      hasPlan: true,
      budgetTotal,
      undecidedTotal,
      pendingCount,
      decidedCount,
      plan,
      items: planItems,
    });
  }

  return result;
}

/** Shape one client + its stats into the summary contract. */
function toSummary(c: OrganizerClient, stats: PlanStats) {
  return {
    id: c.id,
    clientName: c.clientName,
    weddingDate: c.weddingDate,
    status: c.status,
    notes: c.notes,
    linked: c.coupleUserId !== null,
    hasPlan: stats.hasPlan,
    budgetTotal: stats.budgetTotal,
    undecidedTotal: stats.undecidedTotal,
    pendingCount: stats.pendingCount,
    decidedCount: stats.decidedCount,
    daysUntilWedding: daysUntil(c.weddingDate),
  };
}

// GET /organizer/clients — the organizer's client roster with budget snapshots.
router.get("/organizer/clients", async (req, res): Promise<void> => {
  const userId = await requireOrganizerUser(req, res);
  if (userId === null) return;

  const clients = await db
    .select()
    .from(organizerClientsTable)
    .where(eq(organizerClientsTable.organizerUserId, userId));
  clients.sort(byWeddingDate);

  const stats = await planStatsByClient(clients);
  const summaries = clients.map((c) =>
    toSummary(c, stats.get(c.id) ?? EMPTY_STATS),
  );

  res.json(ListOrganizerClientsResponse.parse(summaries));
});

// POST /organizer/clients — add a client, optionally linking a couple by email.
router.post("/organizer/clients", async (req, res): Promise<void> => {
  const userId = await requireOrganizerUser(req, res);
  if (userId === null) return;

  const parsed = CreateOrganizerClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;

  const clientName = data.clientName.trim();
  if (clientName.length === 0) {
    res.status(400).json({ error: "Client name is required" });
    return;
  }

  // Wedding date is optional; when present it must be a real calendar date.
  let weddingDate: string | null = null;
  if (data.weddingDate != null && data.weddingDate.trim().length > 0) {
    const value = data.weddingDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      res.status(400).json({ error: "Wedding date must be YYYY-MM-DD" });
      return;
    }
    weddingDate = value;
  }

  const notes =
    data.notes != null && data.notes.trim().length > 0
      ? data.notes.trim()
      : null;

  // Optional link via the couple's budget-plan share token. Possession of the
  // token is the couple's consent to share — the same capability the public
  // read-only share page relies on — so we never link by guessable identifiers
  // like email. A supplied-but-invalid token is a user error, so surface it.
  let coupleUserId: number | null = null;
  if (data.shareToken != null && data.shareToken.trim().length > 0) {
    const token = data.shareToken.trim();
    const [plan] = await db
      .select()
      .from(budgetPlansTable)
      .where(eq(budgetPlansTable.shareToken, token));
    if (!plan) {
      res.status(400).json({ error: "Share link not found" });
      return;
    }
    coupleUserId = plan.userId;
  }

  const [client] = await db
    .insert(organizerClientsTable)
    .values({
      organizerUserId: userId,
      coupleUserId,
      clientName,
      weddingDate,
      notes,
    })
    .returning();

  const stats = await planStatsByClient([client]);
  res
    .status(201)
    .json(
      CreateOrganizerClientResponse.parse(
        toSummary(client, stats.get(client.id) ?? EMPTY_STATS),
      ),
    );
});

// GET /organizer/clients/:id — a client with plan, chosen tiers, and pending.
router.get("/organizer/clients/:id", async (req, res): Promise<void> => {
  const userId = await requireOrganizerUser(req, res);
  if (userId === null) return;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const [client] = await db
    .select()
    .from(organizerClientsTable)
    .where(
      and(
        eq(organizerClientsTable.id, id),
        eq(organizerClientsTable.organizerUserId, userId),
      ),
    );
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const stats = (await planStatsByClient([client])).get(client.id) ?? EMPTY_STATS;

  // Resolve vendor + tier names for the decided categories.
  const chosenTierIds = stats.items
    .map((i) => i.chosenVendorTierId)
    .filter((v): v is number => v !== null);
  const tierInfo = new Map<
    number,
    { tierName: string; vendorName: string | null }
  >();
  if (chosenTierIds.length > 0) {
    const rows = await db
      .select({
        tierId: vendorTiersTable.id,
        tierName: vendorTiersTable.tierName,
        vendorName: vendorsTable.businessName,
      })
      .from(vendorTiersTable)
      .leftJoin(vendorsTable, eq(vendorTiersTable.vendorId, vendorsTable.id))
      .where(inArray(vendorTiersTable.id, chosenTierIds));
    for (const r of rows) {
      tierInfo.set(r.tierId, {
        tierName: r.tierName,
        vendorName: r.vendorName,
      });
    }
  }

  const chosenTiers = stats.items
    .filter((i) => i.chosenVendorTierId !== null)
    .map((i) => {
      const info = tierInfo.get(i.chosenVendorTierId as number);
      const tierName = info?.tierName ?? null;
      const tierLevel =
        tierName && (TIER_LEVELS as readonly string[]).includes(tierName)
          ? tierName
          : null;
      return {
        category: i.category,
        tierLevel,
        tierName,
        vendorName: info?.vendorName ?? null,
        estimatedCost: i.estimatedCost,
      };
    });

  const pendingCategories = stats.items
    .filter((i) => i.chosenVendorTierId === null)
    .map((i) => ({ category: i.category, estimatedCost: i.estimatedCost }));

  const plan = stats.plan
    ? {
        city: stats.plan.city,
        guestCount: stats.plan.guestCount,
        totalBudget: stats.plan.totalBudget,
        estimatedTotal: stats.budgetTotal ?? 0,
        undecidedTotal: stats.undecidedTotal ?? 0,
        createdAt: stats.plan.createdAt,
      }
    : null;

  res.json(
    GetOrganizerClientResponse.parse({
      id: client.id,
      clientName: client.clientName,
      weddingDate: client.weddingDate,
      status: client.status,
      notes: client.notes,
      linked: client.coupleUserId !== null,
      daysUntilWedding: daysUntil(client.weddingDate),
      plan,
      chosenTiers,
      pendingCategories,
    }),
  );
});

// GET /organizer/summary — upcoming weddings + unresolved clients for outreach.
router.get("/organizer/summary", async (req, res): Promise<void> => {
  const userId = await requireOrganizerUser(req, res);
  if (userId === null) return;

  const clients = await db
    .select()
    .from(organizerClientsTable)
    .where(eq(organizerClientsTable.organizerUserId, userId));

  const stats = await planStatsByClient(clients);

  const upcoming = clients
    .map((c) => ({ client: c, days: daysUntil(c.weddingDate) }))
    .filter(
      (x): x is { client: OrganizerClient; days: number } =>
        x.days !== null && x.days >= 0 && x.days <= UPCOMING_WINDOW_DAYS,
    )
    .sort((a, b) => a.days - b.days)
    .map(({ client, days }) => ({
      id: client.id,
      clientName: client.clientName,
      weddingDate: client.weddingDate as string,
      daysUntilWedding: days,
      status: client.status,
      pendingCount: (stats.get(client.id) ?? EMPTY_STATS).pendingCount,
    }));

  const unresolvedClientCount = clients.filter((c) => {
    const s = stats.get(c.id) ?? EMPTY_STATS;
    return s.hasPlan && s.pendingCount > 0;
  }).length;

  res.json(
    GetOrganizerSummaryResponse.parse({
      totalClients: clients.length,
      upcomingCount: upcoming.length,
      unresolvedClientCount,
      upcoming,
    }),
  );
});

export default router;
