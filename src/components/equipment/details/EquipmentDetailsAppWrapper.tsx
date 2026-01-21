/**
 * EquipmentDetailsAppWrapper Component
 * Wrapper that provides QueryProvider for EquipmentDetailsApp
 */

import { QueryProvider } from "@/components/providers/QueryProvider";
import { EquipmentDetailsApp } from "./EquipmentDetailsApp";

interface EquipmentDetailsAppWrapperProps {
  equipmentId: string;
}

/**
 * Wrapped EquipmentDetailsApp with QueryProvider
 */
export function EquipmentDetailsAppWrapper({ equipmentId }: EquipmentDetailsAppWrapperProps) {
  return (
    <QueryProvider>
      <EquipmentDetailsApp equipmentId={equipmentId} />
    </QueryProvider>
  );
}
