/**
 * Equipment Service
 *
 * Service layer for equipment-related operations.
 * Handles business logic for fetching and managing equipment.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type {
  CreateEquipmentCommand,
  EquipmentDTO,
  EquipmentListItemDTO,
  EquipmentListParams,
  EquipmentListResponse,
  EquipmentResponseDTO,
  UpdateEquipmentCommand,
  UserReference,
} from "../../types";

/**
 * Service class for equipment operations.
 * Requires a Supabase client instance for database operations.
 */
export class EquipmentService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches a paginated list of equipment with sorting and filtering.
   *
   * @param params - Query parameters for pagination, sorting, and filtering
   * @returns Paginated response containing equipment list items
   * @throws Error if database query fails
   */
  async listEquipment(params: EquipmentListParams): Promise<EquipmentListResponse> {
    const { page = 1, limit = 50, sort = "created_at", order = "desc", category, search } = params;

    const offset = (page - 1) * limit;

    // Build query with join on profiles for created_by
    let query = this.supabase.from("equipment").select(
      `
        id,
        equipment_id,
        name,
        category,
        manufacturer,
        model,
        serial_number,
        description,
        location,
        purchase_date,
        created_at,
        created_by_profile:profiles!equipment_created_by_fkey(id, name)
      `,
      { count: "exact" }
    );

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.eq("equipment_id", search);
    }

    // Apply sorting and pagination
    query = query.order(sort, { ascending: order === "asc" }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    // Map to DTOs
    const equipmentList: EquipmentListItemDTO[] = (data || []).map((item) => ({
      id: item.id,
      equipment_id: item.equipment_id,
      name: item.name,
      category: item.category,
      manufacturer: item.manufacturer,
      model: item.model,
      serial_number: item.serial_number,
      description: item.description,
      location: item.location,
      purchase_date: item.purchase_date,
      created_at: item.created_at,
      created_by: item.created_by_profile as unknown as UserReference,
    }));

    const total = count || 0;

    return {
      data: equipmentList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Creates new equipment with auto-generated equipment_id.
   *
   * @param command - Equipment data from request body
   * @param userId - ID of the authenticated user (creator)
   * @returns Created equipment as EquipmentResponseDTO
   * @throws Error if equipment_id generation fails or insert fails
   */
  async createEquipment(command: CreateEquipmentCommand, userId: string): Promise<EquipmentResponseDTO> {
    // 1. Generate equipment_id using database function
    const { data: equipmentId, error: idError } = await this.supabase.rpc("generate_equipment_id");

    if (idError || !equipmentId) {
      throw new Error(`Failed to generate equipment ID: ${idError?.message}`);
    }

    // 2. Insert equipment
    const { data, error } = await this.supabase
      .from("equipment")
      .insert({
        equipment_id: equipmentId,
        name: command.name,
        category: command.category,
        manufacturer: command.manufacturer,
        model: command.model,
        serial_number: command.serial_number,
        description: command.description ?? null,
        location: command.location ?? null,
        purchase_date: command.purchase_date ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation on serial_number
      if (error.code === "23505" && error.message.includes("serial_number")) {
        throw new Error("serial_number already exists");
      }
      throw new Error(`Failed to create equipment: ${error.message}`);
    }

    return data as EquipmentResponseDTO;
  }

  /**
   * Fetches equipment details by ID.
   *
   * @param id - Equipment UUID
   * @returns Equipment details with UserReference for created_by and updated_by
   * @throws Error with message "Equipment not found" if not exists
   */
  async getEquipment(id: string): Promise<EquipmentDTO> {
    const { data, error } = await this.supabase
      .from("equipment")
      .select(
        `
        id,
        equipment_id,
        name,
        category,
        manufacturer,
        model,
        serial_number,
        description,
        location,
        purchase_date,
        created_at,
        updated_at,
        created_by_profile:profiles!equipment_created_by_fkey(id, name),
        updated_by_profile:profiles!equipment_updated_by_fkey(id, name)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      // PGRST116 = "JSON object requested, multiple (or no) rows returned"
      if (error.code === "PGRST116") {
        throw new Error("Equipment not found");
      }
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    // Map to DTO
    return {
      id: data.id,
      equipment_id: data.equipment_id,
      name: data.name,
      category: data.category,
      manufacturer: data.manufacturer,
      model: data.model,
      serial_number: data.serial_number,
      description: data.description,
      location: data.location,
      purchase_date: data.purchase_date,
      created_at: data.created_at,
      created_by: data.created_by_profile as unknown as UserReference,
      updated_at: data.updated_at,
      updated_by: data.updated_by_profile as unknown as UserReference,
    };
  }

  /**
   * Updates existing equipment.
   *
   * @param id - Equipment UUID
   * @param command - Partial equipment data to update
   * @param userId - ID of the authenticated user (updater)
   * @returns Updated equipment as EquipmentResponseDTO
   * @throws Error if equipment not found or serial_number conflict
   */
  async updateEquipment(id: string, command: UpdateEquipmentCommand, userId: string): Promise<EquipmentResponseDTO> {
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

    const { data, error } = await this.supabase.from("equipment").update(updateData).eq("id", id).select().single();

    if (error) {
      // Check for unique constraint violation on serial_number
      if (error.code === "23505" && error.message.includes("serial_number")) {
        throw new Error("serial_number already exists");
      }
      // Check if no rows were updated (equipment not found)
      if (error.code === "PGRST116") {
        throw new Error("Equipment not found");
      }
      throw new Error(`Failed to update equipment: ${error.message}`);
    }

    if (!data) {
      throw new Error("Equipment not found");
    }

    return data as EquipmentResponseDTO;
  }

  /**
   * Deletes equipment and all associated service entries.
   * Service entries are deleted automatically via CASCADE.
   *
   * @param id - Equipment UUID
   * @throws Error if equipment not found
   */
  async deleteEquipment(id: string): Promise<void> {
    // First check if equipment exists
    const { data: existing, error: checkError } = await this.supabase
      .from("equipment")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      throw new Error("Equipment not found");
    }

    // Delete equipment (service_entries will be cascade deleted)
    const { error } = await this.supabase.from("equipment").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete equipment: ${error.message}`);
    }
  }
}

/**
 * Factory function for creating EquipmentService instances.
 *
 * @param supabase - Supabase client instance (from context.locals)
 * @returns New EquipmentService instance
 */
export function createEquipmentService(supabase: SupabaseClient<Database>): EquipmentService {
  return new EquipmentService(supabase);
}
