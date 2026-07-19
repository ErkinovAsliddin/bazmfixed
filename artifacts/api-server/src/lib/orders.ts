import { and, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderItemsTable,
  marketplaceProductsTable,
  vendorsTable,
  type Order,
} from "@workspace/db";

export type OrderStatusValue =
  | "pending"
  | "confirmed"
  | "fulfilled"
  | "cancelled";

export interface OrderItemViewRow {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  photo: string | null;
}

/**
 * Item lines for a set of orders, keyed by order id. When `sellerVendorId` is
 * given, only items belonging to that vendor's products are returned (used by
 * the seller order views). Batched to avoid N+1.
 */
export async function orderItemViews(
  orderIds: number[],
  opts: { sellerVendorId?: number } = {},
): Promise<Map<number, OrderItemViewRow[]>> {
  const map = new Map<number, OrderItemViewRow[]>();
  if (orderIds.length === 0) return map;

  const filters = [inArray(orderItemsTable.orderId, orderIds)];
  if (opts.sellerVendorId !== undefined) {
    filters.push(eq(marketplaceProductsTable.sellerVendorId, opts.sellerVendorId));
  }

  const rows = await db
    .select({
      orderId: orderItemsTable.orderId,
      productId: orderItemsTable.productId,
      quantity: orderItemsTable.quantity,
      unitPrice: orderItemsTable.unitPriceAtPurchase,
      productName: marketplaceProductsTable.name,
      photos: marketplaceProductsTable.photos,
    })
    .from(orderItemsTable)
    .innerJoin(
      marketplaceProductsTable,
      eq(orderItemsTable.productId, marketplaceProductsTable.id),
    )
    .where(and(...filters));

  for (const r of rows) {
    const list = map.get(r.orderId) ?? [];
    list.push({
      productId: r.productId,
      productName: r.productName,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      lineTotal: r.unitPrice * r.quantity,
      photo: r.photos?.[0] ?? null,
    });
    map.set(r.orderId, list);
  }
  return map;
}

/**
 * The selling vendor's business name for each order. Orders are created one per
 * seller at checkout, so each order maps to a single vendor. Batched.
 */
export async function sellerNamesForOrders(
  orderIds: number[],
): Promise<Map<number, string | null>> {
  const map = new Map<number, string | null>();
  if (orderIds.length === 0) return map;

  const rows = await db
    .select({
      orderId: orderItemsTable.orderId,
      businessName: vendorsTable.businessName,
    })
    .from(orderItemsTable)
    .innerJoin(
      marketplaceProductsTable,
      eq(orderItemsTable.productId, marketplaceProductsTable.id),
    )
    .innerJoin(
      vendorsTable,
      eq(marketplaceProductsTable.sellerVendorId, vendorsTable.id),
    )
    .where(inArray(orderItemsTable.orderId, orderIds));

  for (const r of rows) {
    if (!map.has(r.orderId)) map.set(r.orderId, r.businessName);
  }
  return map;
}

/**
 * Update an order's status inside a transaction, applying stock effects when
 * (un)cancelling: cancelling restores stock, un-cancelling re-decrements it.
 * Returns the updated order, or null when the order does not exist. Throws
 * `Error("insufficient_stock")` if un-cancelling would oversell.
 */
export async function setOrderStatus(
  orderId: number,
  newStatus: OrderStatusValue,
): Promise<Order | null> {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId));
    if (!order) return null;

    const was = order.status;
    if (was === newStatus) return order;

    const items = await tx
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));

    if (newStatus === "cancelled" && was !== "cancelled") {
      for (const it of items) {
        await tx
          .update(marketplaceProductsTable)
          .set({
            stockQuantity: sql`${marketplaceProductsTable.stockQuantity} + ${it.quantity}`,
          })
          .where(eq(marketplaceProductsTable.id, it.productId));
      }
    } else if (was === "cancelled" && newStatus !== "cancelled") {
      for (const it of items) {
        const [prod] = await tx
          .select()
          .from(marketplaceProductsTable)
          .where(eq(marketplaceProductsTable.id, it.productId));
        if (!prod || prod.stockQuantity < it.quantity) {
          throw new Error("insufficient_stock");
        }
      }
      for (const it of items) {
        await tx
          .update(marketplaceProductsTable)
          .set({
            stockQuantity: sql`${marketplaceProductsTable.stockQuantity} - ${it.quantity}`,
          })
          .where(eq(marketplaceProductsTable.id, it.productId));
      }
    }

    const [updated] = await tx
      .update(ordersTable)
      .set({ status: newStatus })
      .where(eq(ordersTable.id, orderId))
      .returning();
    return updated;
  });
}
