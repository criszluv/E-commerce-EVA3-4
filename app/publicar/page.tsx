'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PublicarProyecto() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Estados del formulario
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [presupuestoMin, setPresupuestoMin] = useState('')
  const [presupuestoMax, setPresupuestoMax] = useState('')
  const [habilidades, setHabilidades] = useState('') // Texto separado por comas

  // Verificar si está logueado al entrar
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Debes iniciar sesión para publicar")
        router.push('/login')
      }
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // 2. Convertir el texto de habilidades en Array (ej: "React, CSS" -> ["React", "CSS"])
    const arraySkills = habilidades.split(',').map(s => s.trim())

    // 3. Guardar en Supabase
    const { error } = await supabase
      .from('projects')
      .insert({
        client_id: user.id, // <--- Aquí vinculamos con el usuario conectado
        title: titulo,
        description: descripcion,
        budget_min: Number(presupuestoMin),
        budget_max: Number(presupuestoMax),
        required_skills: arraySkills,
        status: 'open'
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('¡Proyecto publicado con éxito!')
      router.push('/') // Volver al inicio
      router.refresh() // Refrescar para ver el nuevo proyecto
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-purple-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white/90 shadow-xl rounded-2xl border border-purple-100 p-8">
        <h1 className="text-3xl font-extrabold mb-6 text-purple-900">
          Publicar Nuevo Proyecto
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Describe con claridad qué necesitas y qué presupuesto manejas. Mientras más claro, menos dramas después.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold tracking-wide text-gray-600 uppercase mb-2">
              Título del Proyecto
            </label>
            <input 
              type="text" 
              required
              className="w-full border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white"
              placeholder="Ej: Busco Diseñador Web"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wide text-gray-600 uppercase mb-2">
              Descripción Detallada
            </label>
            <textarea 
              required
              className="w-full border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none p-3 rounded-lg h-32 text-gray-900 bg-white resize-none"
              placeholder="Explica qué necesitas, plazos, entregables, etc."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold tracking-wide text-gray-600 uppercase mb-2">
                Presupuesto Min ($)
              </label>
              <input 
                type="number" 
                required
                className="w-full border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white"
                value={presupuestoMin}
                onChange={e => setPresupuestoMin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wide text-gray-600 uppercase mb-2">
                Presupuesto Max ($)
              </label>
              <input 
                type="number" 
                required
                className="w-full border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white"
                value={presupuestoMax}
                onChange={e => setPresupuestoMax(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wide text-gray-600 uppercase mb-2">
              Habilidades (separadas por coma)
            </label>
            <input 
              type="text" 
              className="w-full border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white"
              placeholder="React, Excel, Inglés..."
              value={habilidades}
              onChange={e => setHabilidades(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Esto se guarda como un arreglo en la BD (ideal para filtros después).
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-700 to-purple-500 text-white font-bold py-3 rounded-xl hover:from-purple-800 hover:to-purple-600 transition transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? 'Publicando...' : 'Publicar Proyecto Ahora'}
          </button>
        </form>
      </div>
    </div>
  )
}
