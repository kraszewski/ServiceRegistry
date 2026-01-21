/**
 * RoleBadge Component
 * Displays user role with icon and appropriate styling
 */

import { Badge } from "@/components/ui/badge";
import { USER_ROLE_CONFIG } from "@/lib/constants/user-roles";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Badge component showing user role with icon and color
 */
export function RoleBadge({ role, size = "md", className }: RoleBadgeProps) {
  const config = USER_ROLE_CONFIG[role];

  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Badge variant={config.variant} className={cn("inline-flex items-center gap-1.5 font-medium", textSize, className)}>
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </Badge>
  );
}
