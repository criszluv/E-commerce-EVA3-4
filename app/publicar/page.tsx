'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Folder, DollarSign, User, Zap, Image as ImageIcon, Trash2 } from 'lucide-react'

const MAX_IMAGES = 3

// Lista de Categorías sugeridas
const CATEGORIAS = [
  { value: 'web-mobile', label: 'Desarrollo Web y Móvil' },
  { value: 'design-creative', label: 'Diseño y Creatividad' },
  { value: 'digital-marketing', label: 'Marketing Digital' },
  { value: 'writing-translation', label: 'Redacción y Traducción' },
  { value: 'support-tutoring', label: 'Soporte y Tutorías' },
  { value: 'data-ai', label: 'Data Science y AI' },
  { value: 'consulting', label: 'Consultoría Empresarial' },
  { value: 'other', label: 'Otros' },
]

export default function PublicarProyecto() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Estados del formulario
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [habilidades, setHabilidades] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0].value)

  // 📸 Estados para multi-imagen
  const [imageFiles, setImageFiles] = useState<File[]>([])      // archivos seleccionados
  const [previewUrls, setPreviewUrls] = useState<string[]>([])  // blobs de previsualización

  // Verificación de usuario
  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert('Debes iniciar sesión para publicar')
        router.push('/login')
      }
    }
    checkUser()

    // cleanup de blobs si el componente se desmonta
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Manejar selección de imágenes (hasta MAX_IMAGES)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Cuántas ya tenemos seleccionadas
    const currentCount = imageFiles.length
    const available = MAX_IMAGES - currentCount

    if (available <= 0) {
      alert(`Solo puedes subir ${MAX_IMAGES} imágenes como máximo.`)
      return
    }

    // Si el usuario intenta meter más de lo disponible, recortamos
    const filesToAdd = files.slice(0, available)

    const newPreviewUrls = filesToAdd.map((file) => URL.createObjectURL(file))

    setImageFiles((prev) => [...prev, ...filesToAdd])
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls])

    // limpiar el input para permitir volver a elegir lo mismo si quiere
    e.target.value = ''
  }

  // Eliminar una imagen antes de publicar (solo del estado, no del bucket)
  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // 1) Subir todas las imágenes seleccionadas al bucket
    const uploadedUrls: string[] = []

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('service_images')
          .upload(fileName, file)

        if (uploadError) {
          alert('Error al subir una imagen: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data: urlData } = supabase.storage
          .from('service_images')
          .getPublicUrl(fileName)

        uploadedUrls.push(urlData.publicUrl)
      }
    }

    // 2) Procesar habilidades → text[]
    const arraySkills = habilidades
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    // 3) Insertar el proyecto en la tabla projects
    const { error: insertError } = await supabase.from('projects').insert({
      client_id: user.id,
      title: titulo,
      description: descripcion,
      price: Number(precio),
      required_skills: arraySkills,                     // text[]
      status: 'open',
      category: categoria,
      image_url: uploadedUrls.length > 0 ? uploadedUrls : null, // jsonb (array de URLs)
    })

    if (insertError) {
      alert('Error al publicar: ' + insertError.message)
    } else {
      alert('¡Servicio publicado con éxito!')
      // Limpiar estados
      setTitulo('')
      setDescripcion('')
      setPrecio('')
      setHabilidades('')
      setCategoria(CATEGORIAS[0].value)
      imageFiles.forEach((_, i) => URL.revokeObjectURL(previewUrls[i]))
      setImageFiles([])
      setPreviewUrls([])
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  const activeImageCount = imageFiles.length
  const isMaxImagesReached = activeImageCount >= MAX_IMAGES

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl border border-gray-100 p-8 md:p-10">
        <div className="flex items-center mb-6">
          <Zap className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-extrabold text-gray-900">Publicar Nuevo Servicio</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8 border-b pb-4">
          Describe tu servicio, establece un precio único y elige la categoría adecuada.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold tracking-wide text-purple-700 uppercase mb-2">
              <Folder className="inline h-4 w-4 mr-1 mb-1" /> Categoría de Servicio
            </label>
            <select
              required
              className="w-full border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white appearance-none"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-bold tracking-wide text-purple-700 uppercase mb-2">
              Título del Servicio
            </label>
            <input
              type="text"
              required
              className="w-full border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white"
              placeholder="Ej: Desarrollo de landing page en 24 horas"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold tracking-wide text-purple-700 uppercase mb-2">
              Descripción Detallada
            </label>
            <textarea
              required
              className="w-full border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 outline-none p-3 rounded-lg h-32 text-gray-900 bg-white resize-none"
              placeholder="Qué incluye el servicio, qué entregas, plazos, etc."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* 📸 Imágenes múltiples */}
          <div>
            <label className="block text-xs font-bold tracking-wide text-purple-700 uppercase mb-2 flex justify-between">
              <span>
                <ImageIcon className="inline h-4 w-4 mr-1 mb-1" /> Imágenes del Servicio (Máx.{' '}
                {MAX_IMAGES})
              </span>
              <span
                className={`text-sm font-semibold ${
                  isMaxImagesReached ? 'text-red-600' : 'text-purple-500'
                }`}
              >
                {activeImageCount} / {MAX_IMAGES}
              </span>
            </label>
            <input
              type="file"
              // si quieres solo jpg/png: accept="image/png, image/jpeg"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={isMaxImagesReached || loading}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              {isMaxImagesReached
                ? 'Límite de imágenes alcanzado.'
                : 'Puedes subir hasta 3 imágenes para tu servicio.'}
            </p>

            {/* Grid de previsualizaciones */}
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="p-2 border rounded-lg flex gap-3 items-center bg-green-50 border-green-100"
                  >
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className="h-12 w-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">Imagen nueva</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Cancelar subida
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Precio Único */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold tracking-wide text-purple-700 uppercase mb-2">
                <DollarSign className="inline h-4 w-4 mr-1 mb-1" /> Precio Único ($)
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white"
                placeholder="Ej: 150000"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
            <div className="flex items-end pb-1">
              <p className="text-sm text-gray-500">Este será el precio final del servicio.</p>
            </div>
          </div>

          {/* Habilidades */}
          <div>
            <label className="block text-xs font-bold tracking-wide text-purple-700 uppercase mb-2">
              <User className="inline h-4 w-4 mr-1 mb-1" /> Habilidades/Etiquetas Clave (separadas
              por coma)
            </label>
            <input
              type="text"
              className="w-full border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white"
              placeholder="Diseño UX/UI, 5 años exp., Figma, Prototipado"
              value={habilidades}
              onChange={(e) => setHabilidades(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Separa las etiquetas con comas (ej: Node.js, Inglés, SEO).
            </p>
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-700 to-purple-500 text-white font-bold py-3 rounded-xl hover:from-purple-800 hover:to-purple-600 transition transform hover:scale-[1.01] disabled:opacity-60 shadow-lg shadow-purple-200/50"
          >
            {loading ? 'Publicando...' : 'Publicar Servicio Ahora'}
          </button>
        </form>
      </div>
    </div>
  )
}
