import { createClient } from '@supabase/supabase-js'

// 1. Variables de Supabase (Públicas - Disponibles en Cliente y Servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 2. Variable de Groq (Privada - Solo disponible en el Servidor/API)
// NO lleva NEXT_PUBLIC_, por lo que será 'undefined' en el navegador.
export const groqApiKey = process.env.GROQ_API_KEY

// 3. Validación solo para las públicas (para no romper el frontend)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// 4. Exportar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)