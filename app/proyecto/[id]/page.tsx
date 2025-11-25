'use client'
import { useState, useEffect } from 'react'
// ✅ ESTO ES LO CORRECTO
// Ajusta la ruta (../) según donde esté tu archivo
import { supabase } from '@/lib/supabase' 
// O si no usas alias (@): import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'


export default function DetalleServicio() {
  const params = useParams()
  const router = useRouter()
  const [servicio, setServicio] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [rol, setRol] = useState<string | null>(null) // Nuevo estado para el Rol
  const [loading, setLoading] = useState(false)
  
  const [estadoCompra, setEstadoCompra] = useState<'ninguno' | 'en_carrito' | 'comprado'>('ninguno')

  useEffect(() => {
    async function cargar() {
      // 1. Cargar datos del servicio
      const { data } = await supabase.from('projects').select(`*, profiles(full_name)`).eq('id', params.id).single()
      setServicio(data)

      // 2. Verificar usuario y rol
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Obtener ROL
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setRol(profile?.role || 'client')

        // Verificar si ya compró (solo si es cliente o si queremos saber el estado)
        if (data) {
            const { data: ordenes } = await supabase.from('proposals')
                .select('status')
                .eq('project_id', data.id)
                .eq('freelancer_id', user.id) // freelancer_id es el COMPRADOR

            if (ordenes && ordenes.length > 0) {
                const estaPagado = ordenes.some(o => o.status === 'accepted' || o.status === 'completed')
                const estaEnCarrito = ordenes.some(o => o.status === 'pending')

                if (estaPagado) setEstadoCompra('comprado')
                else if (estaEnCarrito) setEstadoCompra('en_carrito')
            }
        }
      }
    }
    if(params.id) cargar()
  }, [params])

  const handleComprar = async () => {
    if (!user) return router.push('/login')
    
    if (estadoCompra !== 'ninguno') {
        router.push('/dashboard')
        return
    }

    setLoading(true)
    
    const { error } = await supabase.from('proposals').insert({
        project_id: servicio.id,
        freelancer_id: user.id, 
        price_quoted: servicio.budget_min, 
        cover_letter: 'Compra directa desde web',
        status: 'pending' 
    })

    if (error) {
        alert('Error: ' + error.message)
    } else {
        alert('✅ ¡Agregado al carrito!')
        router.push('/dashboard') 
    }
    setLoading(false)
  }

  const handleEliminarDelCarrito = async () => {
    if(!confirm("¿Quitar del carrito?")) return;
    setLoading(true);

    const { error } = await supabase.from('proposals')
        .delete()
        .eq('project_id', servicio.id)
        .eq('freelancer_id', user.id)
        .eq('status', 'pending')
    
    if (error) alert("Error: " + error.message)
    else {
        setEstadoCompra('ninguno') 
        alert("🗑️ Eliminado del carrito")
    }
    setLoading(false);
  }

  if (!servicio) return <div className="p-12 text-center text-gray-500">Cargando detalle...</div>

  // Lógica de visualización
  const esMio = user && user.id === servicio.client_id;
  const esVendedor = rol === 'freelancer';

  return (
    <div className="container mx-auto p-8 font-sans max-w-5xl">
      <Link href={esVendedor ? "/dashboard" : "/"} className="text-purple-600 hover:text-purple-800 hover:underline mb-6 inline-block font-medium">
        ← Volver
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* IZQUIERDA: INFO SERVICIO */}
        <div className="p-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">{servicio.title}</h1>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">{servicio.description}</p>
            
            <div className="flex items-center gap-3 mb-8 p-4 bg-gray-50 rounded-2xl">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center font-bold text-purple-600 text-xl border border-white shadow-sm">
                    {servicio.profiles?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Vendido por</p>
                    <p className="font-bold text-gray-800">{servicio.profiles?.full_name}</p>
                </div>
            </div>

            {servicio.required_skills && (
                <div className="mt-4">
                    <h3 className="font-bold text-sm text-gray-400 uppercase mb-3 tracking-wider">Incluye</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {servicio.required_skills?.map((sk:string) => (
                            <span key={sk} className="bg-purple-50 text-purple-700 text-sm px-3 py-1.5 rounded-lg font-medium border border-purple-100">
                                {sk}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* DERECHA: CAJA DE ACCIÓN */}
        <div className="bg-gradient-to-b from-gray-50 to-white p-10 border-l border-gray-100 flex flex-col justify-center relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="mb-8 text-center relative z-10">
                <p className="text-gray-400 font-medium uppercase text-sm tracking-widest mb-2">Precio del Servicio</p>
                <p className="text-5xl font-extrabold text-gray-900 tracking-tight">${servicio.budget_min}</p>
            </div>

            <div className="relative z-10">
                {/* CASO 1: ES VENDEDOR (CUALQUIERA) */}
                {esVendedor ? (
                    <div className="w-full bg-purple-50 text-purple-700 py-6 px-6 rounded-2xl font-bold text-center border border-purple-100 flex flex-col items-center gap-2">
                        {esMio ? (
                            <>
                                <span className="text-3xl">👑</span>
                                <span className="text-lg">Este es tu servicio</span>
                                <span className="text-xs font-normal opacity-80">Estás viendo la vista previa pública.</span>
                            </>
                        ) : (
                            <>
                                <span className="text-3xl">🔒</span>
                                <span className="text-lg">Modo Vendedor</span>
                                <span className="text-xs font-normal opacity-80">Debes entrar como Cliente para comprar.</span>
                            </>
                        )}
                    </div>
                ) : (
                    /* CASO 2: ES COMPRADOR (CLIENTE) */
                    <>
                        {estadoCompra === 'ninguno' && (
                            <button 
                                onClick={handleComprar}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 transition-all duration-300"
                            >
                                {loading ? 'Procesando...' : '🛒 Agregar al Carrito'}
                            </button>
                        )}

                        {estadoCompra === 'en_carrito' && (
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full bg-yellow-400 text-yellow-900 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-500 hover:shadow-lg transition-all shadow-yellow-200"
                                >
                                    ⚠️ Ya en tu Carrito
                                    <span className="block text-xs font-medium mt-1 opacity-80">(Clic para pagar)</span>
                                </button>

                                <button 
                                    onClick={handleEliminarDelCarrito}
                                    disabled={loading}
                                    className="text-sm text-red-400 hover:text-red-600 font-medium text-center py-2 transition-colors"
                                >
                                    {loading ? 'Eliminando...' : 'Quitar del carrito'}
                                </button>
                            </div>
                        )}

                        {estadoCompra === 'comprado' && (
                            <div className="w-full bg-green-50 text-green-700 py-5 rounded-2xl font-bold text-center border border-green-100">
                                ✅ Ya compraste este servicio
                                <Link href="/dashboard" className="block text-sm text-green-600 underline mt-2 hover:text-green-800">
                                    Ver en mis pedidos
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <div className="mt-8 flex justify-center items-center gap-2 text-gray-400 text-xs relative z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <span>Compra protegida con garantía de satisfacción</span>
            </div>
        </div>

      </div>
    </div>
  )
}