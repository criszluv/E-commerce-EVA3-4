'use client'
import { useState, useEffect } from 'react'
// ✅ ESTO ES LO CORRECTO
// Ajusta la ruta (../) según donde esté tu archivo
import { supabase } from '@/lib/supabase' 
// O si no usas alias (@): import { supabase } from '../../../lib/supabase'
import Link from 'next/link'



export default function Home() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarServicios() {
      // Traemos los servicios y el nombre del vendedor
      const { data, error } = await supabase
        .from('projects')
        .select(`*, profiles(full_name)`)
        // IMPORTANTE: Filtramos por 'open' para que NO salgan los baneados
        .eq('status', 'open') 
        .order('created_at', { ascending: false }) // Los más nuevos primero
      
      if (error) {
        console.log('Error:', error)
      } else {
        setServicios(data || [])
      }
      setLoading(false)
    }

    cargarServicios()
  }, [])

  return (
    <div className="min-h-screen bg-purple-50 font-sans">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-purple-900">
            Encuentra el servicio perfecto
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Conecta con freelancers expertos en minutos y dale nivel pro a tus proyectos.
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-200 border-t-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-400">Cargando servicios...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.length === 0 ? (
               <div className="col-span-full py-12 text-center border-2 border-dashed border-purple-200 rounded-2xl bg-white/50">
                  <p className="text-xl font-bold text-purple-900 mb-2">No hay servicios disponibles</p>
                  <p className="text-gray-500">Sé el primero en publicar un servicio.</p>
               </div>
            ) : (
              servicios.map((servicio) => (
                <div
                  key={servicio.id}
                  className="group bg-white/95 border border-purple-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-purple-300 transition overflow-hidden flex flex-col"
                >
                  {/* IMAGEN DE PORTADA */}
                  <div className="h-40 bg-gradient-to-r from-purple-100 via-purple-50 to-white flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <span className="text-4xl drop-shadow-sm">📦</span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                      <h2 className="text-xl font-bold text-purple-900 mb-2 group-hover:text-purple-700 transition line-clamp-1">
                          {servicio.title}
                      </h2>
                      
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                          {servicio.description}
                      </p>

                      <div className="flex items-center gap-2 mb-4">
                          <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 border border-purple-200">
                            {servicio.profiles?.full_name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
                              {servicio.profiles?.full_name || 'Vendedor'}
                          </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-purple-50 mt-auto">
                          
                          {/* PRECIO ÚNICO LIMPIO */}
                          <div className="flex items-center">
                              <span className="text-2xl font-extrabold text-purple-900 tracking-tight">
                                  ${servicio.budget_min || servicio.budget}
                              </span>
                          </div>
                          
                          <Link 
                              href={`/proyecto/${servicio.id}`} 
                              className="bg-gradient-to-r from-purple-700 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-purple-800 hover:to-purple-600 transition shadow-md shadow-purple-200"
                          >
                              Ver Detalles
                          </Link>
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}