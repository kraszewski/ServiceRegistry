/**
 * UserCard Component
 * Card view for mobile devices with user details and actions
 */

import { Calendar, Mail } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RoleBadge } from "./RoleBadge";
import type { UserListItemDTO } from "@/types";

interface UserCardProps {
  user: UserListItemDTO;
  currentUserId: string;
  onDelete: (user: UserListItemDTO) => void;
}

/**
 * Format date to Polish locale
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * User card for mobile view
 */
export function UserCard({ user, currentUserId, onDelete }: UserCardProps) {
  const isOwnAccount = user.id === currentUserId;
  const isOwner = user.role === "owner";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight mb-1">{user.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <RoleBadge role={user.role} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Data utworzenia:</span>
          <span className="font-medium">{formatDate(user.created_at)}</span>
        </div>
      </CardContent>

      {/* Show delete button only for workers, not for owners */}
      {!isOwner && (
        <CardFooter className="flex justify-end">
          {isOwnAccount ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="destructive" size="sm" disabled aria-disabled="true">
                      Usuń
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nie możesz usunąć własnego konta</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button variant="destructive" size="sm" onClick={() => onDelete(user)}>
              Usuń
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
