import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Database } from '../database.types'

const supabaseUrl = "https://fuvzgosboiwztvzepqtx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dnpnb3Nib2l3enR2emVwcXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDE5NjUsImV4cCI6MjA3OTYxNzk2NX0.hO9meXUFOI4iFH1m4j5Jy68_5WOsw_EJoPGm_ZS2DsM";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
