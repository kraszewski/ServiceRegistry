/**
 * Service Type Configurations
 * Maps service types to icons, colors, and labels
 */

import { ClipboardCheck, Wrench, Cog } from "lucide-react";
import type { ServiceType } from "@/types";
import type { LucideIcon } from "lucide-react";

export interface ServiceTypeConfig {
  icon: LucideIcon;
  label: string;
  colorClass: string;
}

export const SERVICE_TYPE_CONFIG: Record<ServiceType, ServiceTypeConfig> = {
  inspection: {
    icon: ClipboardCheck,
    label: "Przegląd",
    colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  repair: {
    icon: Wrench,
    label: "Naprawa",
    colorClass: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  maintenance: {
    icon: Cog,
    label: "Konserwacja",
    colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
};
