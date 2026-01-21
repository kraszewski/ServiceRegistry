/**
 * UsersCardList Component
 * Container for user cards in mobile view
 */

import { UserCard } from "./UserCard";
import type { UserListItemDTO } from "@/types";

interface UsersCardListProps {
  data: UserListItemDTO[];
  currentUserId: string;
  onDelete: (user: UserListItemDTO) => void;
}

/**
 * List container for user cards
 */
export function UsersCardList({ data, currentUserId, onDelete }: UsersCardListProps) {
  return (
    <div className="flex flex-col gap-4">
      {data.map((user) => (
        <UserCard key={user.id} user={user} currentUserId={currentUserId} onDelete={onDelete} />
      ))}
    </div>
  );
}
