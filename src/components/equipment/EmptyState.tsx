/**
 * EmptyState Component
 * Displays empty state with different variants based on context
 */

import { Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EmptyStateVariant = "no-data" | "no-results";

interface EmptyStateProps {
  variant: EmptyStateVariant;
  onAction?: () => void;
}

/**
 * Empty state component with configurable variants
 */
export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const config = {
    "no-data": {
      icon: Package,
      title: "Brak sprzętu",
      description: "Nie masz jeszcze żadnego sprzętu w bazie danych. Dodaj pierwszy sprzęt, aby rozpocząć.",
      actionLabel: "Dodaj sprzęt",
    },
    "no-results": {
      icon: Search,
      title: "Nie znaleziono sprzętu",
      description: "Nie znaleziono sprzętu spełniającego kryteria wyszukiwania. Spróbuj zmienić filtry.",
      actionLabel: "Wyczyść filtry",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">{config.title}</h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6">{config.description}</p>

      {onAction && (
        <Button onClick={onAction} variant="default">
          {config.actionLabel}
        </Button>
      )}
    </div>
  );
}
