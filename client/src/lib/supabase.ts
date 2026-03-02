import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Throwing here ensures we don't quietly fail if env is missing
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(
    supabaseUrl || "https://dummy-project.supabase.co",
    supabaseAnonKey || "dummy-anon-key"
);
