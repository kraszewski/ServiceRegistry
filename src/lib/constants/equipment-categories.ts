/**
 * Equipment category configuration
 * Maps category enum values to display properties (label, icon, styling)
 */

import { Monitor, Printer, Network, Phone, Tablet, Usb, Box, type LucideIcon } from "lucide-react";
import type { EquipmentCategory } from "@/types";

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  colorClass: string;
}

export const EQUIPMENT_CATEGORY_CONFIG: Record<EquipmentCategory, CategoryConfig> = {
  computer: {
    label: "Komputer",
    icon: Monitor,
    colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  printer: {
    label: "Drukarka",
    icon: Printer,
    colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  monitor: {
    label: "Monitor",
    icon: Monitor,
    colorClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  },
  network_device: {
    label: "Urządzenie sieciowe",
    icon: Network,
    colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  phone: {
    label: "Telefon",
    icon: Phone,
    colorClass: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  },
  tablet: {
    label: "Tablet",
    icon: Tablet,
    colorClass: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  peripheral: {
    label: "Peryferia",
    icon: Usb,
    colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
  other: {
    label: "Inne",
    icon: Box,
    colorClass: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  },
};

/**
 * Get category display label
 */
export function getCategoryLabel(category: EquipmentCategory): string {
  return EQUIPMENT_CATEGORY_CONFIG[category]?.label ?? category;
}

/**
 * Get all category options for select/combobox
 */
export function getCategoryOptions(): { value: EquipmentCategory; label: string }[] {
  return Object.entries(EQUIPMENT_CATEGORY_CONFIG).map(([value, config]) => ({
    value: value as EquipmentCategory,
    label: config.label,
  }));
}
