import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";
import { DEMO_MODE } from "../config.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // DEMO MODE: Mock getUser to return a fake owner user
  if (DEMO_MODE) {
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
          },
        },
        error: null,
      };
    };
  }

  return next();
});
