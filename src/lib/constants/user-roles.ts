/**
 * User role configuration
 * Maps role enum values to display properties (label, icon, variant)
 */

import { Shield, User, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/types";

export interface RoleConfig {
  label: string;
  icon: LucideIcon;
  variant: "default" | "secondary";
}

export const USER_ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  owner: {
    label: "Właściciel",
    icon: Shield,
    variant: "default",
  },
  worker: {
    label: "Pracownik",
    icon: User,
    variant: "secondary",
  },
};

/**
 * Get role display label
 */
export function getRoleLabel(role: UserRole): string {
  return USER_ROLE_CONFIG[role]?.label ?? role;
}
