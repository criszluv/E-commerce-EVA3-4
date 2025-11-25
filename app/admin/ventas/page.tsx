'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function VentasPagosPage() {
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    // 1. Cargamos PROPOSALS (Donde está el dinero y el estado del contrato)
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        projects (title),
        profiles!freelancer_id (full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (error) console.error("Error:", error.message)
    else setTransacciones(data || [])
    setLoading(false)
  }

  const handleRefund = async (id: string) => {
    const razon = prompt("⚠️ ¿Generar REEMBOLSO y cancelar contrato?\nMotivo:")
    if (!razon) return;

    const { error } = await supabase
        .from('proposals')
        .update({ 
            status: 'refunded',
            cover_letter: `[REEMBOLSADO: ${razon}]` 
        })
        .eq('id', id)

    if (error) alert("Error: " + error.message)
    else {
        alert("💸 Reembolso ejecutado.")
        loadData()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-green-400">💰 Ventas y Contratos</h1>
            <p className="text-gray-400 text-sm">Historial de pagos, trabajos completados y reembolsos.</p>
        </div>
        <button onClick={loadData} className="bg-gray-800 text-xs px-3 py-2 rounded hover:bg-gray-700 border border-gray-600">
            🔄 Refrescar
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {transacciones.map((t) => (
            <div key={t.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Info Proyecto */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                         <h3 className="text-lg font-bold text-white">{t.projects?.title || 'Proyecto Borrado'}</h3>
                         <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            t.status === 'completed' ? 'bg-blue-900 text-blue-200' :
                            t.status === 'refunded' ? 'bg-red-900 text-red-200' :
                            'bg-green-900 text-green-200'
                        }`}>
                            {t.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400">Freelancer: {t.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500 italic">"{t.cover_letter}"</p>
                </div>

                {/* Dinero y Botones */}
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-xl font-bold text-white">${t.price_quoted}</div>
                        <div className="text-[10px] text-gray-500">Monto Pagado</div>
                    </div>

                    {t.status !== 'refunded' && (
                        <button 
                            onClick={() => handleRefund(t.id)}
                            className="bg-red-900/20 border border-red-800 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition"
                        >
                            💸 Reembolsar
                        </button>
                    )}
                     {t.status === 'refunded' && (
                        <span className="text-xs text-red-500 font-mono border border-red-900 px-2 py-1 rounded">
                            REEMBOLSADO
                        </span>
                    )}
                </div>
            </div>
        ))}
         {transacciones.length === 0 && !loading && (
            <div className="p-10 text-center border-2 border-dashed border-gray-700 rounded-xl text-gray-500">
                No hay transacciones registradas.
            </div>
        )}
      </div>
    </div>
  )
}