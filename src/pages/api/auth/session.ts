/**
 * Session endpoint
 * Returns current user session information
 * GET /api/auth/session
 */

import type { APIRoute } from "astro";
import { DEMO_MODE } from "@/config";

export const prerender = false;

export const GET: APIRoute = async ({ locals, cookies }) => {
  const { supabase } = locals;

  try {
    // DEMO MODE: Return mock owner user
    if (DEMO_MODE) {
      return new Response(
        JSON.stringify({
          user: {
            id: "00000000-0000-0000-0000-000000000001",
            email: "demo@example.com",
            name: "Demo User",
            role: "owner",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !sessionData.session) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, role, created_at, updated_at")
      .eq("id", sessionData.session.user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: profile.id,
          email: sessionData.session.user.email,
          name: profile.name,
          role: profile.role,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Session error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
