import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, marketplaceProductsTable, vendorsTable } from "@workspace/db";
import { ListMarketplaceProductsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /marketplace/products — active catalog, optionally filtered by category.
router.get("/marketplace/products", async (req, res): Promise<void> => {
  const filters = [eq(marketplaceProductsTable.isActive, true)];

  const { category } = req.query;
  if (typeof category === "string" && category.length > 0) {
    filters.push(eq(marketplaceProductsTable.category, category));
  }

  const rows = await db
    .select({
      id: marketplaceProductsTable.id,
      name: marketplaceProductsTable.name,
      category: marketplaceProductsTable.category,
      pricePerUnit: marketplaceProductsTable.pricePerUnit,
      unit: marketplaceProductsTable.unit,
      stockQuantity: marketplaceProductsTable.stockQuantity,
      description: marketplaceProductsTable.description,
      photos: marketplaceProductsTable.photos,
      sellerName: vendorsTable.businessName,
    })
    .from(marketplaceProductsTable)
    .leftJoin(
      vendorsTable,
      eq(marketplaceProductsTable.sellerVendorId, vendorsTable.id),
    )
    .where(and(...filters))
    .orderBy(asc(marketplaceProductsTable.category), asc(marketplaceProductsTable.name));

  res.json(ListMarketplaceProductsResponse.parse(rows));
});

export default router;
