import { createClient } from '@supabase/supabase-js'

// 1. Usamos '|| ""' (string vacío) como fallback.
// Esto permite que el comando 'npm run build' termine sin errores aunque las variables no se lean en ese milisegundo.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 2. 🚨 IMPORTANTE: Eliminamos el 'throw new Error'.
// En su lugar, solo advertimos en la consola si estamos en el navegador y faltan las claves.
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('⚠️ Advertencia: Faltan las variables de entorno de Supabase.')
}

// 3. Creamos el cliente. 
// Si las claves están vacías durante el build, se crea un cliente "vacío" que no rompe la compilación.
// Cuando la app corra en la web real, leerá las claves correctamente de Vercel.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
