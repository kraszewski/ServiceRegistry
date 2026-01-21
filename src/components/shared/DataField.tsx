/**
 * Shared Components - DataField
 * Label-value pair for displaying data fields
 */

import { cn } from "@/lib/utils";

interface DataFieldProps {
  label: string;
  value: string | null | undefined;
  emptyText?: string;
  className?: string;
}

/**
 * Component for displaying label-value pairs in data displays
 */
export function DataField({ label, value, emptyText = "-", className }: DataFieldProps) {
  const displayValue = value?.trim() || emptyText;

  return (
    <div className={cn("space-y-1", className)}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{displayValue}</dd>
    </div>
  );
}
