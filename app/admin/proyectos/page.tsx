'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CatalogoAdmin() {
  const [publicaciones, setPublicaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    
    // CORRECCIÓN 1: Quitamos .eq('status', 'open')
    // Ahora el admin ve TODO (Open, Banned, In_progress) para poder moderar.
    const { data, error } = await supabase
      .from('projects')
      .select('*, profiles(full_name)') 
      .order('created_at', { ascending: false })
    
    if (error) console.error("Error:", error.message)
    else setPublicaciones(data || [])
    
    setLoading(false)
  }

  // Función para Alternar (Banear / Reactivar)
  const toggleEstado = async (id: string, estadoActual: string) => {
    // Si está baneado, lo reactivamos a 'open'. Si no, lo baneamos.
    const nuevoEstado = estadoActual === 'banned' ? 'open' : 'banned';
    const accion = nuevoEstado === 'banned' ? 'OCULTAR' : 'REACTIVAR';

    if(!confirm(`¿${accion} esta publicación?`)) return;

    const { error } = await supabase
        .from('projects')
        .update({ status: nuevoEstado }) 
        .eq('id', id)
    
    if (error) alert("Error: " + error.message)
    else {
        loadData()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-purple-400">📂 Moderación de Catálogo</h1>
            <p className="text-gray-400 text-sm">Gestiona qué se ve en la web.</p>
        </div>
        <button onClick={loadData} className="bg-gray-800 text-xs px-3 py-2 rounded hover:bg-gray-700 border border-gray-600">
            🔄 Refrescar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publicaciones.map((p) => (
            <div key={p.id} className={`rounded-2xl border p-6 shadow-xl transition flex flex-col justify-between relative ${
                p.status === 'banned' ? 'bg-red-900/10 border-red-900' : 'bg-gray-800 border-gray-700 hover:border-purple-500/40'
            }`}>
                
                {/* Badge de Estado */}
                <div className="absolute top-4 right-4">
                     <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                        p.status === 'open' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                        p.status === 'banned' ? 'bg-red-500 text-white border-red-500' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                        {p.status}
                    </span>
                </div>

                <div>
                    <h3 className="font-extrabold text-white text-xl mb-1 truncate pr-14">{p.title}</h3>
                    <div className="text-xs text-purple-200 mb-4 opacity-70">
                        {p.profiles?.full_name || 'Desconocido'}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-3 mb-6">
                        {p.description || '...'}
                    </p>
                </div>

                <div className="flex justify-between items-center border-t border-gray-700/50 pt-4">
                    <div className="text-2xl font-extrabold text-white">${p.budget_min || p.budget}</div>
                    
                    <button 
                        onClick={() => toggleEstado(p.id, p.status)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${
                            p.status === 'banned' 
                            ? 'bg-green-600 text-white border-green-500 hover:bg-green-500' // Botón Reactivar
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-600 hover:text-white' // Botón Banear
                        }`}
                    >
                        {p.status === 'banned' ? '♻️ Reactivar' : '🚫 Ocultar'}
                    </button>
                </div>

            </div>
        ))}
      </div>
    </div>
  )
}