/**
 * Register endpoint
 * Creates new user account (first user becomes owner, rest are workers)
 * Automatically logs in the user after successful registration
 * POST /api/auth/register
 */

import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// Request validation schema
const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .max(255, "Email może mieć maksymalnie 255 znaków"),
  password: z
    .string()
    .min(1, "Hasło jest wymagane")
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .max(72, "Hasło może mieć maksymalnie 72 znaki"),
  name: z
    .string()
    .min(1, "Imię i nazwisko jest wymagane")
    .max(100, "Imię i nazwisko może mieć maksymalnie 100 znaków"),
});

// Response types
interface RegisterSuccessResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface ErrorResponse {
  error: string;
  details?: string[];
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const { supabase } = locals;

  try {
    // 1. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponse = { error: "Invalid JSON in request body" };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const errorResponse: ErrorResponse = {
        error: "Validation failed",
        details: validation.error.errors.map((e) => e.message),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password, name } = validation.data;

    // 2. Create user in Supabase Auth with metadata
    // Note: The database trigger will automatically:
    //   - Create a profile for the new user
    //   - Assign 'owner' role to first user, 'worker' to subsequent users
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (signUpError) {
      // Handle specific error cases
      if (signUpError.message.includes("already registered")) {
        const errorResponse: ErrorResponse = { error: "Ten email jest już zarejestrowany" };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.error("Sign up error:", signUpError);
      const errorResponse: ErrorResponse = { error: "Nie udało się utworzyć konta" };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!authData.user) {
      const errorResponse: ErrorResponse = { error: "Failed to create user" };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Get the created profile to return
    // Profile was automatically created by database trigger with correct role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      const errorResponse: ErrorResponse = { error: "Profile not found after creation" };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Log the user in by setting session cookies
    // This provides better UX - user doesn't need to log in after registration
    if (authData.session) {
      const { session } = authData;
      
      // Access token (short-lived)
      cookies.set("sb-access-token", session.access_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
      });

      // Refresh token (long-lived)
      cookies.set("sb-refresh-token", session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // 5. Return success response (user is now logged in)
    const successResponse: RegisterSuccessResponse = {
      user: {
        id: profile.id,
        email: authData.user.email!,
        name: profile.name,
        role: profile.role,
      },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Registration error:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
