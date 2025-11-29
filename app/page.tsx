'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Loader, Zap, Gift, Percent, Filter } from 'lucide-react'

// Lista de Categorías sugeridas para el filtro
const CATEGORIAS = [
  { value: 'all', label: 'Todas las Categorías' },
  { value: 'web-mobile', label: 'Desarrollo Web y Móvil' },
  { value: 'design-creative', label: 'Diseño y Creatividad' },
  { value: 'digital-marketing', label: 'Marketing Digital' },
  { value: 'writing-translation', label: 'Redacción y Traducción' },
  { value: 'support-tutoring', label: 'Soporte y Tutorías' },
  { value: 'data-ai', label: 'Data Science y AI' },
  { value: 'consulting', label: 'Consultoría Empresarial' },
  { value: 'other', label: 'Otros' },
]

// Función para formatear el precio como moneda
const formatCurrency = (amount: number | string | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A'
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.]/g, '')) : amount
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(num)
}

// ✅ Helper para sacar la PRIMERA imagen de image_url (array, string o json string)
const getFirstImageUrl = (imageField: any): string | null => {
  if (!imageField) return null

  if (Array.isArray(imageField)) {
    return imageField[0] || null
  }

  if (typeof imageField === 'string') {
    // Puede ser una URL sola o un JSON tipo '["url1","url2"]'
    try {
      const parsed = JSON.parse(imageField)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0]
      }
    } catch {
      // No era JSON, asumimos URL simple
      return imageField
    }
    return imageField
  }

  return null
}

// --- Componente de Banner Destacado (El Producto Principal) ---
const BannerDestacado = ({ servicio }: { servicio: any }) => {
  if (!servicio) return null

  const descuento = Math.floor(Math.random() * (45 - 20 + 1)) + 20
  const precioOferta = servicio.price
  const precioOriginal = servicio.price * (1 + descuento / 100)

  const firstImageUrl = getFirstImageUrl(servicio.image_url)

  return (
    <div className="bg-gradient-to-r from-gray-900 to-purple-950/70 p-6 md:p-12 rounded-2xl shadow-2xl border-2 border-purple-800 mb-12 flex flex-col lg:flex-row items-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 bg-no-repeat bg-cover"
        style={{ backgroundImage: "url('/img/tech_pattern.svg')" }}
      ></div>

      <div className="lg:w-1/2 z-10 text-center lg:text-left mb-6 lg:mb-0">
        <p className="text-sm font-semibold text-white mb-2 tracking-widest">OFERTA FLASH EXCLUSIVA</p>
        <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
          {servicio.title.substring(0, 30)}
        </h2>
        <p className="text-xl text-gray-300 mb-6">
          {servicio.description.substring(0, 100)}...
        </p>

        <div className="flex items-center justify-center lg:justify-start gap-6 mb-8">
          <div className="text-center">
            <span className="text-2xl font-extrabold text-purple-400 block">
              {formatCurrency(precioOferta)}
            </span>
            <span className="text-sm text-gray-500 line-through">
              {formatCurrency(precioOriginal)}
            </span>
          </div>

          <div className="p-3 bg-red-600 rounded-lg text-white font-black text-xl shadow-xl transform hover:scale-105 transition">
            {descuento}% DCTO.
          </div>
        </div>

        <Link
          href={`/proyecto/${servicio.id}`}
          className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl text-lg font-bold shadow-lg shadow-purple-900/50 transition duration-300"
        >
          ¡Lo Quiero Ahora!
        </Link>
      </div>

      <div className="lg:w-1/2 flex justify-center items-center relative z-10">
        {firstImageUrl ? (
          <div className="h-64 w-64 rounded-3xl overflow-hidden shadow-2xl border border-purple-700">
            <img
              src={firstImageUrl}
              alt={`Imagen destacada de ${servicio.title}`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-64 w-64 bg-purple-700 rounded-full flex items-center justify-center shadow-2xl shadow-purple-900/70 animate-pulse-slow">
            <Zap className="h-20 w-20 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState(CATEGORIAS[0].value)

  useEffect(() => {
    async function cargarServicios() {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select(`*, profiles(full_name)`)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) {
        console.log('Error:', error)
      } else {
        setServicios(data || [])
      }
      setLoading(false)
    }

    cargarServicios()
  }, [])

  // --- Lógica de Filtrado Combinado ---
  const serviciosFiltrados = useMemo(() => {
    let resultados = servicios
    const busquedaEnMinusculas = filtroBusqueda.toLowerCase()

    if (filtroBusqueda) {
      resultados = resultados.filter(
        (servicio) =>
          servicio.title.toLowerCase().includes(busquedaEnMinusculas) ||
          servicio.description.toLowerCase().includes(busquedaEnMinusculas) ||
          servicio.profiles?.full_name?.toLowerCase().includes(busquedaEnMinusculas)
      )
    }

    if (filtroCategoria !== 'all') {
      resultados = resultados.filter((servicio) => servicio.category === filtroCategoria)
    }

    return resultados
  }, [servicios, filtroBusqueda, filtroCategoria])

  // --- Datos para las secciones (usamos la lista sin filtrar para las ofertas destacadas) ---
  const servicioDestacado = servicios.find((s) => s.price > 100000) || servicios[0]
  const ofertasImperdibles = servicios.slice(1, 5)

  const mostrandoOfertas = filtroBusqueda === '' && filtroCategoria === 'all'
  const listaPrincipal = mostrandoOfertas ? serviciosFiltrados.slice(5) : serviciosFiltrados

  const hayFiltroActivo = filtroBusqueda !== '' || filtroCategoria !== 'all'

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* 🔍 BARRA DE FILTROS: Buscador y Categoría */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-4xl mx-auto mb-10">
          {/* Buscador */}
          <div className="relative flex-1 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar productos, ofertas o freelancers..."
              className="w-full bg-gray-800 text-white placeholder-gray-400 py-3 pl-12 pr-4 rounded-full border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
          </div>

          {/* Selector de Categoría */}
          <div className="relative w-full md:w-auto md:max-w-[250px]">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full bg-gray-800 text-white py-3 pl-10 pr-4 rounded-full border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400 pointer-events-none" />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader className="animate-spin h-12 w-12 border-2 border-purple-400 border-t-purple-600 mx-auto text-purple-500" />
            <p className="mt-4 text-gray-400">Cargando la tienda...</p>
          </div>
        ) : (
          <>
            {/* 1. BANNER PRINCIPAL (Solo si no hay filtro activo) */}
            {!hayFiltroActivo && servicioDestacado && <BannerDestacado servicio={servicioDestacado} />}

            {/* 2. SECCIÓN: OFERTAS IMPERDIBLES (Solo si no hay filtro activo) */}
            {!hayFiltroActivo && ofertasImperdibles.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-purple-600 pl-3">
                  <Percent className="inline h-6 w-6 text-purple-400 mr-2" />
                  Ofertas Imperdibles
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {ofertasImperdibles.map((servicio) => (
                    <CardServicio key={servicio.id} servicio={servicio} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. SECCIÓN: LISTADO PRINCIPAL / RESULTADOS DE BÚSQUEDA */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-purple-600 pl-3">
                <Gift className="inline h-6 w-6 text-purple-400 mr-2" />
                {hayFiltroActivo
                  ? `Resultados Filtrados (${listaPrincipal.length})`
                  : 'Todos los Servicios'}
              </h2>

              {listaPrincipal.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/50">
                  <p className="text-xl font-bold text-white mb-2">
                    No se encontraron resultados que coincidan con los filtros.
                  </p>
                  <p className="text-gray-400">
                    Intenta ajustar la búsqueda o seleccionar otra categoría.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {listaPrincipal.map((servicio) => (
                    <CardServicio key={servicio.id} servicio={servicio} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// --- Componente de Tarjeta de Producto (Reutilizable) ---
const CardServicio = ({ servicio }: { servicio: any }) => {
  const precioOferta = servicio.price
  const descuento = 0.2 // 20%
  const precioOriginal = servicio.price * (1 + descuento)

  const mostrarDescuento = servicio.price > 0 && servicio.price !== null

  const firstImageUrl = getFirstImageUrl(servicio.image_url)

  return (
    <div className="group bg-gray-800/70 border border-gray-700 rounded-xl shadow-md shadow-gray-950 hover:shadow-purple-500/30 hover:border-purple-600 transition overflow-hidden flex flex-col">
      {/* Imagen / Placeholder */}
      <div className="h-32 bg-gray-900 flex items-center justify-center relative overflow-hidden">
        {firstImageUrl ? (
          <>
            <img
              src={firstImageUrl}
              alt={`Imagen de ${servicio.title}`}
              className="h-full w-full object-cover transform group-hover:scale-105 transition duration-300"
            />
            {mostrarDescuento && (
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                -20%
              </div>
            )}
          </>
        ) : (
          <>
            <span className="text-4xl drop-shadow-lg text-purple-400">⚙️</span>
            {mostrarDescuento && (
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                -20%
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition line-clamp-2">
          {servicio.title}
        </h3>

        <p className="text-xs text-gray-400 mb-3 line-clamp-2 flex-1">{servicio.description}</p>

        <div className="flex items-center gap-2 mb-3 pt-2 border-t border-gray-700/50">
          <span className="text-sm text-gray-300 font-medium truncate">
            Vendedor: {servicio.profiles?.full_name || 'Anónimo'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50 mt-auto">
          <div className="flex flex-col items-start">
            {mostrarDescuento && (
              <span className="text-xs text-gray-500 line-through">
                {formatCurrency(precioOriginal)}
              </span>
            )}
            <span className="text-xl font-extrabold text-purple-400 tracking-tighter">
              {formatCurrency(precioOferta)}
            </span>
          </div>

          <Link
            href={`/proyecto/${servicio.id}`}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition"
          >
            Ver
          </Link>
        </div>
      </div>
    </div>
  )
}
