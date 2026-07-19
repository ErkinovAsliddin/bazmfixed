import type { ManualPlanView } from "@workspace/api-client-react";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { SufficiencyCheck } from "./SufficiencyCheck";

/**
 * The saved manual-plan view: a calm sufficiency summary followed by the
 * per-category vendor breakdown. Used on the plan detail and shared pages.
 */
export function BudgetResults({ plan }: { plan: ManualPlanView }) {
  return (
    <div className="space-y-6">
      <SufficiencyCheck
        status={plan.status}
        difference={plan.difference}
        estimatedTotal={plan.estimatedTotal}
        totalBudget={plan.totalBudget}
      />
      <CategoryBreakdown plan={plan} />
    </div>
  );
}
