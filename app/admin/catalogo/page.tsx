'use client'
import { useState, useEffect } from 'react'
// CAMBIO IMPORTANTE: Importamos el cliente desde tu archivo centralizado
// Si te marca error en rojo, asegúrate de que creaste la carpeta "lib" y el archivo "supabase.ts"
import { supabase } from '@/lib/supabase' 

export default function PropuestasPage() {
  const [propuestas, setPropuestas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    // AQUÍ ESTÁ LA MAGIA:
    // 1. Pedimos datos de 'proposals'
    // 2. Traemos el título del proyecto relacionado: projects(title)
    // 3. Traemos el nombre del freelancer: profiles!freelancer_id(full_name, email)
    
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        projects (title),
        profiles!freelancer_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
        console.error("Error cargando propuestas:", error.message)
    } else {
        setPropuestas(data || [])
    }
    
    setLoading(false)
  }

  const borrarPropuesta = async (id: string) => {
    if(!confirm("¿Borrar esta propuesta/transacción permanentemente?")) return;

    const { error } = await supabase.from('proposals').delete().eq('id', id)
    
    if (error) alert("Error: " + error.message)
    else {
        alert("🗑️ Eliminado correctamente")
        loadData()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-yellow-400">📝 Propuestas y Ofertas</h1>
            <p className="text-gray-400 text-sm">Gestión de bids y compras directas (Tabla Proposals)</p>
        </div>
        <button onClick={loadData} className="bg-gray-800 text-xs px-3 py-2 rounded hover:bg-gray-700 border border-gray-600">
            🔄 Refrescar
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-xs uppercase text-gray-400">
                <tr>
                    <th className="p-4">Proyecto / Servicio</th>
                    <th className="p-4">Freelancer</th>
                    <th className="p-4">Mensaje / Tipo</th>
                    <th className="p-4">Precio & Estado</th>
                    <th className="p-4 text-right">Acción</th>
                </tr>
            </thead>
            <tbody>
                {propuestas.map((p) => (
                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        {/* Columna 1: Proyecto */}
                        <td className="p-4">
                            <div className="font-bold text-white max-w-[200px] truncate">
                                {p.projects?.title || 'Proyecto eliminado'}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">{p.project_id.slice(0,8)}...</div>
                        </td>

                        {/* Columna 2: Freelancer */}
                        <td className="p-4">
                            <div className="text-blue-300">{p.profiles?.full_name || 'Desconocido'}</div>
                            <div className="text-xs text-gray-500">{p.profiles?.email}</div>
                        </td>

                        {/* Columna 3: Cover Letter */}
                        <td className="p-4">
                            <div className="text-xs italic text-gray-400 max-w-[250px]">
                                "{p.cover_letter || 'Sin mensaje'}"
                            </div>
                        </td>

                        {/* Columna 4: Precio y Estado */}
                        <td className="p-4">
                            <div className="font-bold text-lg text-white">${p.price_quoted}</div>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                p.status === 'accepted' ? 'bg-green-900 text-green-300' :
                                p.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                                p.status === 'refunded' ? 'bg-red-900 text-red-300' :
                                'bg-yellow-900 text-yellow-300' // pending
                            }`}>
                                {p.status}
                            </span>
                        </td>

                        {/* Columna 5: Botón Borrar */}
                        <td className="p-4 text-right">
                            <button 
                                onClick={() => borrarPropuesta(p.id)}
                                className="text-red-400 hover:text-white bg-red-900/20 hover:bg-red-600 border border-red-900 px-3 py-1 rounded text-xs transition"
                            >
                                Eliminar
                            </button>
                        </td>
                    </tr>
                ))}
                {propuestas.length === 0 && !loading && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay propuestas registradas.</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  )
}