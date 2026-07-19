import { Router, type IRouter } from "express";
import { asc, eq, inArray } from "drizzle-orm";
import {
  db,
  cartItemsTable,
  marketplaceProductsTable,
  vendorsTable,
} from "@workspace/db";
import { GetCartResponse, ReplaceCartBody, ReplaceCartResponse } from "@workspace/api-zod";
import { requireUser } from "../lib/roles";

const router: IRouter = Router();

/** Build the cart view for a user, dropping products that are no longer sold. */
async function buildCartView(userId: number) {
  const rows = await db
    .select({
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      name: marketplaceProductsTable.name,
      category: marketplaceProductsTable.category,
      pricePerUnit: marketplaceProductsTable.pricePerUnit,
      unit: marketplaceProductsTable.unit,
      stockQuantity: marketplaceProductsTable.stockQuantity,
      photos: marketplaceProductsTable.photos,
      isActive: marketplaceProductsTable.isActive,
      sellerName: vendorsTable.businessName,
      vendorActive: vendorsTable.isActive,
    })
    .from(cartItemsTable)
    .innerJoin(
      marketplaceProductsTable,
      eq(cartItemsTable.productId, marketplaceProductsTable.id),
    )
    .leftJoin(
      vendorsTable,
      eq(marketplaceProductsTable.sellerVendorId, vendorsTable.id),
    )
    .where(eq(cartItemsTable.userId, userId))
    .orderBy(asc(marketplaceProductsTable.name));

  const items = rows
    .filter((r) => r.isActive && r.vendorActive !== false)
    .map((r) => ({
      productId: r.productId,
      name: r.name,
      category: r.category,
      pricePerUnit: r.pricePerUnit,
      unit: r.unit,
      quantity: r.quantity,
      stockQuantity: r.stockQuantity,
      photo: r.photos?.[0] ?? null,
      sellerName: r.sellerName ?? null,
      lineTotal: r.pricePerUnit * r.quantity,
    }));

  const total = items.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = items.reduce((s, l) => s + l.quantity, 0);
  return { items, total, itemCount };
}

// GET /cart — the signed-in user's cart with product details and totals.
router.get("/cart", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(GetCartResponse.parse(await buildCartView(user.id)));
});

// PUT /cart — replace the cart with the given items (quantities clamped to
// stock; inactive products and out-of-stock lines are dropped).
router.put("/cart", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parsed = ReplaceCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Dedupe by product id (last wins), keep positive integer quantities.
  const wanted = new Map<number, number>();
  for (const it of parsed.data.items) {
    if (!Number.isInteger(it.productId) || it.productId <= 0) continue;
    const q = Math.floor(it.quantity);
    if (!Number.isFinite(q) || q <= 0) continue;
    wanted.set(it.productId, q);
  }

  const ids = [...wanted.keys()];
  const valid: { userId: number; productId: number; quantity: number }[] = [];
  if (ids.length > 0) {
    const prods = await db
      .select({
        id: marketplaceProductsTable.id,
        stockQuantity: marketplaceProductsTable.stockQuantity,
        isActive: marketplaceProductsTable.isActive,
        vendorActive: vendorsTable.isActive,
      })
      .from(marketplaceProductsTable)
      .leftJoin(
        vendorsTable,
        eq(marketplaceProductsTable.sellerVendorId, vendorsTable.id),
      )
      .where(inArray(marketplaceProductsTable.id, ids));

    for (const p of prods) {
      if (!p.isActive || p.vendorActive === false) continue;
      if (p.stockQuantity <= 0) continue;
      valid.push({
        userId: user.id,
        productId: p.id,
        quantity: Math.min(wanted.get(p.id) ?? 0, p.stockQuantity),
      });
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(cartItemsTable).where(eq(cartItemsTable.userId, user.id));
    if (valid.length > 0) {
      await tx.insert(cartItemsTable).values(valid);
    }
  });

  res.json(ReplaceCartResponse.parse(await buildCartView(user.id)));
});

export default router;
