import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

// DEMO MODE: Mock authenticated session for development
const DEMO_MODE = true;

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // DEMO MODE: Mock getUser to return a fake owner user
  if (DEMO_MODE) {
    const originalGetUser = context.locals.supabase.auth.getUser.bind(context.locals.supabase.auth);
    context.locals.supabase.auth.getUser = async () => {
      // Return mock owner user for demo
      return {
        data: {
          user: {
            id: "00000000-0000-0000-0000-000000000001",
            email: "demo@example.com",
            user_metadata: {
              role: "owner",
              full_name: "Demo User",
            },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as any,
        },
        error: null,
      };
    };
  }

  return next();
});
