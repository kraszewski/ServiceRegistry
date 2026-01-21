/**
 * EquipmentDataCard Component
 * Card displaying all equipment information in grid layout
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataField } from "@/components/shared/DataField";
import { CategoryBadge } from "@/components/equipment/CategoryBadge";
import type { EquipmentDTO } from "@/types";

interface EquipmentDataCardProps {
  equipment: EquipmentDTO;
}

/**
 * Card component displaying comprehensive equipment data
 */
export function EquipmentDataCard({ equipment }: EquipmentDataCardProps) {
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o sprzęcie</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <DataField label="Identyfikator" value={equipment.equipment_id} />
          <DataField label="Nazwa" value={equipment.name} />

          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Kategoria</dt>
            <dd>
              <CategoryBadge category={equipment.category} />
            </dd>
          </div>

          <DataField label="Producent" value={equipment.manufacturer} />
          <DataField label="Model" value={equipment.model} />
          <DataField label="Numer seryjny" value={equipment.serial_number} />

          {/* Optional Information */}
          <DataField
            label="Data zakupu"
            value={formatDate(equipment.purchase_date)}
            emptyText="Nie podano"
          />
          <DataField label="Lokalizacja" value={equipment.location} emptyText="Nie podano" />

          {/* Description - full width */}
          <div className="md:col-span-2">
            <DataField label="Opis" value={equipment.description} emptyText="Brak opisu" />
          </div>

          {/* Metadata Section - full width */}
          <div className="md:col-span-2 pt-6 mt-6 border-t space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Metadata</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataField
                label="Utworzono przez"
                value={equipment.created_by.name}
              />
              <DataField
                label="Data utworzenia"
                value={formatDateTime(equipment.created_at)}
              />
              <DataField
                label="Zmodyfikowano przez"
                value={equipment.updated_by.name}
              />
              <DataField
                label="Data modyfikacji"
                value={formatDateTime(equipment.updated_at)}
              />
            </div>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
