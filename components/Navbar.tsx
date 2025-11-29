'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase' 
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, ShoppingBag, LogIn, LogOut, User, DollarSign, Send, Zap } from 'lucide-react'


export default function Navbar() {
    const [user, setUser] = useState<any>(null)
    const [rol, setRol] = useState<string | null>(null)
    // 💡 NUEVO ESTADO: Contador del carrito
    const [itemsEnCarrito, setItemsEnCarrito] = useState(0)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                // 1. Cargar Perfil (Rol y Ban)
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role, is_banned')
                    .eq('id', user.id)
                    .single()

                if (profileData?.is_banned) {
                    alert("⛔ ACCESO DENEGADO\n\nTu cuenta ha sido suspendida por un administrador.\nSi crees que es un error, contacta a soporte.")
                    await supabase.auth.signOut()
                    setUser(null)
                    setRol(null)
                    router.push('/login')
                    return;
                }

                setUser(user)
                setRol(profileData?.role || 'client')
                
                // 2. 💡 NUEVA LÓGICA: Contar ítems en el carrito (propuestas 'pending')
                if (profileData?.role === 'client') {
                     const { count, error } = await supabase
                        .from('proposals')
                        .select('id', { count: 'exact', head: true }) // Contar filas
                        .eq('freelancer_id', user.id) // El cliente es el freelancer_id que hace la propuesta de compra
                        .eq('status', 'pending');

                    if (error) {
                        console.error("Error al contar el carrito:", error);
                    } else {
                        setItemsEnCarrito(count || 0);
                    }
                } else {
                    setItemsEnCarrito(0);
                }

            } else {
                setUser(null)
                setRol(null)
                setItemsEnCarrito(0);
            }
        }
        getUser()
    }, [pathname])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setRol(null)
        setItemsEnCarrito(0);
        router.push('/login')
        router.refresh()
    }

    return (
        <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-purple-800 shadow-xl">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                
                {/* LOGO */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-lg md:text-xl font-extrabold text-white hover:text-purple-400 transition"
                >
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 text-white text-base shadow-lg">
                        <Zap className="h-4 w-4" />
                    </span>
                    <span>
                        <span className="text-purple-400">Freelance</span>Hub
                    </span>
                </Link>

                {/* MENÚ */}
                <div className="flex items-center space-x-3 md:space-x-4 text-sm">
                    
                    {/* 1. GUEST (No Registrado) - Sin cambios */}
                    {!user && (
                        <>
                            <Link 
                                href="/" 
                                className="hidden sm:inline-flex items-center gap-1.5 text-gray-300 font-medium hover:text-purple-400 transition"
                            >
                                <Search className="h-4 w-4" /> Explorar Servicios
                            </Link>
                            <Link 
                                href="/login" 
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition shadow-md shadow-purple-900/50 flex items-center gap-2"
                            >
                                <LogIn className="h-4 w-4" /> Entrar / Registrarse
                            </Link>
                        </>
                    )}

                    {/* 2. FREELANCER (Vendedor) - Sin cambios */}
                    {user && rol === 'freelancer' && (
                        <>
                            <Link 
                                href="/dashboard" 
                                className="text-gray-300 hover:text-purple-400 font-medium hidden sm:inline-flex items-center gap-1.5"
                            >
                                <DollarSign className="h-4 w-4" /> Mis Ventas
                            </Link>
                            <Link 
                                href="/publicar" 
                                className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-200 transition text-xs md:text-sm flex items-center gap-1.5"
                            >
                                <Send className="h-4 w-4" /> Publicar Servicio
                            </Link>
                        </>
                    )}

                    {/* 3. CLIENTE (Comprador) */}
                    {user && rol === 'client' && (
                        <>
                            <Link 
                                href="/" 
                                className="text-gray-300 hover:text-purple-400 font-medium hidden sm:inline-flex items-center gap-1.5"
                            >
                                <Search className="h-4 w-4" /> Explorar Tienda
                            </Link>
                            {/* 💡 ACTUALIZADO: Botón Mi Carrito con Contador */}
                            <Link 
                                href="/dashboard" 
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium text-xs md:text-sm shadow-md shadow-purple-900/50 flex items-center gap-2 relative"
                            >
                                <ShoppingBag className="h-4 w-4" /> Mi Carrito
                                {itemsEnCarrito > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-extrabold shadow-lg border border-gray-900">
                                        {itemsEnCarrito > 99 ? '+99' : itemsEnCarrito}
                                    </span>
                                )}
                            </Link>
                        </>
                    )}

                    {/* 4. ADMIN (GOD MODE) */}
                    {user && rol === 'admin' && (
                        <>
                            <span className="hidden sm:inline-block text-[10px] font-mono text-red-500 bg-red-900/20 px-2 py-1 rounded border border-red-500/50 text-white">
                                ⚡ ADMIN
                            </span>
                            <Link 
                                href="/admin" 
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition font-bold text-xs md:text-sm shadow-md flex items-center gap-1"
                            >
                                <Zap className="h-4 w-4" /> Panel
                            </Link>
                        </>
                    )}

                    {/* LOGOUT */}
                    {user && (
                        <button 
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-red-500 ml-2 p-1 transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    )}

                </div>
            </div>
        </nav>
    )
}