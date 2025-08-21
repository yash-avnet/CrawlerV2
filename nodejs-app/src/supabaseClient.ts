import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (service role key) – use for file uploads, DB inserts without RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);