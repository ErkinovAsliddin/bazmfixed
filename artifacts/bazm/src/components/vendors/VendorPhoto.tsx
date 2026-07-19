import {
  Building2,
  UtensilsCrossed,
  Flower2,
  Music,
  Camera,
  Shirt,
  Package,
  Gift,
  type LucideIcon,
} from "lucide-react";
import { cn, resolvePhotoSrc } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  venue: Building2,
  catering: UtensilsCrossed,
  decor: Flower2,
  music: Music,
  photography: Camera,
  clothing: Shirt,
  rental_items: Package,
  wedding_products: Gift,
};

/**
 * A vendor/tier image. Renders the real photo when one exists, otherwise a
 * styled, category-specific placeholder (no fake stock URLs are seeded).
 */
export function VendorPhoto({
  photo,
  category,
  className,
  iconClassName,
}: {
  photo?: string | null;
  category: string;
  className?: string;
  iconClassName?: string;
}) {
  if (photo) {
    return (
      <img
        src={resolvePhotoSrc(photo)}
        alt=""
        loading="lazy"
        className={cn("object-cover", className)}
      />
    );
  }

  const Icon = CATEGORY_ICONS[category] ?? Building2;
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/15",
        className,
      )}
    >
      <Icon
        className={cn("h-10 w-10 text-primary/40", iconClassName)}
        strokeWidth={1.5}
      />
    </div>
  );
}
