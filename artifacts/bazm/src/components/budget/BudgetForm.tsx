import { MapPin, Users, Wallet } from "lucide-react";

import type { CityOption } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBudgetI18n } from "./useBudgetI18n";

const CITIES: CityOption[] = ["Tashkent", "Samarkand", "Bukhara", "Other"];

type Props = {
  city: CityOption | "";
  onCityChange: (city: CityOption) => void;
  guestCount: string;
  onGuestCountChange: (value: string) => void;
  totalBudget: string;
  onTotalBudgetChange: (value: string) => void;
};

/**
 * The lightweight input header for the manual picker: city, guest count, and an
 * optional total budget. Selections happen per-category below this form.
 */
export function BudgetForm({
  city,
  onCityChange,
  guestCount,
  onGuestCountChange,
  totalBudget,
  onTotalBudgetChange,
}: Props) {
  const { t, cityLabel } = useBudgetI18n();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {t("budget.city")}
          </Label>
          <Select
            value={city || undefined}
            onValueChange={(v) => onCityChange(v as CityOption)}
          >
            <SelectTrigger className="h-12 bg-background" data-testid="select-city">
              <SelectValue placeholder={t("budget.form.cityPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {cityLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {t("budget.guestCount")}
          </Label>
          <Input
            type="number"
            min={1}
            max={5000}
            inputMode="numeric"
            placeholder={t("budget.form.guestCountPlaceholder")}
            value={guestCount}
            onChange={(e) => onGuestCountChange(e.target.value)}
            className="h-12 bg-background"
            data-testid="input-guest-count"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          {t("budget.totalBudget")}
        </Label>
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder={t("budget.form.totalBudgetPlaceholder")}
          value={totalBudget}
          onChange={(e) => onTotalBudgetChange(e.target.value)}
          className="h-12 bg-background"
          data-testid="input-total-budget"
        />
      </div>
    </div>
  );
}
