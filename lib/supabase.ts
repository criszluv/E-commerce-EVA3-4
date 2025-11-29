import { createClient } from '@supabase/supabase-js'

// 1. Usamos '' (string vacío) como valor por defecto para que no sea undefined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 2. Exportamos la clave de Groq (sin validación estricta aquí)
export const groqApiKey = process.env.GROQ_API_KEY

// 3. 🚨 CAMBIO IMPORTANTE: Eliminamos el "throw new Error"
// En lugar de romper la app, solo mostramos una advertencia en consola si estamos en el navegador.
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('⚠️ Faltan las variables de entorno de Supabase. Revisa tu .env.local o Vercel.')
}

// 4. Creamos el cliente. Si las claves están vacías, se crea igual (para que el build pase),
// pero fallará si intentas hacer consultas (lo cual está bien, porque lo arreglarás poniendo las claves en Vercel).
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
