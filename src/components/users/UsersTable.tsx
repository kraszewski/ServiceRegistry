/**
 * UsersTable Component
 * Desktop table view for users list
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleBadge } from "./RoleBadge";
import { UserRowActions } from "./UserRowActions";
import type { UserListItemDTO } from "@/types";

interface UsersTableProps {
  data: UserListItemDTO[];
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
 * Users table for desktop view
 */
export function UsersTable({ data, currentUserId, onDelete }: UsersTableProps) {
  return (
    <div className="rounded-md border">
      <Table aria-label="Lista użytkowników">
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Imię</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Data utworzenia</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Brak użytkowników
              </TableCell>
            </TableRow>
          ) : (
            data.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <RoleBadge role={user.role} size="sm" />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <UserRowActions user={user} currentUserId={currentUserId} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
