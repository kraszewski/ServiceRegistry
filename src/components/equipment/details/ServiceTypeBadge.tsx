/**
 * ServiceTypeBadge Component
 * Badge displaying service type with icon and color
 */

import { Badge } from "@/components/ui/badge";
import { SERVICE_TYPE_CONFIG } from "@/lib/constants/service-types";
import type { ServiceType } from "@/types";
import { cn } from "@/lib/utils";

interface ServiceTypeBadgeProps {
  serviceType: ServiceType;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Badge component showing service type with icon and color
 */
export function ServiceTypeBadge({ serviceType, size = "md", className }: ServiceTypeBadgeProps) {
  const config = SERVICE_TYPE_CONFIG[serviceType];

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
