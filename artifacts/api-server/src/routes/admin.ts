import { Router, type IRouter } from "express";
import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  vendorsTable,
  marketplaceProductsTable,
  ordersTable,
  orderItemsTable,
  type Order,
} from "@workspace/db";
import {
  AdminGetStatsResponse,
  AdminListVendorsResponse,
  AdminCreateVendorBody,
  AdminCreateVendorResponse,
  AdminUpdateVendorBody,
  AdminUpdateVendorResponse,
  AdminListProductsResponse,
  AdminUpdateProductBody,
  AdminUpdateProductResponse,
  AdminListOrdersResponse,
  AdminUpdateOrderStatusBody,
  AdminUpdateOrderStatusResponse,
  AdminListUsersResponse,
  AdminUpdateUserRoleBody,
  AdminUpdateUserRoleResponse,
} from "@workspace/api-zod";
import { requireRole } from "../lib/roles";
import { sellerNamesForOrders, setOrderStatus } from "../lib/orders";

const router: IRouter = Router();

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "fulfilled",
  "cancelled",
] as const;

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

// GET /admin/stats — platform-wide totals (GMV excludes cancelled orders).
router.get("/admin/stats", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const [[users], [vendors], [products], [orders], [gmv]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ n: sql<number>`count(*)::int` }).from(vendorsTable),
    db.select({ n: sql<number>`count(*)::int` }).from(marketplaceProductsTable),
    db.select({ n: sql<number>`count(*)::int` }).from(ordersTable),
    db
      .select({
        v: sql<string>`coalesce(sum(${ordersTable.totalAmount}), 0)`,
      })
      .from(ordersTable)
      .where(sql`${ordersTable.status} <> 'cancelled'`),
  ]);

  res.json(
    AdminGetStatsResponse.parse({
      totalUsers: users.n,
      totalVendors: vendors.n,
      totalProducts: products.n,
      totalOrders: orders.n,
      totalGmv: Number(gmv.v),
    }),
  );
});

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

async function productCounts(
  vendorIds: number[],
): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (vendorIds.length === 0) return map;
  const rows = await db
    .select({
      vendorId: marketplaceProductsTable.sellerVendorId,
      n: sql<number>`count(*)::int`,
    })
    .from(marketplaceProductsTable)
    .where(inArray(marketplaceProductsTable.sellerVendorId, vendorIds))
    .groupBy(marketplaceProductsTable.sellerVendorId);
  for (const r of rows) map.set(r.vendorId, r.n);
  return map;
}

async function adminVendorView(vendorId: number) {
  const [row] = await db
    .select({
      id: vendorsTable.id,
      businessName: vendorsTable.businessName,
      category: vendorsTable.category,
      city: vendorsTable.city,
      isVerified: vendorsTable.isVerified,
      isActive: vendorsTable.isActive,
      createdAt: vendorsTable.createdAt,
      ownerName: usersTable.name,
      ownerEmail: usersTable.email,
    })
    .from(vendorsTable)
    .leftJoin(usersTable, eq(vendorsTable.ownerUserId, usersTable.id))
    .where(eq(vendorsTable.id, vendorId));
  if (!row) return null;
  const counts = await productCounts([vendorId]);
  return {
    id: row.id,
    businessName: row.businessName,
    category: row.category,
    city: row.city,
    ownerName: row.ownerName ?? null,
    ownerEmail: row.ownerEmail ?? null,
    isVerified: row.isVerified,
    isActive: row.isActive,
    productCount: counts.get(row.id) ?? 0,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /admin/vendors — all vendors with owner and product count.
router.get("/admin/vendors", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const rows = await db
    .select({
      id: vendorsTable.id,
      businessName: vendorsTable.businessName,
      category: vendorsTable.category,
      city: vendorsTable.city,
      isVerified: vendorsTable.isVerified,
      isActive: vendorsTable.isActive,
      createdAt: vendorsTable.createdAt,
      ownerName: usersTable.name,
      ownerEmail: usersTable.email,
    })
    .from(vendorsTable)
    .leftJoin(usersTable, eq(vendorsTable.ownerUserId, usersTable.id))
    .orderBy(desc(vendorsTable.createdAt));

  const counts = await productCounts(rows.map((r) => r.id));

  res.json(
    AdminListVendorsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        businessName: r.businessName,
        category: r.category,
        city: r.city,
        ownerName: r.ownerName ?? null,
        ownerEmail: r.ownerEmail ?? null,
        isVerified: r.isVerified,
        isActive: r.isActive,
        productCount: counts.get(r.id) ?? 0,
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

// POST /admin/vendors — manually add a vendor (created already verified).
router.post("/admin/vendors", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const parsed = AdminCreateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;

  // Optionally attach the vendor to an existing user by email.
  let ownerUserId: number | null = null;
  if (data.ownerEmail) {
    const [owner] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, data.ownerEmail.toLowerCase()));
    if (!owner) {
      res.status(400).json({ error: "No user found with that email" });
      return;
    }
    ownerUserId = owner.id;
  }

  const [vendor] = await db
    .insert(vendorsTable)
    .values({
      ownerUserId,
      businessName: data.businessName,
      category: data.category,
      city: data.city,
      address: data.address ?? null,
      description: data.description ?? null,
      phone: data.phone ?? null,
      photos: data.photos ?? [],
      // Admin-added vendors are trusted, so they go live immediately.
      isVerified: true,
      isActive: true,
    })
    .returning();

  const view = await adminVendorView(vendor.id);
  res.status(201).json(AdminCreateVendorResponse.parse(view));
});

// PATCH /admin/vendors/:id — verify and/or deactivate a vendor.
router.patch("/admin/vendors/:id", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const parsed = AdminUpdateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const set: { isVerified?: boolean; isActive?: boolean } = {};
  if (parsed.data.isVerified !== undefined) set.isVerified = parsed.data.isVerified;
  if (parsed.data.isActive !== undefined) set.isActive = parsed.data.isActive;

  if (Object.keys(set).length > 0) {
    const updated = await db
      .update(vendorsTable)
      .set(set)
      .where(eq(vendorsTable.id, id))
      .returning({ id: vendorsTable.id });
    if (updated.length === 0) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }
  }

  const view = await adminVendorView(id);
  if (!view) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }
  res.json(AdminUpdateVendorResponse.parse(view));
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

async function adminProductView(productId: number) {
  const [row] = await db
    .select({
      id: marketplaceProductsTable.id,
      name: marketplaceProductsTable.name,
      category: marketplaceProductsTable.category,
      pricePerUnit: marketplaceProductsTable.pricePerUnit,
      unit: marketplaceProductsTable.unit,
      stockQuantity: marketplaceProductsTable.stockQuantity,
      isActive: marketplaceProductsTable.isActive,
      createdAt: marketplaceProductsTable.createdAt,
      sellerName: vendorsTable.businessName,
    })
    .from(marketplaceProductsTable)
    .leftJoin(
      vendorsTable,
      eq(marketplaceProductsTable.sellerVendorId, vendorsTable.id),
    )
    .where(eq(marketplaceProductsTable.id, productId));
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    pricePerUnit: row.pricePerUnit,
    unit: row.unit,
    stockQuantity: row.stockQuantity,
    sellerName: row.sellerName ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /admin/products — every product with its seller.
router.get("/admin/products", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const rows = await db
    .select({
      id: marketplaceProductsTable.id,
      name: marketplaceProductsTable.name,
      category: marketplaceProductsTable.category,
      pricePerUnit: marketplaceProductsTable.pricePerUnit,
      unit: marketplaceProductsTable.unit,
      stockQuantity: marketplaceProductsTable.stockQuantity,
      isActive: marketplaceProductsTable.isActive,
      createdAt: marketplaceProductsTable.createdAt,
      sellerName: vendorsTable.businessName,
    })
    .from(marketplaceProductsTable)
    .leftJoin(
      vendorsTable,
      eq(marketplaceProductsTable.sellerVendorId, vendorsTable.id),
    )
    .orderBy(desc(marketplaceProductsTable.createdAt));

  res.json(
    AdminListProductsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        pricePerUnit: r.pricePerUnit,
        unit: r.unit,
        stockQuantity: r.stockQuantity,
        sellerName: r.sellerName ?? null,
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

// PATCH /admin/products/:id — activate or deactivate a product.
router.patch("/admin/products/:id", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const parsed = AdminUpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = await db
    .update(marketplaceProductsTable)
    .set({ isActive: parsed.data.isActive })
    .where(eq(marketplaceProductsTable.id, id))
    .returning({ id: marketplaceProductsTable.id });
  if (updated.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const view = await adminProductView(id);
  res.json(AdminUpdateProductResponse.parse(view));
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

async function buildAdminOrders(orders: Order[]) {
  const ids = orders.map((o) => o.id);
  const sellerMap = await sellerNamesForOrders(ids);

  const buyerIds = [...new Set(orders.map((o) => o.buyerUserId))];
  const buyerRows = buyerIds.length
    ? await db
        .select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .where(inArray(usersTable.id, buyerIds))
    : [];
  const buyerNames = new Map(buyerRows.map((b) => [b.id, b.name]));

  const countRows = ids.length
    ? await db
        .select({
          orderId: orderItemsTable.orderId,
          n: sql<number>`count(*)::int`,
        })
        .from(orderItemsTable)
        .where(inArray(orderItemsTable.orderId, ids))
        .groupBy(orderItemsTable.orderId)
    : [];
  const counts = new Map(countRows.map((c) => [c.orderId, c.n]));

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt.toISOString(),
    buyerName: buyerNames.get(o.buyerUserId) ?? null,
    sellerName: sellerMap.get(o.id) ?? null,
    itemCount: counts.get(o.id) ?? 0,
  }));
}

// GET /admin/orders — all orders, optionally filtered by status.
router.get("/admin/orders", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const status = req.query.status;
  const statusFilter =
    typeof status === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(status)
      ? (status as (typeof ORDER_STATUSES)[number])
      : null;

  const orders = await db
    .select()
    .from(ordersTable)
    .where(statusFilter ? eq(ordersTable.status, statusFilter) : undefined)
    .orderBy(desc(ordersTable.createdAt));

  res.json(AdminListOrdersResponse.parse(await buildAdminOrders(orders)));
});

// PATCH /admin/orders/:id/status — change an order's status.
router.patch("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const parsed = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let updated: Order | null;
  try {
    updated = await setOrderStatus(id, parsed.data.status);
  } catch {
    res.status(400).json({ error: "Not enough stock to reactivate order" });
    return;
  }
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [view] = await buildAdminOrders([updated]);
  res.json(AdminUpdateOrderStatusResponse.parse(view));
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

// GET /admin/users — every user account.
router.get("/admin/users", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  res.json(
    AdminListUsersResponse.parse(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
    ),
  );
});

// PATCH /admin/users/:id/role — change a user's role.
router.patch("/admin/users/:id/role", async (req, res): Promise<void> => {
  const admin = await requireRole(req, res, "admin");
  if (!admin) return;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const parsed = AdminUpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Never allow the last admin to be demoted — that would lock everyone out of
  // the admin panel with no way back in (exactly the outage this recovers from).
  if (parsed.data.role !== "admin") {
    const [target] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (target?.role === "admin") {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(eq(usersTable.role, "admin"));
      if (n <= 1) {
        res
          .status(400)
          .json({ error: "Cannot demote the last remaining admin" });
        return;
      }
    }
  }

  const [user] = await db
    .update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(
    AdminUpdateUserRoleResponse.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }),
  );
});

export default router;
