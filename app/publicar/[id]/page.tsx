'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase' 
import { useRouter, useParams } from 'next/navigation'
import { Folder, DollarSign, User, Zap, Image as ImageIcon, ArrowLeft, Trash2, Eye, EyeOff } from 'lucide-react' 
import Link from 'next/link'

const MAX_IMAGES = 3; 

// Lista de Categorías sugeridas (sin cambios)
const CATEGORIAS = [
    { value: 'web-mobile', label: 'Desarrollo Web y Móvil' },
    { value: 'design-creative', label: 'Diseño y Creatividad' },
    { value: 'digital-marketing', label: 'Marketing Digital' },
    { value: 'writing-translation', label: 'Redacción y Traducción' },
    { value: 'support-tutoring', label: 'Soporte y Tutorías' },
    { value: 'data-ai', label: 'Data Science y AI' },
    { value: 'consulting', label: 'Consultoría Empresarial' },
    { value: 'other', label: 'Otros' },
];


export default function EditarProyecto() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isChangingStatus, setIsChangingStatus] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    
    // Estados del formulario
    const [titulo, setTitulo] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [precio, setPrecio] = useState('') 
    const [habilidades, setHabilidades] = useState('')
    const [categoria, setCategoria] = useState(CATEGORIAS[0].value) 
    
    // Estado de visibilidad
    const [status, setStatus] = useState<'open' | 'banned' | string>('open')

    // ✅ ESTADOS PARA MULTI-IMAGEN
    const [currentImageFiles, setCurrentImageFiles] = useState<File[]>([]) // Archivos nuevos a subir
    const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]) // URLs existentes
    const [previewUrls, setPreviewUrls] = useState<string[]>([]) // URLs temporales para previsualizar nuevos archivos
    const [keepOriginalFlags, setKeepOriginalFlags] = useState<boolean[]>([]) // Flags para mantener/borrar URLs originales


    // 1. Carga Inicial de Datos y Verificación de Usuario
    useEffect(() => {
        async function loadProjectAndCheckUser() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) { router.push('/login'); return }
            
            const { data: project, error: fetchError } = await supabase
                .from('projects')
                .select(`*`)
                .eq('id', projectId)
                .single()

            if (fetchError || !project || project.client_id !== user.id) {
                alert("⛔ Error de acceso o servicio no encontrado.");
                router.push('/');
                return;
            }
            
            // Llenar estados del formulario
            setTitulo(project.title || '')
            setDescripcion(project.description || '')
            setPrecio(String(project.price || '')) 
            setCategoria(project.category || CATEGORIAS[0].value)
            setStatus(project.status || 'open') // Cargar estado actual
            setHabilidades(Array.isArray(project.required_skills) ? project.required_skills.join(', ') : '');
            
            // ✅ CARGA DE MÚLTIPLES IMÁGENES
            const loadedUrls = Array.isArray(project.image_url) 
                ? project.image_url.filter((url: string) => url) 
                : (project.image_url ? [project.image_url] : []);
            
            setInitialImageUrls(loadedUrls);
            setKeepOriginalFlags(loadedUrls.map(() => true)); // Inicialmente, mantenemos todas
            
            setLoading(false)
        }
        
        if (projectId) {
            loadProjectAndCheckUser()
        }
    }, [projectId])

    // ✅ MANEJO DE IMAGEN: Selección de múltiples archivos
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        const currentKept = initialImageUrls.filter((_, i) => keepOriginalFlags[i]).length;
        const currentNew = currentImageFiles.length;
        const currentTotal = currentKept + currentNew;
        const availableSpace = MAX_IMAGES - currentTotal;
        
        if (files.length > availableSpace) {
            alert(`Solo puedes subir ${MAX_IMAGES} imágenes en total. Ya tienes ${currentTotal} activas.`);
            return;
        }

        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        
        setCurrentImageFiles(prev => [...prev, ...files]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        if (e.target.files) e.target.value = ''; 
    };
    
    // ✅ MANEJO DE IMAGEN: Marcar URL existente para borrar
    const handleToggleKeepOriginal = (index: number) => {
        setKeepOriginalFlags(prev => {
            const newFlags = [...prev];
            newFlags[index] = !newFlags[index];
            return newFlags;
        });
    };

    // ✅ MANEJO DE IMAGEN: Cancelar la subida de un archivo nuevo
    const handleRemoveNewFile = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]); // Limpiar URL temporal
        setCurrentImageFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    // 💡 HANDLER: Alternar visibilidad (Utilizando 'banned' como estado de baja)
    const handleToggleVisibility = async () => {
        setErrorMsg('')
        setIsChangingStatus(true)

        const { data: { user }, } = await supabase.auth.getUser()
        if (!user) { setIsChangingStatus(false); router.push('/login'); return }

        // Si está 'open', lo cambiamos a 'banned'. Si no está 'open' (ej: 'banned'), lo cambiamos a 'open'.
        const nuevoEstado = status === 'open' ? 'banned' : 'open'

        const { error } = await supabase
            .from('projects')
            .update({ status: nuevoEstado })
            .eq('id', projectId)
            .eq('client_id', user.id) 

        if (error) {
            setErrorMsg('Error al cambiar el estado: ' + error.message)
        } else {
            setStatus(nuevoEstado)
            alert(
                nuevoEstado === 'banned'
                    ? 'Tu servicio ha sido dado de baja (oculto de la tienda).'
                    : 'Tu servicio ha sido reactivado y vuelve a estar visible.'
            )
            router.refresh()
        }

        setIsChangingStatus(false)
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMsg('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setIsSubmitting(false); return }

        // URLs que se mantienen de la BD
        const imagesToKeep = initialImageUrls.filter((_, i) => keepOriginalFlags[i]);
        let uploadedUrls: string[] = [];

        // --- 1. Subir Nuevos Archivos ---
        if (currentImageFiles.length > 0) {
            try {
                for (const file of currentImageFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}/${projectId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('service_images')
                        .upload(fileName, file);

                    if (uploadError) throw new Error('Error al subir una imagen: ' + uploadError.message);

                    const { data: urlData } = supabase.storage
                        .from('service_images')
                        .getPublicUrl(fileName);
                    
                    uploadedUrls.push(urlData.publicUrl);
                }
            } catch (error: any) {
                setErrorMsg(error.message);
                setIsSubmitting(false);
                return;
            }
        }
        
        // --- 2. Combinar URLs y Actualizar TODOS los campos ---
        const finalImageUrls = [...imagesToKeep, ...uploadedUrls];
        const arraySkills = habilidades.split(',').map(s => s.trim()).filter(s => s.length > 0)
        
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                // ✅ TODOS LOS CAMPOS DE TEXTO/PRECIO/CATEGORÍA
                title: titulo,
                description: descripcion,
                price: Number(precio), 
                required_skills: arraySkills,
                category: categoria,
                
                // ✅ CAMPO MULTI-IMAGEN
                image_url: finalImageUrls.length > 0 ? finalImageUrls : null, 
            })
            .eq('id', projectId)
            .eq('client_id', user.id)

        if (updateError) {
            setErrorMsg('Error al actualizar: ' + updateError.message)
        } else {
            alert('✅ ¡Servicio actualizado con éxito!')
            previewUrls.forEach(url => URL.revokeObjectURL(url)); 
            router.push(`/proyecto/${projectId}`)
            router.refresh()
        }
        setIsSubmitting(false)
    }
    
    // URLs combinadas para la previsualización del formulario (usado en el JSX)
    const totalImageUrls = initialImageUrls.map((url, i) => ({
        url: url,
        isNew: false,
        keep: keepOriginalFlags[i]
    })).concat(currentImageFiles.map((_, i) => ({
        url: previewUrls[i],
        isNew: true,
        keep: true
    })));
    
    const activeImageCount = totalImageUrls.filter(item => item.keep).length;
    const isMaxImagesReached = activeImageCount >= MAX_IMAGES;
    const estaOculto = status === 'banned';

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Cargando datos del servicio...</p></div>
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
            <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl border border-gray-100 p-8 md:p-10">
                
                <Link href={`/proyecto/${projectId}`} className="text-purple-600 hover:text-purple-800 hover:underline mb-6 inline-flex items-center gap-1 font-medium">
                    <ArrowLeft className='h-4 w-4' /> Volver al Detalle
                </Link>

                <div className="flex items-center mb-4 mt-4 justify-between gap-4">
                    <div className="flex items-center">
                        <Zap className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">Editar Servicio</h1>
                            <p className="text-xs text-gray-500">
                                Estás editando la publicación ID: <strong>{projectId}</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estado actual y botón de baja/activar */}
                <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Estado de publicación
                        </p>
                        <span
                            className={`inline-flex mt-1 items-center rounded-full px-3 py-1 text-xs font-bold ${
                                estaOculto
                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                    : 'bg-green-100 text-green-700 border border-green-300'
                            }`}
                        >
                            {estaOculto ? 'Oculta (Baja)' : 'Publicada (Activa)'}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleToggleVisibility}
                        disabled={isChangingStatus || isSubmitting}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold border transition ${
                            estaOculto
                                ? 'bg-green-600 text-white border-green-500 hover:bg-green-500'
                                : 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-600 hover:text-white'
                        } disabled:opacity-60`}
                    >
                        {isChangingStatus ? (
                            'Cambiando...'
                        ) : estaOculto ? (
                            <>
                            <Eye className="h-4 w-4" /> Reactivar publicación
                            </>
                        ) : (
                            <>
                            <EyeOff className="h-4 w-4" /> Dar de baja publicación
                            </>
                        )}
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{errorMsg}</span>
                    </div>
                )}

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
                            onChange={e => setCategoria(e.target.value)}
                        >
                            {CATEGORIAS.map(cat => (
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
                            onChange={e => setTitulo(e.target.value)}
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
                            onChange={e => setDescripcion(e.target.value)}
                        />
                    </div>
                    
                    {/* 📸 CAMPO DE IMAGEN MÚLTIPLE */}
                    <div>
                        <label className="block text-xs font-bold tracking-wide text-purple-700 uppercase mb-2 flex justify-between">
                            <span><ImageIcon className="inline h-4 w-4 mr-1 mb-1" /> Imágenes del Servicio (Máx. {MAX_IMAGES})</span>
                            <span className={`text-sm font-semibold ${isMaxImagesReached ? 'text-red-600' : 'text-purple-500'}`}>
                                {activeImageCount} / {MAX_IMAGES}
                            </span>
                        </label>
                        <input 
                            type="file" 
                            accept="image/*"
                            multiple 
                            onChange={handleImageChange}
                            disabled={isMaxImagesReached || isSubmitting}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition disabled:opacity-50"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {isMaxImagesReached ? 'Límite de imágenes alcanzado.' : 'Sube archivos para agregar al carrusel.'}
                        </p>
                        
                        {/* LISTA DE IMÁGENES ACTUALES/NUEVAS */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {totalImageUrls.map((item, index) => {
                                const isOriginal = index < initialImageUrls.length;
                                const originalIndex = isOriginal ? index : -1;
                                const newFileIndex = isOriginal ? -1 : index - initialImageUrls.length;

                                // Si es original y está marcado para borrar, lo mostramos grisado
                                if (isOriginal && !item.keep) return (
                                    <div key={index} className="p-2 border rounded-lg flex gap-3 items-center bg-gray-200/50 border-gray-300 opacity-60">
                                        <div className="h-12 w-12 flex items-center justify-center bg-white rounded"><Trash2 className='h-6 w-6 text-red-500'/></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-500 truncate">Eliminada al guardar</p>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleKeepOriginal(originalIndex)}
                                                className="text-xs font-bold text-gray-600 hover:text-gray-800 flex items-center gap-1 transition-colors underline"
                                            >
                                                Deshacer
                                            </button>
                                        </div>
                                    </div>
                                );

                                // Mostrar imágenes activas (Originales y Nuevas)
                                return (
                                    <div key={index} className={`p-2 border rounded-lg flex gap-3 items-center ${isOriginal ? 'bg-purple-50 border-purple-100' : 'bg-green-50 border-green-100'}`}>
                                        <img 
                                            src={item.url} 
                                            alt={`Preview ${index}`} 
                                            className="h-12 w-12 object-cover rounded" 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{isOriginal ? 'Imagen actual' : 'Nueva'}</p>
                                            
                                            {/* Botón para eliminar (Marcar para borrar si es original, cancelar si es nueva) */}
                                            <button
                                                type="button"
                                                onClick={() => isOriginal ? handleToggleKeepOriginal(originalIndex) : handleRemoveNewFile(newFileIndex)}
                                                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                                            >
                                                <Trash2 className='h-3 w-3'/> {isOriginal ? 'Eliminar URL' : 'Cancelar subida'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                                onChange={e => setPrecio(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end pb-1">
                            <p className="text-sm text-gray-500">
                                Este será el precio final del servicio.
                            </p>
                        </div>
                    </div>

                    {/* Habilidades */}
                    <div>
                        <label className="block text-xs font-bold tracking-wide text-purple-700 uppercase mb-2">
                            <User className="inline h-4 w-4 mr-1 mb-1" /> Habilidades/Etiquetas Clave (separadas por coma)
                        </label>
                        <input 
                            type="text" 
                            className="w-full border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 outline-none p-3 rounded-lg text-gray-900 bg-white"
                            placeholder="Diseño UX/UI, 5 años exp., Figma, Prototipado"
                            value={habilidades}
                            onChange={e => setHabilidades(e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Separa las etiquetas con comas (ej: Node.js, Inglés, SEO).
                        </p>
                    </div>

                    {/* Botón de Envío */}
                    <button 
                        type="submit" 
                        disabled={isSubmitting || isChangingStatus}
                        className="w-full bg-gradient-to-r from-purple-700 to-purple-500 text-white font-bold py-3 rounded-xl hover:from-purple-800 hover:to-purple-600 transition transform hover:scale-[1.01] disabled:opacity-60 shadow-lg shadow-purple-200/50"
                    >
                        {isSubmitting ? 'Guardando Cambios...' : 'Guardar y Actualizar Servicio'}
                    </button>
                </form>
            </div>
        </div>
    )
}