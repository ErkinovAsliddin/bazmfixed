import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  cartItemsTable,
  marketplaceProductsTable,
  vendorsTable,
  ordersTable,
  orderItemsTable,
  type Order,
} from "@workspace/db";
import {
  CheckoutCartResponse,
  ListMyPurchasesResponse,
  CancelMyOrderResponse,
} from "@workspace/api-zod";
import { requireUser } from "../lib/roles";
import {
  orderItemViews,
  sellerNamesForOrders,
  setOrderStatus,
} from "../lib/orders";

const router: IRouter = Router();

async function buildBuyerOrders(orders: Order[]) {
  const ids = orders.map((o) => o.id);
  const itemsMap = await orderItemViews(ids);
  const sellerMap = await sellerNamesForOrders(ids);
  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt.toISOString(),
    sellerName: sellerMap.get(o.id) ?? null,
    items: itemsMap.get(o.id) ?? [],
  }));
}

// POST /orders/checkout — turn the cart into one order per seller, decrement
// stock, and clear the cart. No payment gateway: orders start `pending`.
router.post("/orders/checkout", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const result = await db.transaction(async (tx) => {
    const rows = await tx
      .select({
        productId: cartItemsTable.productId,
        quantity: cartItemsTable.quantity,
        name: marketplaceProductsTable.name,
        pricePerUnit: marketplaceProductsTable.pricePerUnit,
        stockQuantity: marketplaceProductsTable.stockQuantity,
        isActive: marketplaceProductsTable.isActive,
        sellerVendorId: marketplaceProductsTable.sellerVendorId,
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
      .where(eq(cartItemsTable.userId, user.id));

    const usable = rows.filter(
      (r) => r.isActive && r.vendorActive !== false,
    );
    if (usable.length === 0) {
      return { kind: "empty" as const };
    }

    const insufficient = usable.filter((r) => r.quantity > r.stockQuantity);
    if (insufficient.length > 0) {
      return {
        kind: "stock" as const,
        names: insufficient.map((r) => r.name),
      };
    }

    // Group cart lines by seller so each order has a single vendor.
    const groups = new Map<number, typeof usable>();
    for (const r of usable) {
      const list = groups.get(r.sellerVendorId) ?? [];
      list.push(r);
      groups.set(r.sellerVendorId, list);
    }

    const created: {
      id: number;
      sellerName: string | null;
      totalAmount: number;
      status: string;
    }[] = [];

    for (const [, items] of groups) {
      const total = items.reduce(
        (s, i) => s + i.pricePerUnit * i.quantity,
        0,
      );
      const [order] = await tx
        .insert(ordersTable)
        .values({ buyerUserId: user.id, status: "pending", totalAmount: total })
        .returning();

      await tx.insert(orderItemsTable).values(
        items.map((i) => ({
          orderId: order.id,
          productId: i.productId,
          quantity: i.quantity,
          unitPriceAtPurchase: i.pricePerUnit,
        })),
      );

      for (const i of items) {
        await tx
          .update(marketplaceProductsTable)
          .set({
            stockQuantity: sql`${marketplaceProductsTable.stockQuantity} - ${i.quantity}`,
          })
          .where(eq(marketplaceProductsTable.id, i.productId));
      }

      created.push({
        id: order.id,
        sellerName: items[0].sellerName ?? null,
        totalAmount: total,
        status: order.status,
      });
    }

    await tx.delete(cartItemsTable).where(eq(cartItemsTable.userId, user.id));
    return { kind: "ok" as const, created };
  });

  if (result.kind === "empty") {
    res.status(400).json({ error: "Your cart is empty" });
    return;
  }
  if (result.kind === "stock") {
    res
      .status(400)
      .json({ error: `Not enough stock: ${result.names.join(", ")}` });
    return;
  }

  const total = result.created.reduce((s, o) => s + o.totalAmount, 0);
  res.json(CheckoutCartResponse.parse({ orders: result.created, total }));
});

// GET /orders/mine — the buyer's orders, newest first.
router.get("/orders/mine", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.buyerUserId, user.id))
    .orderBy(desc(ordersTable.createdAt));

  res.json(ListMyPurchasesResponse.parse(await buildBuyerOrders(orders)));
});

// POST /orders/:id/cancel — cancel a pending order and restore stock.
router.post("/orders/:id/cancel", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));
  if (!order || order.buyerUserId !== user.id) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.status !== "pending") {
    res.status(400).json({ error: "Only pending orders can be cancelled" });
    return;
  }

  await setOrderStatus(id, "cancelled");

  const [updated] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));
  const [view] = await buildBuyerOrders([updated]);
  res.json(CancelMyOrderResponse.parse(view));
});

export default router;
