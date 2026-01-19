/**
 * EquipmentListPage Component
 * Main container component for equipment list view
 * Manages state, data fetching, and user interactions
 */

import { useState, useEffect } from "react";
import { PageHeader } from "./PageHeader";
import { FilterBar } from "./FilterBar";
import { EquipmentTable } from "./EquipmentTable";
import { EquipmentCardList } from "./EquipmentCardList";
import { Pagination } from "./Pagination";
import { EmptyState } from "./EmptyState";
import { EquipmentTableSkeleton } from "./EquipmentTableSkeleton";
import { EquipmentCardSkeleton } from "./EquipmentCardSkeleton";
import { EquipmentFormDialog } from "./EquipmentFormDialog";
import { DeleteEquipmentDialog } from "./DeleteEquipmentDialog";
import { useEquipmentListParams } from "@/components/hooks/useEquipmentListParams";
import { useEquipmentList } from "@/components/hooks/useEquipmentList";
import { useDeleteEquipment } from "@/components/hooks/useDeleteEquipment";
import { useIsMobile } from "@/components/hooks/useMediaQuery";
import { useUser } from "@/components/hooks/useUser";
import type { EquipmentListItemDTO, EquipmentCategory } from "@/types";
import type { SortConfig } from "./EquipmentTable";
import { toast } from "sonner";

/**
 * Main equipment list page component
 */
export function EquipmentListPage() {
  const { params, setParams } = useEquipmentListParams();
  const { data, isLoading, error, refetch } = useEquipmentList(params);
  const deleteMutation = useDeleteEquipment();
  const isMobile = useIsMobile();
  const { isOwner } = useUser();

  // Dialog states
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    equipment: EquipmentListItemDTO | null;
  }>({
    open: false,
    mode: "create",
    equipment: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    equipment: EquipmentListItemDTO | null;
  }>({
    open: false,
    equipment: null,
  });

  // Listen for URL changes (browser back/forward)
  useEffect(() => {
    const handleParamsChanged = () => {
      refetch();
    };

    window.addEventListener("equipmentParamsChanged", handleParamsChanged);
    window.addEventListener("popstate", handleParamsChanged);

    return () => {
      window.removeEventListener("equipmentParamsChanged", handleParamsChanged);
      window.removeEventListener("popstate", handleParamsChanged);
    };
  }, [refetch]);

  // Handlers for dialogs
  const openCreateDialog = () => {
    setFormDialog({ open: true, mode: "create", equipment: null });
  };

  const openEditDialog = (equipment: EquipmentListItemDTO) => {
    setFormDialog({ open: true, mode: "edit", equipment });
  };

  const openDeleteDialog = (equipment: EquipmentListItemDTO) => {
    setDeleteDialog({ open: true, equipment });
  };

  const closeFormDialog = () => {
    setFormDialog({ open: false, mode: "create", equipment: null });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, equipment: null });
  };

  // Handler for successful form submission
  const handleFormSuccess = () => {
    refetch();
  };

  // Handler for delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.equipment) return;

    try {
      await deleteMutation.mutateAsync(deleteDialog.equipment.id);
      toast.success("Sprzęt usunięty pomyślnie");
      closeDeleteDialog();
      refetch();
    } catch (error) {
      console.error("Delete error:", error);

      const apiError = error as { status?: number };

      if (apiError.status === 403) {
        toast.error("Brak uprawnień do usunięcia sprzętu");
      } else if (apiError.status === 404) {
        toast.error("Sprzęt nie został znaleziony");
        refetch();
      } else {
        toast.error("Wystąpił błąd serwera. Spróbuj ponownie.");
      }
      closeDeleteDialog();
    }
  };

  // Handler for row/card click (navigation to details)
  const handleItemClick = (equipment: EquipmentListItemDTO) => {
    window.location.href = `/equipment/${equipment.id}`;
  };

  // Handler for sorting
  const handleSort = (field: SortConfig["field"]) => {
    const currentSort = params.sort || "created_at";
    const currentOrder = params.order || "desc";

    let newOrder: "asc" | "desc" = "asc";

    if (currentSort === field) {
      // Toggle order if same field
      newOrder = currentOrder === "asc" ? "desc" : "asc";
    }

    setParams({ sort: field, order: newOrder, page: 1 });
  };

  // Handler for category filter change
  const handleCategoryChange = (category: EquipmentCategory | null) => {
    setParams({ category: category || undefined, page: 1 });
  };

  // Handler for clearing all filters
  const handleClearFilters = () => {
    setParams({ category: undefined, page: 1 });
  };

  // Handler for page change
  const handlePageChange = (page: number) => {
    setParams({ page });

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Build sort config for table
  const sortConfig: SortConfig = {
    field: (params.sort as SortConfig["field"]) || "created_at",
    order: params.order || "desc",
  };

  // Determine empty state variant
  const hasFilters = !!params.category;
  const emptyVariant = hasFilters ? "no-results" : "no-data";

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <PageHeader title="Sprzęt" onAddClick={openCreateDialog} />

        <div className="space-y-6">
          <div className="h-10" /> {/* FilterBar placeholder */}
          {isMobile ? <EquipmentCardSkeleton count={5} /> : <EquipmentTableSkeleton rowCount={10} />}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <PageHeader title="Sprzęt" onAddClick={openCreateDialog} />

        <EmptyState variant="no-data" onAction={() => refetch()} />
      </div>
    );
  }

  const equipmentData = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      <PageHeader title="Sprzęt" onAddClick={openCreateDialog} />

      <div className="space-y-6">
        {/* Filters */}
        <FilterBar
          selectedCategory={params.category || null}
          onCategoryChange={handleCategoryChange}
          onClearAllFilters={handleClearFilters}
        />

        {/* Equipment List */}
        {equipmentData.length === 0 ? (
          <EmptyState
            variant={emptyVariant}
            onAction={emptyVariant === "no-results" ? handleClearFilters : openCreateDialog}
          />
        ) : (
          <>
            {isMobile ? (
              <EquipmentCardList
                data={equipmentData}
                onItemClick={handleItemClick}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                isOwner={isOwner}
              />
            ) : (
              <EquipmentTable
                data={equipmentData}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRowClick={handleItemClick}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                isOwner={isOwner}
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
      <EquipmentFormDialog
        mode={formDialog.mode}
        equipment={formDialog.equipment}
        open={formDialog.open}
        onOpenChange={(open) => {
          if (!open) closeFormDialog();
        }}
        onSuccess={handleFormSuccess}
      />

      <DeleteEquipmentDialog
        equipment={deleteDialog.equipment}
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
