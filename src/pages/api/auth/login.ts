/**
 * Login endpoint
 * Authenticates user with email and password
 * POST /api/auth/login
 */

import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// Request validation schema
const loginSchema = z.object({
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
});

// Response types
interface LoginSuccessResponse {
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

    const validation = loginSchema.safeParse(body);
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

    const { email, password } = validation.data;

    // 2. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session || !authData.user) {
      // Generic error message for security (don't reveal if email exists)
      const errorResponse: ErrorResponse = { error: "Nieprawidłowy email lub hasło" };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      const errorResponse: ErrorResponse = { error: "Profile not found" };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Set HttpOnly cookies with session tokens
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

    // 5. Return user data
    const successResponse: LoginSuccessResponse = {
      user: {
        id: profile.id,
        email: authData.user.email ?? "",
        name: profile.name,
        role: profile.role,
      },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login error:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
