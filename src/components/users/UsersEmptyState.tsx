/**
 * UsersEmptyState Component
 * Displays empty state when no workers exist
 */

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsersEmptyStateProps {
  onAddUser: () => void;
}

/**
 * Empty state component for users view
 */
export function UsersEmptyState({ onAddUser }: UsersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">Brak pracowników</h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Dodaj pierwszego pracownika, aby rozpocząć współpracę.
      </p>

      <Button onClick={onAddUser} variant="default">
        Dodaj Pracownika
      </Button>
    </div>
  );
}
