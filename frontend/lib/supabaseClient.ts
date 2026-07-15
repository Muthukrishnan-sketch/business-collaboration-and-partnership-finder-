import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client — uses the anon key + RLS policies.
// Use this for real-time subscriptions (chat, live connection updates).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
