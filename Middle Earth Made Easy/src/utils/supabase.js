// Supabase client — single shared instance for the entire app.
// All components import { supabase } from here; never call createClient() again elsewhere.
// The VITE_ prefix makes these variables available in the browser bundle (intentional).
// The publishable/anon key is safe to expose — data access is controlled by Row Level Security
// policies on the database, not by hiding this key.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
