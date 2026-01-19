/**
 * Supabase Admin Client
 *
 * This client uses the service role key for administrative operations
 * that require elevated privileges, such as accessing auth.users data.
 *
 * IMPORTANT: Never expose this client or the service role key to the browser.
 * Use only in server-side code (API routes, middleware).
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
