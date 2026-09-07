import { createClient } from "@supabase/supabase-js";

// Retrieve Supabase credentials from client-side environment variables
const env = typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, string> }).env : undefined;

const supabaseUrl =
  env?.VITE_SUPABASE_URL || "https://cozy-study-room.supabase.co";

const supabaseAnonKey =
  env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.cozy-anon-key";

// Export the initialized Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
