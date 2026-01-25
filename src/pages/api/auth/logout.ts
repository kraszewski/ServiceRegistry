/**
 * Logout endpoint
 * Logs out the current user and clears session cookies
 * POST /api/auth/logout
 */

import type { APIRoute } from "astro";

export const prerender = false;

interface LogoutSuccessResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
}

export const POST: APIRoute = async ({ locals, cookies }) => {
  const { supabase } = locals;

  try {
    // 1. Sign out from Supabase (invalidates refresh token)
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Supabase sign out error:", signOutError);
      // Continue to clear cookies even if sign out fails
    }

    // 2. Clear HttpOnly cookies
    cookies.delete("sb-access-token", {
      path: "/",
    });

    cookies.delete("sb-refresh-token", {
      path: "/",
    });

    // 3. Return success response
    const successResponse: LogoutSuccessResponse = {
      message: "Logged out successfully",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Logout error:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
