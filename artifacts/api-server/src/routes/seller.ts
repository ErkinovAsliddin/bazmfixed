import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  vendorsTable,
  marketplaceProductsTable,
  ordersTable,
  orderItemsTable,
  type Vendor,
  type Order,
} from "@workspace/db";
import {
  ListMyProductsResponse,
  CreateMyProductBody,
  CreateMyProductResponse,
  UpdateMyProductBody,
  UpdateMyProductResponse,
  ListMyOrdersResponse,
  UpdateMyOrderStatusBody,
  UpdateMyOrderStatusResponse,
} from "@workspace/api-zod";
import { requireRole } from "../lib/roles";
import { orderItemViews, setOrderStatus } from "../lib/orders";

const router: IRouter = Router();

/** The vendor row owned by a user, or null. */
async function ownedVendor(userId: number): Promise<Vendor | null> {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.ownerUserId, userId));
  return vendor ?? null;
}

function productView(row: {
  id: number;
  sellerVendorId: number;
  name: string;
  category: string;
  pricePerUnit: number;
  unit: string;
  stockQuantity: number;
  description: string | null;
  photos: string[];
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    sellerVendorId: row.sellerVendorId,
    name: row.name,
    category: row.category,
    pricePerUnit: row.pricePerUnit,
    unit: row.unit,
    stockQuantity: row.stockQuantity,
    description: row.description,
    photos: row.photos,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Seller products
// ---------------------------------------------------------------------------

// GET /vendor/me/products — the vendor's products, including inactive ones.
router.get("/vendor/me/products", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "vendor");
  if (!user) return;

  const vendor = await ownedVendor(user.id);
  if (!vendor) {
    res.json(ListMyProductsResponse.parse([]));
    return;
  }

  const products = await db
    .select()
    .from(marketplaceProductsTable)
    .where(eq(marketplaceProductsTable.sellerVendorId, vendor.id))
    .orderBy(desc(marketplaceProductsTable.createdAt));

  res.json(ListMyProductsResponse.parse(products.map(productView)));
});

// POST /vendor/me/products — add a product to the vendor's catalog.
router.post("/vendor/me/products", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "vendor");
  if (!user) return;

  const parsed = CreateMyProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const vendor = await ownedVendor(user.id);
  if (!vendor) {
    res.status(400).json({ error: "Create your vendor profile first" });
    return;
  }

  const d = parsed.data;
  const [product] = await db
    .insert(marketplaceProductsTable)
    .values({
      sellerVendorId: vendor.id,
      name: d.name,
      category: d.category,
      pricePerUnit: d.pricePerUnit,
      unit: d.unit,
      stockQuantity: d.stockQuantity,
      description: d.description ?? null,
      photos: d.photos ?? [],
      isActive: d.isActive ?? true,
    })
    .returning();

  res.status(201).json(CreateMyProductResponse.parse(productView(product)));
});

// PUT /vendor/me/products/:id — edit or deactivate a product.
router.put("/vendor/me/products/:id", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "vendor");
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const parsed = UpdateMyProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const vendor = await ownedVendor(user.id);
  if (!vendor) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(marketplaceProductsTable)
    .where(
      and(
        eq(marketplaceProductsTable.id, id),
        eq(marketplaceProductsTable.sellerVendorId, vendor.id),
      ),
    );
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const d = parsed.data;
  const [product] = await db
    .update(marketplaceProductsTable)
    .set({
      name: d.name,
      category: d.category,
      pricePerUnit: d.pricePerUnit,
      unit: d.unit,
      stockQuantity: d.stockQuantity,
      description: d.description ?? null,
      photos: d.photos ?? [],
      isActive: d.isActive ?? existing.isActive,
    })
    .where(eq(marketplaceProductsTable.id, id))
    .returning();

  res.json(UpdateMyProductResponse.parse(productView(product)));
});

// ---------------------------------------------------------------------------
// Seller orders
// ---------------------------------------------------------------------------

async function buildSellerOrders(orders: Order[], vendorId: number) {
  const ids = orders.map((o) => o.id);
  const itemsMap = await orderItemViews(ids, { sellerVendorId: vendorId });

  const buyerIds = [...new Set(orders.map((o) => o.buyerUserId))];
  const buyerRows = buyerIds.length
    ? await db
        .select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .where(inArray(usersTable.id, buyerIds))
    : [];
  const buyerNames = new Map(buyerRows.map((b) => [b.id, b.name]));

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt.toISOString(),
    buyerName: buyerNames.get(o.buyerUserId) ?? null,
    items: itemsMap.get(o.id) ?? [],
  }));
}

/** Order ids that contain at least one of the vendor's products. */
async function vendorOrderIds(vendorId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ orderId: orderItemsTable.orderId })
    .from(orderItemsTable)
    .innerJoin(
      marketplaceProductsTable,
      eq(orderItemsTable.productId, marketplaceProductsTable.id),
    )
    .where(eq(marketplaceProductsTable.sellerVendorId, vendorId));
  return rows.map((r) => r.orderId);
}

// GET /vendor/me/orders — incoming orders for the vendor's products.
router.get("/vendor/me/orders", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "vendor");
  if (!user) return;

  const vendor = await ownedVendor(user.id);
  if (!vendor) {
    res.json(ListMyOrdersResponse.parse([]));
    return;
  }

  const ids = await vendorOrderIds(vendor.id);
  if (ids.length === 0) {
    res.json(ListMyOrdersResponse.parse([]));
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(inArray(ordersTable.id, ids))
    .orderBy(desc(ordersTable.createdAt));

  res.json(
    ListMyOrdersResponse.parse(await buildSellerOrders(orders, vendor.id)),
  );
});

// PATCH /vendor/me/orders/:id/status — update an order's status.
router.patch(
  "/vendor/me/orders/:id/status",
  async (req, res): Promise<void> => {
    const user = await requireRole(req, res, "vendor");
    if (!user) return;

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const parsed = UpdateMyOrderStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const vendor = await ownedVendor(user.id);
    if (!vendor) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // The order must contain at least one of this vendor's products.
    const [owned] = await db
      .select({ orderId: orderItemsTable.orderId })
      .from(orderItemsTable)
      .innerJoin(
        marketplaceProductsTable,
        eq(orderItemsTable.productId, marketplaceProductsTable.id),
      )
      .where(
        and(
          eq(orderItemsTable.orderId, id),
          eq(marketplaceProductsTable.sellerVendorId, vendor.id),
        ),
      )
      .limit(1);
    if (!owned) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    try {
      const updated = await setOrderStatus(id, parsed.data.status);
      if (!updated) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
    } catch {
      res.status(400).json({ error: "Not enough stock to reactivate order" });
      return;
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    const [view] = await buildSellerOrders([order], vendor.id);
    res.json(UpdateMyOrderStatusResponse.parse(view));
  },
);

export default router;
