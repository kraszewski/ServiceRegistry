/**
 * CategoryBadge Component
 * Displays equipment category with icon and appropriate styling
 */

import { Badge } from "@/components/ui/badge";
import { EQUIPMENT_CATEGORY_CONFIG } from "@/lib/constants/equipment-categories";
import type { EquipmentCategory } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: EquipmentCategory;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Badge component showing equipment category with icon and color
 */
export function CategoryBadge({ category, size = "md", className }: CategoryBadgeProps) {
  const config = EQUIPMENT_CATEGORY_CONFIG[category];

  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Badge
      variant="secondary"
      className={cn("inline-flex items-center gap-1.5 font-medium", config.colorClass, textSize, className)}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </Badge>
  );
}
