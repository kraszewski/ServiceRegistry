/**
 * DTO and Command Model Type Definitions
 *
 * This file contains type definitions for Data Transfer Objects (DTOs) and Command Models
 * used by the API endpoints. All types are derived from or connected to database entity types.
 */

import type { Database } from "./db/database.types";

// =============================================================================
// BASE ENTITY TYPES (derived from database)
// =============================================================================

/** Database table row types */
type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

/** Base entity types from database */
export type ProfileEntity = Tables<"profiles">;
export type EquipmentEntity = Tables<"equipment">;
export type ServiceEntryEntity = Tables<"service_entries">;

// =============================================================================
// ENUM TYPES (re-exported from database for convenience)
// =============================================================================

export type EquipmentCategory = Database["public"]["Enums"]["equipment_category"];
export type ServiceType = Database["public"]["Enums"]["service_type"];
export type UserRole = Database["public"]["Enums"]["user_role"];

// =============================================================================
// HELPER / UTILITY TYPES
// =============================================================================

/**
 * Reference to a user, used in nested objects within DTOs.
 * Contains minimal user information for display purposes.
 */
export interface UserReference {
  id: string;
  name: string;
}

/**
 * Standard success response for delete operations.
 */
export interface DeleteResponse {
  message: string;
}

/**
 * Standard error response format for all API errors.
 */
export interface ErrorResponse {
  error: string;
  /** Optional validation error details or additional information */
  details?: Record<string, string[]> | Record<string, unknown>;
}

// =============================================================================
// PAGINATION TYPES
// =============================================================================

/**
 * Pagination query parameters accepted by list endpoints.
 */
export interface PaginationParams {
  /** Page number (1-indexed). Default: 1 */
  page?: number;
  /** Items per page. Default: 10, Max: 100 */
  limit?: number;
}

/**
 * Pagination metadata returned in list responses.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper for list endpoints.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// =============================================================================
// USER DTOs AND COMMAND MODELS
// =============================================================================

/**
 * User DTO for list responses (GET /api/users).
 * Combines profile data with email from auth.users.
 */
export interface UserListItemDTO {
  id: ProfileEntity["id"];
  /** Email from auth.users (not stored in profiles) */
  email: string;
  name: ProfileEntity["name"];
  role: ProfileEntity["role"];
  created_at: ProfileEntity["created_at"];
}

/**
 * User DTO for detail responses (GET /api/users/{id}).
 * Extended version with updated_at field.
 */
export interface UserDTO extends UserListItemDTO {
  updated_at: ProfileEntity["updated_at"];
}

/**
 * Command model for creating a new user (POST /api/users).
 * Creates both auth.users entry and profiles entry.
 */
export interface CreateUserCommand {
  email: string;
  password: string;
  name: string;
}

/** Paginated response type for user list */
export type UserListResponse = PaginatedResponse<UserListItemDTO>;

// =============================================================================
// EQUIPMENT DTOs AND COMMAND MODELS
// =============================================================================

/**
 * Equipment DTO for list responses (GET /api/equipment).
 * Contains created_by as nested UserReference.
 */
export interface EquipmentListItemDTO {
  id: EquipmentEntity["id"];
  equipment_id: EquipmentEntity["equipment_id"];
  name: EquipmentEntity["name"];
  category: EquipmentEntity["category"];
  manufacturer: EquipmentEntity["manufacturer"];
  model: EquipmentEntity["model"];
  serial_number: EquipmentEntity["serial_number"];
  description: EquipmentEntity["description"];
  location: EquipmentEntity["location"];
  purchase_date: EquipmentEntity["purchase_date"];
  created_at: EquipmentEntity["created_at"];
  /** Nested user reference with id and name */
  created_by: UserReference;
}

/**
 * Equipment DTO for detail responses (GET /api/equipment/{id}).
 * Extended version with updated_at and updated_by fields.
 */
export interface EquipmentDTO extends EquipmentListItemDTO {
  updated_at: EquipmentEntity["updated_at"];
  /** Nested user reference with id and name */
  updated_by: UserReference;
}

/**
 * Equipment response DTO for create/update operations.
 * Uses UUID strings instead of nested UserReference objects.
 */
export interface EquipmentResponseDTO {
  id: EquipmentEntity["id"];
  equipment_id: EquipmentEntity["equipment_id"];
  name: EquipmentEntity["name"];
  category: EquipmentEntity["category"];
  manufacturer: EquipmentEntity["manufacturer"];
  model: EquipmentEntity["model"];
  serial_number: EquipmentEntity["serial_number"];
  description: EquipmentEntity["description"];
  location: EquipmentEntity["location"];
  purchase_date: EquipmentEntity["purchase_date"];
  created_at: EquipmentEntity["created_at"];
  /** UUID of the creator */
  created_by: EquipmentEntity["created_by"];
  updated_at: EquipmentEntity["updated_at"];
  /** UUID of the last updater */
  updated_by: EquipmentEntity["updated_by"];
}

/**
 * Command model for creating new equipment (POST /api/equipment).
 * equipment_id is auto-generated, created_by/updated_by are set from auth context.
 */
export interface CreateEquipmentCommand {
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serial_number: string;
  description?: string | null;
  location?: string | null;
  purchase_date?: string | null;
}

/**
 * Command model for updating equipment (PATCH /api/equipment/{id}).
 * All fields are optional. equipment_id cannot be modified.
 */
export type UpdateEquipmentCommand = Partial<CreateEquipmentCommand>;

/**
 * Query parameters for equipment list endpoint (GET /api/equipment).
 * Extends pagination with sorting and filtering options.
 */
export interface EquipmentListParams extends PaginationParams {
  /** Sort field */
  sort?: "created_at" | "name" | "equipment_id" | "category" | "manufacturer";
  /** Sort order */
  order?: "asc" | "desc";
  /** Filter by category */
  category?: EquipmentCategory;
  /** Search by equipment_id (exact match) */
  search?: string;
}

/** Paginated response type for equipment list */
export type EquipmentListResponse = PaginatedResponse<EquipmentListItemDTO>;

// =============================================================================
// SERVICE ENTRY DTOs AND COMMAND MODELS
// =============================================================================

/**
 * Service entry DTO for list and detail responses.
 * Contains performer, created_by, and updated_by as nested UserReference objects.
 */
export interface ServiceEntryDTO {
  id: ServiceEntryEntity["id"];
  equipment_id: ServiceEntryEntity["equipment_id"];
  service_timestamp: ServiceEntryEntity["service_timestamp"];
  service_type: ServiceEntryEntity["service_type"];
  description: ServiceEntryEntity["description"];
  /** User who performed the service */
  performer: UserReference;
  created_at: ServiceEntryEntity["created_at"];
  /** User who created this record */
  created_by: UserReference;
  updated_at: ServiceEntryEntity["updated_at"];
  /** User who last updated this record */
  updated_by: UserReference;
}

/**
 * Service entry list item DTO (same structure as detail DTO).
 * Used in GET /api/equipment/{equipmentId}/service-entries.
 */
export type ServiceEntryListItemDTO = ServiceEntryDTO;

/**
 * Service entry response DTO for create/update operations.
 * Uses UUID strings instead of nested UserReference objects.
 */
export interface ServiceEntryResponseDTO {
  id: ServiceEntryEntity["id"];
  equipment_id: ServiceEntryEntity["equipment_id"];
  service_timestamp: ServiceEntryEntity["service_timestamp"];
  service_type: ServiceEntryEntity["service_type"];
  description: ServiceEntryEntity["description"];
  /** UUID of the performer */
  performer_id: ServiceEntryEntity["performer_id"];
  created_at: ServiceEntryEntity["created_at"];
  /** UUID of the creator */
  created_by: ServiceEntryEntity["created_by"];
  updated_at: ServiceEntryEntity["updated_at"];
  /** UUID of the last updater */
  updated_by: ServiceEntryEntity["updated_by"];
}

/**
 * Command model for creating a service entry (POST /api/equipment/{equipmentId}/service-entries).
 * equipment_id comes from URL path parameter.
 * performer_id is automatically set to the authenticated user.
 */
export interface CreateServiceEntryCommand {
  /** ISO 8601 datetime string. Defaults to current time if not provided. */
  service_timestamp?: string;
  service_type: ServiceType;
  /** Minimum 5 characters */
  description: string;
}

/**
 * Command model for updating a service entry (PATCH /api/service-entries/{id}).
 * All fields are optional. performer_id cannot be modified.
 */
export type UpdateServiceEntryCommand = Partial<CreateServiceEntryCommand>;

/** Paginated response type for service entry list */
export type ServiceEntryListResponse = PaginatedResponse<ServiceEntryListItemDTO>;
