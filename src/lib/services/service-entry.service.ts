/**
 * Service Entry Service
 *
 * Service layer for service entry-related operations.
 * Handles business logic for fetching and managing service entries.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type {
  CreateServiceEntryCommand,
  ServiceEntryDTO,
  ServiceEntryListItemDTO,
  ServiceEntryListResponse,
  ServiceEntryResponseDTO,
  UpdateServiceEntryCommand,
  UserReference,
} from "../../types";
import type { ServiceEntryListParams } from "../schemas/service-entry.schema";

/**
 * Service class for service entry operations.
 * Requires a Supabase client instance for database operations.
 */
export class ServiceEntryService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Lists service entries for specific equipment with pagination.
   *
   * @param equipmentId - Equipment UUID to filter by
   * @param params - Query parameters for pagination
   * @returns Paginated response containing service entry list items
   * @throws Error with message "Equipment not found" if equipment doesn't exist
   * @throws Error if database query fails
   */
  async listByEquipment(equipmentId: string, params: ServiceEntryListParams): Promise<ServiceEntryListResponse> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    // 1. Check if equipment exists
    const { data: equipment, error: equipmentError } = await this.supabase
      .from("equipment")
      .select("id")
      .eq("id", equipmentId)
      .single();

    if (equipmentError || !equipment) {
      throw new Error("Equipment not found");
    }

    // 2. Query service entries with profile joins
    const { data, error, count } = await this.supabase
      .from("service_entries")
      .select(
        `
        *,
        performer:profiles!service_entries_performer_id_fkey(id, name),
        creator:profiles!service_entries_created_by_fkey(id, name),
        updater:profiles!service_entries_updated_by_fkey(id, name)
      `,
        { count: "exact" }
      )
      .eq("equipment_id", equipmentId)
      .order("service_timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch service entries: ${error.message}`);
    }

    // 3. Map to DTOs
    const items: ServiceEntryListItemDTO[] = (data ?? []).map((entry) => ({
      id: entry.id,
      equipment_id: entry.equipment_id,
      service_timestamp: entry.service_timestamp,
      service_type: entry.service_type,
      description: entry.description,
      performer: entry.performer as unknown as UserReference,
      created_at: entry.created_at,
      created_by: entry.creator as unknown as UserReference,
      updated_at: entry.updated_at,
      updated_by: entry.updater as unknown as UserReference,
    }));

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Gets a specific service entry by ID with user references.
   *
   * @param id - Service entry UUID
   * @returns Service entry details with UserReference for performer, created_by, updated_by
   * @throws Error with message "Service entry not found" if not exists
   */
  async getServiceEntry(id: string): Promise<ServiceEntryDTO> {
    const { data, error } = await this.supabase
      .from("service_entries")
      .select(
        `
        *,
        performer:profiles!service_entries_performer_id_fkey(id, name),
        creator:profiles!service_entries_created_by_fkey(id, name),
        updater:profiles!service_entries_updated_by_fkey(id, name)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Service entry not found");
      }
      throw new Error(`Failed to fetch service entry: ${error.message}`);
    }

    if (!data) {
      throw new Error("Service entry not found");
    }

    // Map to DTO with UserReference objects
    return {
      id: data.id,
      equipment_id: data.equipment_id,
      service_timestamp: data.service_timestamp,
      service_type: data.service_type,
      description: data.description,
      performer: data.performer as unknown as UserReference,
      created_at: data.created_at,
      created_by: data.creator as unknown as UserReference,
      updated_at: data.updated_at,
      updated_by: data.updater as unknown as UserReference,
    };
  }

  /**
   * Creates a new service entry for equipment.
   * performer_id is automatically set to the current user.
   *
   * @param equipmentId - Equipment UUID from path parameter
   * @param command - Service entry data from request body
   * @param userId - ID of the authenticated user (performer)
   * @returns Created service entry as ServiceEntryResponseDTO
   * @throws Error with message "Equipment not found" if equipment doesn't exist
   */
  async createServiceEntry(
    equipmentId: string,
    command: CreateServiceEntryCommand,
    userId: string
  ): Promise<ServiceEntryResponseDTO> {
    // 1. Check if equipment exists
    const { data: equipment, error: equipmentError } = await this.supabase
      .from("equipment")
      .select("id")
      .eq("id", equipmentId)
      .single();

    if (equipmentError || !equipment) {
      throw new Error("Equipment not found");
    }

    // 2. Insert service entry
    const { data, error } = await this.supabase
      .from("service_entries")
      .insert({
        equipment_id: equipmentId,
        service_timestamp: command.service_timestamp ?? new Date().toISOString(),
        service_type: command.service_type,
        description: command.description,
        performer_id: userId,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create service entry: ${error.message}`);
    }

    return data as ServiceEntryResponseDTO;
  }

  /**
   * Updates existing service entry.
   * performer_id cannot be modified.
   *
   * @param id - Service entry UUID
   * @param command - Partial service entry data to update
   * @param userId - ID of the authenticated user (updater)
   * @returns Updated service entry as ServiceEntryResponseDTO
   * @throws Error with message "Service entry not found" if not exists
   */
  async updateServiceEntry(
    id: string,
    command: UpdateServiceEntryCommand,
    userId: string
  ): Promise<ServiceEntryResponseDTO> {
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      ...command,
      updated_by: userId,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await this.supabase
      .from("service_entries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Check if no rows were updated (service entry not found)
      if (error.code === "PGRST116") {
        throw new Error("Service entry not found");
      }
      throw new Error(`Failed to update service entry: ${error.message}`);
    }

    if (!data) {
      throw new Error("Service entry not found");
    }

    return data as ServiceEntryResponseDTO;
  }

  /**
   * Deletes a service entry.
   *
   * @param id - Service entry UUID
   * @throws Error with message "Service entry not found" if not exists
   */
  async deleteServiceEntry(id: string): Promise<void> {
    // First check if service entry exists
    const { data: existing, error: checkError } = await this.supabase
      .from("service_entries")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      throw new Error("Service entry not found");
    }

    // Delete service entry
    const { error } = await this.supabase.from("service_entries").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete service entry: ${error.message}`);
    }
  }
}

/**
 * Factory function for creating ServiceEntryService instances.
 *
 * @param supabase - Supabase client instance (from context.locals)
 * @returns New ServiceEntryService instance
 */
export function createServiceEntryService(supabase: SupabaseClient<Database>): ServiceEntryService {
  return new ServiceEntryService(supabase);
}
