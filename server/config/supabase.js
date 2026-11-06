import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

/**
 * Supabase client with the SERVICE ROLE key.
 * This bypasses Row Level Security — it must ONLY be used on the backend.
 * The frontend never imports this.
 */
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
