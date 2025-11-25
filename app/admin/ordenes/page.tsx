'use client'
import { useState, useEffect } from 'react'
// CAMBIO: Usamos el cliente centralizado para evitar errores de build
import { supabase } from '@/lib/supabase' 

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar SOLO proyectos que ya no están "open" (es decir, hay dinero de por medio)
  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*, profiles(full_name, email)')
      .neq('status', 'open') // <-- FILTRO CLAVE: Ignorar los que solo están publicados
      .order('created_at', { ascending: false })
    
    setOrdenes(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleRefund = async (projectId: string) => {
    // 1. Confirmación
    const razon = prompt("⚠️ ¿Confirmar reembolso? Escribe la razón (ej: Cliente insatisfecho):")
    if (!razon) return

    // 2. Lógica de reembolso
    const { error } = await supabase
        .from('projects')
        .update({ 
            status: 'refunded', 
            description: `[REEMBOLSADO: ${razon}]` // Un pequeño hack para guardar nota
        })
        .eq('id', projectId)

    if (error) alert("Error: " + error.message)
    else {
        alert("✅ Proyecto marcado como reembolsado. (Recuerda hacer la devolución bancaria manual si no tienes API conectada)")
        loadData()
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-green-400">💰 Gestión de Ventas y Pagos</h1>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-700 text-xs uppercase text-gray-400">
            <tr>
              <th className="p-4">Proyecto / ID</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Estado Actual</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr key={orden.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="p-4">
                  <div className="font-bold text-white">{orden.title}</div>
                  <div className="text-xs text-gray-500 font-mono">{orden.id}</div>
                </td>
                <td className="p-4">
                  <div>{orden.profiles?.full_name}</div>
                  <div className="text-xs text-gray-500">{orden.profiles?.email}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${
                    orden.status === 'in_progress' ? 'bg-blue-900 text-blue-200 border-blue-700' :
                    orden.status === 'completed' ? 'bg-green-900 text-green-200 border-green-700' :
                    'bg-red-900 text-red-200 border-red-700' // Refunded o Cancelled
                  }`}>
                    {orden.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                    {orden.status !== 'refunded' && (
                        <button 
                            onClick={() => handleRefund(orden.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs transition"
                        >
                            💸 Reembolsar & Cancelar
                        </button>
                    )}
                    {orden.status === 'refunded' && (
                        <span className="text-gray-500 text-xs italic">Reembolsado</span>
                    )}
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && !loading && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay proyectos pagados aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}