import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validación suave para que el build NO falle si faltan variables
const finalUrl = supabaseUrl || 'https://vwxmgxkymjsdjbiawmod.supabase.co'
const finalKey = supabaseKey || 'sb_secret_rCMONy0zPg6UJwR83il77g_0ozpLn0J'

export const supabase = createClient(finalUrl, finalKey)