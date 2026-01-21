/**
 * UserRowActions Component
 * Action buttons for user table rows
 */

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserListItemDTO } from "@/types";

interface UserRowActionsProps {
  user: UserListItemDTO;
  currentUserId: string;
  onDelete: (user: UserListItemDTO) => void;
}

/**
 * Action buttons displayed in table row
 * Handles conditional rendering based on user role and ownership
 */
export function UserRowActions({ user, currentUserId, onDelete }: UserRowActionsProps) {
  // Don't show delete button for owners
  if (user.role === "owner") {
    return null;
  }

  // Show disabled button with tooltip for own account
  const isOwnAccount = user.id === currentUserId;

  if (isOwnAccount) {
    return (
      <div className="flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled
                  aria-label="Usuń użytkownika"
                  aria-disabled="true"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Nie możesz usunąć własnego konta</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Show active delete button
  return (
    <div className="flex justify-end">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(user);
        }}
        aria-label="Usuń użytkownika"
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
