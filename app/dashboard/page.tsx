'use client'
import { useState, useEffect } from 'react'
// ✅ ESTO ES LO CORRECTO
// Ajusta la ruta (../) según donde esté tu archivo
import { supabase } from '@/lib/supabase' 
// O si no usas alias (@): import { supabase } from '../../../lib/supabase'
import Link from 'next/link'



// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function DashboardRouter() {
  const [rol, setRol] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      setEmail(user.email || 'Usuario')
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setRol(profile?.role || 'client')
      setLoading(false)
    }
    checkRole()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="px-6 py-4 rounded-lg bg-white shadow text-center text-purple-500 font-medium">
        Cargando tu panel...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-purple-50 pb-12">
      <div className="bg-purple-900 text-purple-100 text-xs py-2 px-4 text-center border-b border-purple-700">
        Estás conectado como: <span className="font-semibold text-white">{email}</span> | Rol: <span className="font-semibold text-purple-200">{rol?.toUpperCase()}</span>
      </div>

      {rol === 'freelancer' ? <VendedorDashboard /> : <CompradorDashboard />}
    </div>
  )
}

// ==========================================
// DASHBOARD VENDEDOR (FREELANCER)
// ==========================================
function VendedorDashboard() {
  const [misServicios, setMisServicios] = useState<any[]>([])
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
        const { data: { user } } = await supabase.auth.getUser()
        if(!user) return
        
        // 1. MIS SERVICIOS
        const { data: servs } = await supabase.from('projects').select('*').eq('client_id', user.id)
        setMisServicios(servs || [])

        // 2. PEDIDOS DE MIS SERVICIOS
        const misIds = servs?.map(s => s.id) || []
        if(misIds.length > 0) {
            // CORRECCIÓN: Eliminada la petición de 'email' a profiles
            const { data: orders, error } = await supabase.from('proposals')
                .select(`*, projects(title), profiles(full_name)`)
                .in('project_id', misIds)
                .in('status', ['accepted', 'completed', 'refunded']) 
                .order('created_at', { ascending: false })
            
            if (error) console.error("Error vendedor:", error)
            setPedidos(orders || [])
        }
        setLoading(false)
    }
    load()
  }, [])

  const entregarTrabajo = async (pedidoId: string) => {
    if(!confirm("¿Entregar trabajo?")) return;
    await supabase.from('proposals').update({ status: 'completed' }).eq('id', pedidoId)
    window.location.reload()
  }

  const cancelarTrabajo = async (pedidoId: string) => {
    if(!confirm("¿Rechazar y reembolsar?")) return;
    await supabase.from('proposals').update({ status: 'refunded' }).eq('id', pedidoId)
    window.location.reload()
  }

  const porHacer = pedidos.filter(p => p.status === 'accepted')
  const historial = pedidos.filter(p => p.status === 'completed' || p.status === 'refunded')

  if (loading) return <div className="p-8 text-purple-500">Cargando datos...</div>

  return (
    <div className="container mx-auto p-8 font-sans">
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 text-white p-6 rounded-2xl mb-8 shadow-lg flex justify-between items-center border border-purple-300">
            <div>
                <h1 className="text-3xl font-bold">Panel de Vendedor</h1>
                <p className="opacity-90 text-purple-100">Gestiona tus ventas.</p>
            </div>
            <Link
              href="/publicar"
              className="bg-white text-purple-700 px-4 py-2 rounded-full font-bold hover:bg-purple-50 border border-purple-200 transition"
            >
                + Nuevo Servicio
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h2 className="text-xl font-bold mb-4 text-purple-800">🔥 Pedidos por Entregar (Pagados)</h2>
                {porHacer.length === 0 && (
                  <div className="p-6 bg-white rounded-xl shadow text-gray-400 border border-dashed border-purple-200 text-sm">
                    Sin pedidos pendientes.
                  </div>
                )}
                
                <div className="space-y-4 mb-8">
                    {porHacer.map(p => (
                        <div
                          key={p.id}
                          className="bg-white border-l-4 border-purple-500 p-6 rounded-xl shadow relative border border-purple-100"
                        >
                            <span className="absolute top-4 right-4 bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full font-bold border border-purple-200">
                              💰 ${p.price_quoted}
                            </span>
                            <h3 className="font-bold text-lg text-purple-900">{p.projects?.title}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Cliente: <strong className="text-purple-800">{p.profiles?.full_name}</strong>
                            </p>
                            <div className="flex gap-2">
                                <button
                                  onClick={() => entregarTrabajo(p.id)}
                                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition"
                                >
                                  ✅ Entregar
                                </button>
                                <button
                                  onClick={() => cancelarTrabajo(p.id)}
                                  className="px-3 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 text-sm border border-red-200"
                                >
                                  ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-xl font-bold mb-4 text-purple-900">📦 Mis Servicios Activos</h2>
                <div className="bg-white p-4 rounded-xl shadow border border-purple-100">
                    {misServicios.length === 0 && (
                      <p className="text-gray-400 text-sm">
                        No has publicado servicios.
                      </p>
                    )}
                    {misServicios.map(s => (
                        <div key={s.id} className="flex justify-between border-b last:border-0 border-purple-50 pb-2 py-1">
                            <span className="text-gray-800">{s.title}</span>
                            <Link href={`/proyecto/${s.id}`} className="text-purple-500 text-sm font-medium hover:text-purple-700">
                              Ver
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4 text-purple-900">✅ Historial</h2>
                <div className="bg-white p-6 rounded-xl shadow space-y-4 border border-purple-100">
                    {historial.length === 0 && (
                      <p className="text-gray-400 text-sm">
                        Sin historial.
                      </p>
                    )}
                    {historial.map(t => (
                        <div key={t.id} className="border-b border-purple-50 pb-3 last:border-0">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">{t.projects?.title}</span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    t.status === 'refunded'
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                                  }`}
                                >
                                    {t.status === 'refunded' ? 'Reembolsado' : 'Entregado'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1 text-gray-500">
                                <span>Cliente: <span className="text-purple-800">{t.profiles?.full_name}</span></span>
                                <span
                                  className={
                                    t.status === 'refunded'
                                      ? 'text-red-300 line-through'
                                      : 'text-purple-800 font-semibold'
                                  }
                                >
                                  ${t.price_quoted}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  )
}

// ==========================================
// DASHBOARD COMPRADOR (CLIENTE)
// ==========================================
function CompradorDashboard() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
        const { data: { user } } = await supabase.auth.getUser()
        if(!user) return
        
        // CORRECCIÓN: Eliminada la petición de 'email' a profiles
        const { data, error } = await supabase.from('proposals')
            .select(`
                *, 
                projects (
                    title, description, client_id,
                    profiles ( full_name )
                )
            `) 
            .eq('freelancer_id', user.id) 
            .order('created_at', { ascending: false })
        
        if (error) {
            console.error("Error comprador:", error)
            setError(error.message)
        }
        setPedidos(data || [])
    }
    load()
  }, [])

  const handleEliminar = async (id: string) => {
    if(!confirm("¿Eliminar?")) return;
    setPedidos(prev => prev.filter(p => p.id !== id))
    await supabase.from('proposals').delete().eq('id', id)
  }

  const handlePagarSimulado = async (pedido: any) => {
    if(!confirm("⚠️ ¿Simular pago exitoso?")) return;
    setProcessingPayment(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: proj } = await supabase.from('projects').select('client_id').eq('id', pedido.project_id).single()
    
    await supabase.from('payments').insert({
        project_id: pedido.project_id, payer_id: user?.id, payee_id: proj?.client_id, 
        amount: pedido.price_quoted, status: 'released'
    })

    await supabase.from('proposals').update({ status: 'accepted' }).eq('id', pedido.id)
    alert("✅ ¡Compra exitosa!")
    window.location.reload()
  }

  // Webpay
  const handlePagarWebpay = async (pedido: any) => {
    setProcessingPayment(true)
    try {
        const { data: { user } } = await supabase.auth.getUser();
        localStorage.setItem('pago_pendiente', JSON.stringify({
            project_id: pedido.project_id, propuesta_id: pedido.id,
            payer_id: user?.id, payee_id: pedido.projects.client_id, amount: pedido.price_quoted
        }));
        const res = await fetch('/api/webpay/iniciar', {
            method: 'POST', body: JSON.stringify({ 
                amount: pedido.price_quoted, buyOrder: "ORD-" + Date.now(), sessionId: "SES-" + Date.now() 
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        const form = document.createElement('form');
        form.action = data.url; form.method = 'POST';
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = 'token_ws'; input.value = data.token;
        form.appendChild(input); document.body.appendChild(form);
        form.submit();
    } catch (e: any) { alert(e.message); setProcessingPayment(false); }
  }

  const handleReembolso = async (id: string) => {
    if(!confirm("¿Cancelar y pedir reembolso?")) return;
    await supabase.from('proposals').update({ status: 'refunded' }).eq('id', id)
    window.location.reload()
  }

  const carrito = pedidos.filter(p => p.status === 'pending')
  const enCurso = pedidos.filter(p => p.status === 'accepted')
  const historial = pedidos.filter(p => p.status === 'completed' || p.status === 'refunded')

  return (
    <div className="container mx-auto p-8 font-sans">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-4 text-red-700 rounded-lg text-sm">
            Error de conexión: {error}
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-700 to-purple-500 text-white p-6 rounded-2xl mb-8 shadow-lg border border-purple-300">
            <h1 className="text-3xl font-bold">Panel de Comprador</h1>
            <p className="opacity-90 text-purple-100">Tus compras.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
                {/* CARRITO */}
                <div className="bg-white p-6 rounded-2xl shadow border-t-4 border-purple-300 border border-purple-100">
                    <h2 className="text-xl font-bold mb-6 text-purple-900">🛒 Tu Carrito</h2>
                    {carrito.length === 0 && (
                      <p className="text-gray-400 text-sm">
                        Vacío.
                      </p>
                    )}
                    
                    {carrito.map(p => (
                        <div
                          key={p.id}
                          className="border border-purple-100 bg-purple-50/40 p-4 rounded-xl mb-4 shadow-sm relative"
                        >
                            <button
                              onClick={() => handleEliminar(p.id)}
                              className="absolute top-4 right-4 text-red-400 hover:text-red-600"
                            >
                              ✕
                            </button>
                            <h3 className="font-bold text-lg pr-6 text-purple-900">{p.projects?.title}</h3>
                            <p className="text-xs text-gray-500 mb-2">
                              Vendedor: <span className="text-purple-800">{p.projects?.profiles?.full_name || '...'}</span>
                            </p>
                            <div className="font-bold text-xl mb-3 text-purple-900">${p.price_quoted}</div>
                            <div className="flex gap-2">
                                <button
                                  onClick={() => handlePagarWebpay(p)}
                                  disabled={processingPayment}
                                  className="flex-1 bg-purple-700 text-white py-2 rounded-lg font-bold text-sm hover:bg-purple-800 disabled:opacity-60 transition"
                                >
                                    {processingPayment ? 'Procesando...' : '💳 Webpay'}
                                </button>
                                <button
                                  onClick={() => handlePagarSimulado(p)}
                                  disabled={processingPayment}
                                  className="bg-white text-gray-700 px-3 rounded-lg font-bold hover:bg-gray-50 text-sm border border-gray-200"
                                >
                                  🛠️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* EN CURSO */}
                <div className="bg-white p-6 rounded-2xl shadow border-t-4 border-purple-400 border border-purple-100">
                    <h2 className="text-xl font-bold mb-6 text-purple-900">⏳ En Curso</h2>
                    {enCurso.length === 0 && (
                      <p className="text-gray-400 text-sm">
                        Nada pendiente.
                      </p>
                    )}
                    {enCurso.map(p => (
                        <div
                          key={p.id}
                          className="bg-purple-50 p-4 rounded-xl mb-3 border border-purple-100 relative"
                        >
                            <h3 className="font-bold text-purple-900">{p.projects?.title}</h3>
                            <p className="text-sm text-purple-700">
                              Vendedor: <span className="font-medium">{p.projects?.profiles?.full_name || '...'}</span>
                            </p>
                            <div className="mt-2 text-xs bg-white inline-block px-2 py-1 rounded-full border border-purple-200 text-purple-700">
                              🔨 Trabajando...
                            </div>
                            <button
                              onClick={() => handleReembolso(p.id)}
                              className="absolute top-4 right-4 text-xs text-red-500 underline"
                            >
                              Cancelar
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* HISTORIAL */}
            <div className="bg-white p-6 rounded-2xl shadow border-t-4 border-purple-500 border border-purple-100">
                <h2 className="text-xl font-bold mb-6 text-purple-900">✅ Historial</h2>
                {historial.length === 0 && (
                  <p className="text-gray-400 text-sm">
                    Sin historial.
                  </p>
                )}
                {historial.map(p => (
                    <div
                      key={p.id}
                      className="border-b border-purple-50 py-3 last:border-0 flex justify-between items-center"
                    >
                        <div>
                            <p className="font-bold text-gray-900">{p.projects?.title}</p>
                            <p className="text-xs text-gray-500">
                              Vendedor: <span className="text-purple-800">{p.projects?.profiles?.full_name}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                p.status === 'refunded'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-purple-50 text-purple-800 border border-purple-200'
                              }`}
                            >
                                {p.status === 'refunded' ? 'Reembolsado' : 'Entregado'}
                            </span>
                            <p
                              className={`font-bold text-sm mt-1 ${
                                p.status === 'refunded'
                                  ? 'line-through text-red-300'
                                  : 'text-purple-900'
                              }`}
                            >
                              ${p.price_quoted}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  )
}
