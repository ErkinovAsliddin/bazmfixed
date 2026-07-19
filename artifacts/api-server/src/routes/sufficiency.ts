import { Router, type IRouter } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, marketplaceProductsTable } from "@workspace/db";
import {
  CalculateSufficiencyBody,
  CalculateSufficiencyResponse,
} from "@workspace/api-zod";
import {
  BASELINE_DURATION_HOURS,
  BUFFER_PERCENT,
  PORTION_ESTIMATES,
  recommendForCategory,
  type SufficiencyCategory,
} from "../lib/portion-estimates";

const router: IRouter = Router();

/**
 * Find the marketplace product that lets a host buy the recommended amount of a
 * category (e.g. disposable tableware). Returns null when nothing matches, so
 * the "Buy the recommended quantity" shortcut only appears when it's real.
 */
async function matchProduct(
  category: SufficiencyCategory,
  recommendedQuantity: number,
) {
  const link = PORTION_ESTIMATES[category].marketplace;
  if (!link) return null;

  const filters = [
    eq(marketplaceProductsTable.isActive, true),
    eq(marketplaceProductsTable.category, link.productCategory),
  ];
  if (link.nameMatch) {
    filters.push(ilike(marketplaceProductsTable.name, `%${link.nameMatch}%`));
  }

  const [product] = await db
    .select()
    .from(marketplaceProductsTable)
    .where(and(...filters))
    .limit(1);

  if (!product) return null;

  return {
    productId: product.id,
    name: product.name,
    unit: product.unit,
    pricePerUnit: product.pricePerUnit,
    recommendedQuantity,
    totalPrice: product.pricePerUnit * recommendedQuantity,
    stockQuantity: product.stockQuantity,
    inStock: product.stockQuantity >= recommendedQuantity,
  };
}

// POST /sufficiency — "will the food/products be enough for all my guests?"
router.post("/sufficiency", async (req, res): Promise<void> => {
  const parsed = CalculateSufficiencyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { guestCount, durationHours, categories } = parsed.data;

  // The generated zod checks ranges but not integer-ness; guests/hours are
  // whole numbers, so reject fractions with a clean 400.
  if (!Number.isInteger(guestCount) || !Number.isInteger(durationHours)) {
    res.status(400).json({ error: "guestCount and durationHours must be whole numbers" });
    return;
  }

  // De-duplicate while preserving the canonical category order.
  const selected = (Object.keys(PORTION_ESTIMATES) as SufficiencyCategory[]).filter(
    (c) => categories.includes(c),
  );

  const results = [];
  for (const category of selected) {
    const rec = recommendForCategory(category, guestCount, durationHours);
    const product = await matchProduct(category, rec.recommendedAmount);
    results.push({ ...rec, product });
  }

  res.json(
    CalculateSufficiencyResponse.parse({
      guestCount,
      durationHours,
      bufferPercent: BUFFER_PERCENT,
      baselineDurationHours: BASELINE_DURATION_HOURS,
      categories: results,
    }),
  );
});

export default router;
