'use client'
import { useState, useEffect } from 'react'
// ✅ ESTO ES LO CORRECTO
// Ajusta la ruta (../) según donde esté tu archivo
import { supabase } from '@/lib/supabase' 
// O si no usas alias (@): import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'



export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [rol, setRol] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 1. Buscamos el ROL y el estado de BAN
        const { data } = await supabase
            .from('profiles')
            .select('role, is_banned') // <--- IMPORTANTE: Pedimos ambas columnas
            .eq('id', user.id)
            .single()

        // 2. VERIFICACIÓN DE SEGURIDAD: ¿Está baneado?
        if (data?.is_banned) {
            alert("⛔ ACCESO DENEGADO\n\nTu cuenta ha sido suspendida por un administrador.\nSi crees que es un error, contacta a soporte.")
            
            // Lo expulsamos inmediatamente
            await supabase.auth.signOut()
            setUser(null)
            setRol(null)
            router.push('/login')
            return; // Detenemos la función aquí
        }

        // 3. Si no está baneado, guardamos el estado y continuamos
        setUser(user)
        setRol(data?.role || 'client')
      } else {
        setUser(null)
        setRol(null)
      }
    }
    getUser()
  }, [pathname]) // Se ejecuta cada vez que cambias de página (seguridad constante)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRol(null)
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-purple-100 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* LOGO */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg md:text-xl font-extrabold text-purple-800 hover:text-purple-900 transition"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 text-white text-base shadow-md">
            🚀
          </span>
          <span>
            Freelance<span className="text-purple-500">Hub</span>
          </span>
        </Link>

        {/* MENÚ */}
        <div className="flex items-center space-x-3 md:space-x-4 text-sm">
          
          {/* 1. GUEST */}
          {!user && (
            <>
                <Link href="/login" className="hidden sm:inline-block text-purple-700 font-medium hover:text-purple-900">
                    Explorar
                </Link>
                <Link href="/login" className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-700 transition shadow-sm">
                    Entrar
                </Link>
            </>
          )}

          {/* 2. FREELANCER */}
          {user && rol === 'freelancer' && (
            <>
                <Link href="/dashboard" className="text-gray-600 hover:text-purple-700 font-medium hidden sm:block">
                  Mis Ventas
                </Link>
                <Link href="/publicar" className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-bold hover:bg-purple-200 transition text-xs md:text-sm">
                  + Publicar
                </Link>
            </>
          )}

          {/* 3. CLIENTE */}
          {user && rol === 'client' && (
             <>
                <Link href="/" className="text-gray-600 hover:text-purple-700 font-medium hidden sm:block">
                  Buscar Servicios
                </Link>
                <Link href="/dashboard" className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition font-medium text-xs md:text-sm shadow-sm">
                  Mis Pedidos
                </Link>
             </>
          )}

          {/* 4. ADMIN (GOD MODE) */}
          {user && rol === 'admin' && (
             <>
                <span className="hidden sm:inline-block text-[10px] font-mono text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                  GOD MODE
                </span>
                <Link 
                  href="/admin" 
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition font-bold text-xs md:text-sm shadow-md flex items-center gap-1"
                >
                  ⚡ Panel Admin
                </Link>
             </>
          )}

          {/* LOGOUT */}
          {user && (
            <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 ml-2 p-1"
                title="Cerrar Sesión"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
            </button>
          )}

        </div>
      </div>
    </nav>
  )
}