/**
 * UsersPage Component
 * Main container component for users management view
 * Manages state, data fetching, and user interactions
 */

import { useState, useEffect } from "react";
import { UsersTable } from "./UsersTable";
import { UsersCardList } from "./UsersCardList";
import { Pagination } from "@/components/equipment/Pagination";
import { UsersEmptyState } from "./UsersEmptyState";
import { UsersTableSkeleton } from "./UsersTableSkeleton";
import { UsersCardSkeleton } from "./UsersCardSkeleton";
import { AddUserDialog } from "./AddUserDialog";
import { DeleteUserAlertDialog } from "./DeleteUserAlertDialog";
import { useUsersListParams } from "@/components/hooks/useUsersListParams";
import { useUsersList } from "@/components/hooks/useUsersList";
import { useDeleteUser } from "@/components/hooks/useDeleteUser";
import { useIsMobile } from "@/components/hooks/useMediaQuery";
import { useUser } from "@/components/hooks/useUser";
import { Button } from "@/components/ui/button";
import type { UserListItemDTO } from "@/types";
import { toast } from "sonner";

/**
 * Main users management page component
 */
export function UsersPage() {
  const { params, setParams } = useUsersListParams();
  const { data, isLoading, error, refetch } = useUsersList(params);
  const deleteMutation = useDeleteUser();
  const isMobile = useIsMobile();
  const { user: currentUser } = useUser();

  // Dialog states
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: UserListItemDTO | null;
  }>({
    open: false,
    user: null,
  });

  // Debug: log dialog state changes
  useEffect(() => {
    console.log("AddUserDialog state changed:", addUserDialogOpen);
  }, [addUserDialogOpen]);

  // Listen for URL changes (browser back/forward)
  useEffect(() => {
    const handleParamsChanged = () => {
      refetch();
    };

    window.addEventListener("usersParamsChanged", handleParamsChanged);
    window.addEventListener("popstate", handleParamsChanged);

    return () => {
      window.removeEventListener("usersParamsChanged", handleParamsChanged);
      window.removeEventListener("popstate", handleParamsChanged);
    };
  }, [refetch]);

  // Handlers for dialogs
  const openAddUserDialog = () => {
    console.log("Opening add user dialog...");
    setAddUserDialogOpen(true);
  };

  const closeAddUserDialog = () => {
    setAddUserDialogOpen(false);
  };

  const openDeleteDialog = (user: UserListItemDTO) => {
    setDeleteDialog({ open: true, user });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, user: null });
  };

  // Handler for successful user creation
  const handleAddUserSuccess = () => {
    refetch();
  };

  // Handler for delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.user) return;

    try {
      await deleteMutation.mutateAsync(deleteDialog.user.id);
      toast.success("Użytkownik usunięty pomyślnie");
      closeDeleteDialog();
      refetch();
    } catch (error) {
      console.error("Delete error:", error);

      const apiError = error as { status?: number; data?: { error?: string } };

      if (apiError.status === 403) {
        toast.error("Brak uprawnień do usunięcia użytkownika");
      } else if (apiError.status === 404) {
        toast.error("Użytkownik nie został znaleziony");
        refetch();
      } else if (apiError.status === 409) {
        toast.error(
          "Nie można usunąć - użytkownik ma przypisane wpisy serwisowe. Usuń najpierw wszystkie wpisy lub zmień wykonawcę."
        );
      } else {
        toast.error("Wystąpił błąd serwera. Spróbuj ponownie.");
      }
      closeDeleteDialog();
    }
  };

  // Handler for page change
  const handlePageChange = (page: number) => {
    setParams({ page });

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <PageHeader title="Zarządzanie Użytkownikami" onAddClick={openAddUserDialog} />

        <div className="space-y-6">
          {isMobile ? <UsersCardSkeleton count={5} /> : <UsersTableSkeleton rowCount={10} />}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <PageHeader title="Zarządzanie Użytkownikami" onAddClick={openAddUserDialog} />

        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
          <p className="text-sm text-muted-foreground mb-6">Nie udało się pobrać listy użytkowników.</p>
          <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  const usersData = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  };

  // Check if only owner exists (no workers)
  const hasOnlyOwner = usersData.length === 1 && usersData[0]?.role === "owner";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      <PageHeader title="Zarządzanie Użytkownikami" onAddClick={openAddUserDialog} />

      <div className="space-y-6">
        {/* Users List */}
        {hasOnlyOwner ? (
          <UsersEmptyState onAddUser={openAddUserDialog} />
        ) : (
          <>
            {isMobile ? (
              <UsersCardList
                data={usersData}
                currentUserId={currentUser?.id || ""}
                onDelete={openDeleteDialog}
              />
            ) : (
              <UsersTable
                data={usersData}
                currentUserId={currentUser?.id || ""}
                onDelete={openDeleteDialog}
              />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onSuccess={handleAddUserSuccess}
      />

      <DeleteUserAlertDialog
        user={deleteDialog.user}
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

/**
 * PageHeader Component for Users view
 */
interface PageHeaderProps {
  title: string;
  onAddClick: () => void;
}

function PageHeader({ title, onAddClick }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background border-b mb-6 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

        <Button onClick={onAddClick} size="default">
          <span className="hidden sm:inline">+ Dodaj Pracownika</span>
          <span className="sm:hidden">+ Dodaj</span>
        </Button>
      </div>
    </header>
  );
}
