import { Users, Clock, Calculator } from "lucide-react";
import type { SufficiencyCategory } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SUFFICIENCY_CATEGORIES, useSufficiencyI18n } from "./useSufficiencyI18n";

export interface SufficiencyFormState {
  guestCount: number;
  durationHours: number;
  categories: SufficiencyCategory[];
}

export function SufficiencyForm({
  state,
  onChange,
  onSubmit,
  loading,
}: {
  state: SufficiencyFormState;
  onChange: (next: SufficiencyFormState) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const { t, categoryLabel } = useSufficiencyI18n();

  const toggle = (key: SufficiencyCategory, checked: boolean) => {
    const set = new Set(state.categories);
    if (checked) set.add(key);
    else set.delete(key);
    onChange({ ...state, categories: [...set] });
  };

  const canSubmit =
    state.guestCount >= 1 &&
    state.durationHours >= 1 &&
    state.categories.length > 0;

  return (
    <Card className="border-2 border-primary/10">
      <CardContent className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }}
          className="space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guestCount" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {t("sufficiency.form.guestCount")}
              </Label>
              <Input
                id="guestCount"
                type="number"
                min={1}
                max={5000}
                value={state.guestCount || ""}
                onChange={(e) =>
                  onChange({
                    ...state,
                    guestCount: Math.floor(Number(e.target.value)) || 0,
                  })
                }
                data-testid="input-guest-count"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationHours" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {t("sufficiency.form.durationHours")}
              </Label>
              <Input
                id="durationHours"
                type="number"
                min={1}
                max={24}
                value={state.durationHours || ""}
                onChange={(e) =>
                  onChange({
                    ...state,
                    durationHours: Math.floor(Number(e.target.value)) || 0,
                  })
                }
                data-testid="input-duration-hours"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("sufficiency.form.categories")}</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SUFFICIENCY_CATEGORIES.map(({ key, icon: Icon }) => {
                const checked = state.categories.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      checked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    data-testid={`category-${key}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggle(key, v === true)}
                    />
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {categoryLabel(key)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit || loading}
            className="w-full sm:w-auto"
            data-testid="button-calculate"
          >
            <Calculator className="mr-2 h-4 w-4" />
            {t("sufficiency.form.calculate")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
