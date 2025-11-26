'use client'
import { useState, useEffect } from 'react'
// ✅ ESTO ES LO CORRECTO
// Ajusta la ruta (../) según donde esté tu archivo
import { supabase } from '@/lib/supabase' 
// O si no usas alias (@): import { supabase } from '../../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    usuarios: 0,
    proyectos: 0,
    ordenes: 0
  })

  useEffect(() => {
    async function loadStats() {
      // 1. Contar Usuarios
      // FIX: Usamos { count: 'exact', head: true }
      // Esto solo cuenta las filas, NO intenta ordenar por 'created_at', así que no fallará.
      const { count: usersCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      if (userError) console.error("Error contando usuarios:", userError.message)

      // 2. Contar Proyectos Totales
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

      // 3. Contar Ventas/Ordenes (proyectos que NO están 'open')
      const { count: ordersCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'pending')

      setStats({
        usuarios: usersCount || 0,
        proyectos: projectsCount || 0,
        ordenes: ordersCount || 0
      })
    }
    loadStats()
  }, [])

  return (
    <div>
        <h1 className="text-3xl font-bold mb-8 text-white">📊 Resumen del Sistema</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* TARJETA 1: USUARIOS */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl">👥</span>
                    <h3 className="text-lg font-medium text-gray-400">Usuarios Totales</h3>
                </div>
                <p className="text-4xl font-bold text-blue-400">{stats.usuarios}</p>
            </div>

            {/* TARJETA 2: CATÁLOGO */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl">📂</span>
                    <h3 className="text-lg font-medium text-gray-400">Proyectos Publicados</h3>
                </div>
                <p className="text-4xl font-bold text-purple-400">{stats.proyectos}</p>
            </div>

            {/* TARJETA 3: VENTAS */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl">💰</span>
                    <h3 className="text-lg font-medium text-gray-400">Ventas / En Proceso</h3>
                </div>
                <p className="text-4xl font-bold text-green-400">{stats.ordenes}</p>
            </div>

        </div>
    </div>
  )
}
