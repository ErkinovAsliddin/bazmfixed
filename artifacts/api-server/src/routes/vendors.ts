import { Router, type IRouter, type Request } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  vendorsTable,
  vendorTiersTable,
  vendorInquiriesTable,
  type VendorTier,
  type Vendor,
} from "@workspace/db";
import {
  ListVendorsResponse,
  GetCategoryComparisonResponse,
  GetVendorResponse,
  CreateVendorInquiryBody,
  CreateVendorInquiryResponse,
  GetMyVendorResponse,
  UpsertMyVendorBody,
  UpsertMyVendorResponse,
  CreateMyVendorTierBody,
  CreateMyVendorTierResponse,
  UpdateMyVendorTierBody,
  UpdateMyVendorTierResponse,
} from "@workspace/api-zod";
import { getSessionUserId } from "../lib/auth";

const router: IRouter = Router();

const VENDOR_CATEGORIES = [
  "venue",
  "catering",
  "decor",
  "music",
  "photography",
  "clothing",
  "rental_items",
  "wedding_products",
] as const;

type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

function isVendorCategory(value: unknown): value is VendorCategory {
  return (
    typeof value === "string" &&
    (VENDOR_CATEGORIES as readonly string[]).includes(value)
  );
}

/** Total cost of a tier at a guest count, based on its unit type. */
function tierCost(tier: VendorTier, guestCount: number): number {
  return tier.unitType === "per_guest"
    ? tier.pricePerUnit * guestCount
    : tier.pricePerUnit;
}

/** Fetch all tiers for a set of vendors, grouped by vendorId. */
async function tiersByVendor(
  vendorIds: number[],
): Promise<Map<number, VendorTier[]>> {
  const map = new Map<number, VendorTier[]>();
  if (vendorIds.length === 0) return map;
  const tiers = await db
    .select()
    .from(vendorTiersTable)
    .where(inArray(vendorTiersTable.vendorId, vendorIds));
  for (const tier of tiers) {
    const list = map.get(tier.vendorId) ?? [];
    list.push(tier);
    map.set(tier.vendorId, list);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Public marketplace
// ---------------------------------------------------------------------------

// GET /vendors — list vendors, optionally filtered by category and city.
router.get("/vendors", async (req, res): Promise<void> => {
  // Couples only ever see approved, active vendors. Unverified onboarding
  // submissions stay hidden until an admin approves them.
  const filters = [
    eq(vendorsTable.isVerified, true),
    eq(vendorsTable.isActive, true),
  ];
  const { category, city } = req.query;
  if (isVendorCategory(category)) {
    filters.push(eq(vendorsTable.category, category));
  }
  if (typeof city === "string" && city.length > 0) {
    filters.push(eq(vendorsTable.city, city));
  }

  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(vendorsTable.isVerified), vendorsTable.businessName);

  const tierMap = await tiersByVendor(vendors.map((v) => v.id));

  const summaries = vendors.map((v) => {
    const tiers = tierMap.get(v.id) ?? [];
    const cheapest = [...tiers].sort(
      (a, b) => a.pricePerUnit - b.pricePerUnit,
    )[0];
    const photo = tiers.flatMap((t) => t.photos)[0] ?? null;
    return {
      id: v.id,
      businessName: v.businessName,
      category: v.category,
      city: v.city,
      description: v.description,
      isVerified: v.isVerified,
      startingPrice: cheapest ? cheapest.pricePerUnit : null,
      startingUnit: cheapest ? cheapest.unitType : null,
      photo: v.photos[0] ?? photo,
      photos: v.photos,
      tierCount: tiers.length,
    };
  });

  res.json(ListVendorsResponse.parse(summaries));
});

// GET /vendors/category/:category — every vendor's tiers for one category.
router.get(
  "/vendors/category/:category",
  async (req, res): Promise<void> => {
    const category = req.params.category;
    if (!isVendorCategory(category)) {
      res.status(404).json({ error: "Unknown category" });
      return;
    }

    const cityFilter =
      typeof req.query.city === "string" && req.query.city.length > 0
        ? req.query.city
        : null;
    const guestCountRaw = Number(req.query.guestCount);
    const guestCount =
      Number.isFinite(guestCountRaw) && guestCountRaw >= 1
        ? Math.floor(guestCountRaw)
        : null;

    const filters = [
      eq(vendorsTable.category, category),
      eq(vendorsTable.isVerified, true),
      eq(vendorsTable.isActive, true),
    ];
    if (cityFilter) filters.push(eq(vendorsTable.city, cityFilter));

    const vendors = await db
      .select()
      .from(vendorsTable)
      .where(and(...filters));
    const tierMap = await tiersByVendor(vendors.map((v) => v.id));
    const vendorById = new Map(vendors.map((v) => [v.id, v]));

    const rows = [];
    for (const vendor of vendors) {
      for (const tier of tierMap.get(vendor.id) ?? []) {
        rows.push({
          vendorId: vendor.id,
          vendorName: vendor.businessName,
          vendorCity: vendor.city,
          isVerified: vendor.isVerified,
          tierId: tier.id,
          tierName: tier.tierName,
          unitType: tier.unitType,
          pricePerUnit: tier.pricePerUnit,
          description: tier.description,
          photos: tier.photos,
          estimatedCost:
            guestCount !== null ? tierCost(tier, guestCount) : null,
        });
      }
    }
    void vendorById;

    rows.sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    res.json(
      GetCategoryComparisonResponse.parse({
        category,
        guestCount,
        tiers: rows,
      }),
    );
  },
);

// GET /vendors/:id — one vendor with all tiers (no phone; phone via inquiry).
router.get("/vendors/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, id));
  // Only approved, active vendors are publicly viewable.
  if (!vendor || !vendor.isVerified || !vendor.isActive) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const tiers = await db
    .select()
    .from(vendorTiersTable)
    .where(eq(vendorTiersTable.vendorId, id))
    .orderBy(vendorTiersTable.pricePerUnit);

  res.json(
    GetVendorResponse.parse({
      id: vendor.id,
      businessName: vendor.businessName,
      category: vendor.category,
      city: vendor.city,
      address: vendor.address,
      description: vendor.description,
      phone: vendor.phone,
      photos: vendor.photos,
      isVerified: vendor.isVerified,
      tiers,
    }),
  );
});

// POST /vendors/:id/inquiries — log an inquiry, reveal the contact phone.
router.post("/vendors/:id/inquiries", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const parsed = CreateVendorInquiryBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, id));
  // Only verified, active vendors are publicly reachable — an inquiry returns
  // the vendor's contact phone, so unapproved/inactive vendors must 404 here
  // too, matching the public read gating elsewhere.
  if (!vendor || !vendor.isVerified || !vendor.isActive) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  await db.insert(vendorInquiriesTable).values({
    vendorId: id,
    userId: getSessionUserId(req),
    message: parsed.data.message ?? null,
  });

  res.status(201).json(
    CreateVendorInquiryResponse.parse({
      vendorId: vendor.id,
      businessName: vendor.businessName,
      phone: vendor.phone,
    }),
  );
});

// ---------------------------------------------------------------------------
// Vendor dashboard (role=vendor)
// ---------------------------------------------------------------------------

/**
 * Resolve the signed-in user and require the `vendor` role. Writes the
 * appropriate error response and returns null when the check fails.
 */
async function requireVendorUser(
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
  if (!user || user.role !== "vendor") {
    res.status(403).json({ error: "Not a vendor account" });
    return null;
  }
  return userId;
}

/** The vendor row owned by a user, or null. */
async function ownedVendor(userId: number): Promise<Vendor | null> {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.ownerUserId, userId));
  return vendor ?? null;
}

// GET /vendor/me — profile, tiers, and inquiry count.
router.get("/vendor/me", async (req, res): Promise<void> => {
  const userId = await requireVendorUser(req, res);
  if (userId === null) return;

  const vendor = await ownedVendor(userId);
  if (!vendor) {
    res.json(GetMyVendorResponse.parse({ inquiryCount: 0, vendor: null }));
    return;
  }

  const tiers = await db
    .select()
    .from(vendorTiersTable)
    .where(eq(vendorTiersTable.vendorId, vendor.id))
    .orderBy(vendorTiersTable.pricePerUnit);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vendorInquiriesTable)
    .where(eq(vendorInquiriesTable.vendorId, vendor.id));

  res.json(
    GetMyVendorResponse.parse({
      inquiryCount: count,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        category: vendor.category,
        city: vendor.city,
        address: vendor.address,
        description: vendor.description,
        phone: vendor.phone,
        photos: vendor.photos,
        isVerified: vendor.isVerified,
        tiers,
      },
    }),
  );
});

// PUT /vendor/me — create or update the vendor's own profile.
router.put("/vendor/me", async (req, res): Promise<void> => {
  const userId = await requireVendorUser(req, res);
  if (userId === null) return;

  const parsed = UpsertMyVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;

  // Real onboarding requires a genuine address and at least two photos. The
  // zod schema enforces min 2, but guard here too so a stale client can't slip
  // an under-filled profile past the approval gate.
  if (data.photos.length < 2) {
    res.status(400).json({ error: "Please upload at least 2 photos" });
    return;
  }

  const existing = await ownedVendor(userId);
  let vendor: Vendor;
  if (existing) {
    [vendor] = await db
      .update(vendorsTable)
      .set({
        businessName: data.businessName,
        category: data.category,
        city: data.city,
        address: data.address,
        description: data.description ?? null,
        phone: data.phone ?? null,
        photos: data.photos,
      })
      .where(eq(vendorsTable.id, existing.id))
      .returning();
  } else {
    [vendor] = await db
      .insert(vendorsTable)
      .values({
        ownerUserId: userId,
        businessName: data.businessName,
        category: data.category,
        city: data.city,
        address: data.address,
        description: data.description ?? null,
        phone: data.phone ?? null,
        photos: data.photos,
        // Self-created vendors start unverified; verification is granted
        // out-of-band, like admin roles.
        isVerified: false,
      })
      .returning();
  }

  const tiers = await db
    .select()
    .from(vendorTiersTable)
    .where(eq(vendorTiersTable.vendorId, vendor.id))
    .orderBy(vendorTiersTable.pricePerUnit);

  res.json(
    UpsertMyVendorResponse.parse({
      id: vendor.id,
      businessName: vendor.businessName,
      category: vendor.category,
      city: vendor.city,
      address: vendor.address,
      description: vendor.description,
      phone: vendor.phone,
      photos: vendor.photos,
      isVerified: vendor.isVerified,
      tiers,
    }),
  );
});

// POST /vendor/me/tiers — add a tier to the vendor's profile.
router.post("/vendor/me/tiers", async (req, res): Promise<void> => {
  const userId = await requireVendorUser(req, res);
  if (userId === null) return;

  const parsed = CreateMyVendorTierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const vendor = await ownedVendor(userId);
  if (!vendor) {
    res.status(400).json({ error: "Create your vendor profile first" });
    return;
  }

  const [tier] = await db
    .insert(vendorTiersTable)
    .values({
      vendorId: vendor.id,
      tierName: parsed.data.tierName,
      pricePerUnit: parsed.data.pricePerUnit,
      unitType: parsed.data.unitType,
      description: parsed.data.description ?? null,
      photos: parsed.data.photos ?? [],
    })
    .returning();

  res.status(201).json(CreateMyVendorTierResponse.parse(tier));
});

// PUT /vendor/me/tiers/:tierId — update one of the vendor's own tiers.
router.put("/vendor/me/tiers/:tierId", async (req, res): Promise<void> => {
  const userId = await requireVendorUser(req, res);
  if (userId === null) return;

  const tierId = parseInt(req.params.tierId, 10);
  if (Number.isNaN(tierId)) {
    res.status(404).json({ error: "Tier not found" });
    return;
  }

  const parsed = UpdateMyVendorTierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const vendor = await ownedVendor(userId);
  if (!vendor) {
    res.status(404).json({ error: "Tier not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(vendorTiersTable)
    .where(
      and(
        eq(vendorTiersTable.id, tierId),
        eq(vendorTiersTable.vendorId, vendor.id),
      ),
    );
  if (!existing) {
    res.status(404).json({ error: "Tier not found" });
    return;
  }

  const [tier] = await db
    .update(vendorTiersTable)
    .set({
      tierName: parsed.data.tierName,
      pricePerUnit: parsed.data.pricePerUnit,
      unitType: parsed.data.unitType,
      description: parsed.data.description ?? null,
      photos: parsed.data.photos ?? [],
    })
    .where(eq(vendorTiersTable.id, tierId))
    .returning();

  res.json(UpdateMyVendorTierResponse.parse(tier));
});

// DELETE /vendor/me/tiers/:tierId — remove one of the vendor's own tiers.
router.delete("/vendor/me/tiers/:tierId", async (req, res): Promise<void> => {
  const userId = await requireVendorUser(req, res);
  if (userId === null) return;

  const tierId = parseInt(req.params.tierId, 10);
  if (Number.isNaN(tierId)) {
    res.status(404).json({ error: "Tier not found" });
    return;
  }

  const vendor = await ownedVendor(userId);
  if (!vendor) {
    res.status(404).json({ error: "Tier not found" });
    return;
  }

  const deleted = await db
    .delete(vendorTiersTable)
    .where(
      and(
        eq(vendorTiersTable.id, tierId),
        eq(vendorTiersTable.vendorId, vendor.id),
      ),
    )
    .returning({ id: vendorTiersTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "Tier not found" });
    return;
  }

  res.status(204).end();
});

export default router;
