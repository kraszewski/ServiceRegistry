/**
 * User Service
 *
 * Service layer for user-related operations.
 * Handles business logic for fetching and managing users.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import { supabaseAdmin } from "../../db/supabase.admin";
import type { CreateUserCommand, UserDTO, UserListItemDTO, UserListResponse } from "../../types";

/**
 * Service class for user operations.
 * Requires a Supabase client instance for database operations.
 */
export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches a paginated list of users.
   *
   * This method retrieves user profiles from the database and enriches them
   * with email addresses from Supabase Auth (auth.users).
   *
   * @param page - Page number (1-indexed)
   * @param limit - Number of items per page
   * @returns Paginated response containing user list items
   * @throws Error if database query fails or auth users cannot be fetched
   */
  async listUsers(page: number, limit: number): Promise<UserListResponse> {
    const offset = (page - 1) * limit;

    // 1. Fetch profiles with pagination
    const {
      data: profiles,
      count,
      error,
    } = await this.supabase
      .from("profiles")
      .select("id, name, role, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    // Handle empty result case
    if (!profiles || profiles.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // 2. Fetch emails from auth.users using Admin API
    const userIds = profiles.map((p) => p.id);
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    // 3. Create email lookup map by user ID
    const emailMap = new Map<string, string>();
    authUsersData.users.forEach((u) => {
      if (userIds.includes(u.id)) {
        emailMap.set(u.id, u.email || "");
      }
    });

    // 4. Map profiles to DTOs with emails
    const data: UserListItemDTO[] = profiles.map((profile) => ({
      id: profile.id,
      email: emailMap.get(profile.id) || "",
      name: profile.name,
      role: profile.role,
      created_at: profile.created_at,
    }));

    const total = count || 0;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Creates a new worker user.
   *
   * This method creates an auth.users entry. The profile is automatically
   * created by a database trigger (trigger_create_profile_after_signup).
   * New users are always created with the 'worker' role.
   *
   * @param command - User creation data (email, password, name)
   * @returns Created user as UserListItemDTO
   * @throws Error if email already exists or database operation fails
   */
  async createUser(command: CreateUserCommand): Promise<UserListItemDTO> {
    const { email, password, name } = command;

    // 1. Create auth user using Admin API
    // The name is passed via user_metadata so the database trigger can use it
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name }, // Passed to trigger via raw_user_meta_data
    });

    if (authError) {
      // Check for duplicate email error
      if (authError.message.includes("already") || authError.message.includes("exists")) {
        throw new Error("User with this email already exists");
      }
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Failed to create auth user: no user returned");
    }

    const userId = authData.user.id;

    // 2. Fetch the profile created by the database trigger
    // Small delay to ensure trigger has completed (trigger is AFTER INSERT)
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("id, name, role, created_at")
      .eq("id", userId)
      .single();

    if (profileError) {
      // Cleanup: delete auth user if profile fetch fails
      console.error("Profile fetch failed, cleaning up auth user:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // 3. Return created user as DTO
    return {
      id: profile.id,
      email,
      name: profile.name,
      role: profile.role,
      created_at: profile.created_at,
    };
  }

  /**
   * Fetches a single user by ID.
   *
   * This method retrieves user profile from the database and enriches it
   * with email address from Supabase Auth (auth.users).
   *
   * @param id - User UUID
   * @returns User details as UserDTO
   * @throws Error with message "User not found" if user doesn't exist
   * @throws Error if database query fails or auth user cannot be fetched
   */
  async getUser(id: string): Promise<UserDTO> {
    // 1. Fetch profile by ID
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .select("id, name, role, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error) {
      // PGRST116 = "JSON object requested, multiple (or no) rows returned"
      if (error.code === "PGRST116") {
        throw new Error("User not found");
      }
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    // 2. Fetch email from auth.users using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);

    if (authError) {
      throw new Error(`Failed to fetch auth user: ${authError.message}`);
    }

    // 3. Return user as DTO
    return {
      id: profile.id,
      email: authData.user?.email || "",
      name: profile.name,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }
}

/**
 * Factory function for creating UserService instances.
 *
 * @param supabase - Supabase client instance (from context.locals)
 * @returns New UserService instance
 */
export function createUserService(supabase: SupabaseClient<Database>): UserService {
  return new UserService(supabase);
}
