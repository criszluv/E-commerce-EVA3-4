'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase' 
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Tag, Users, Folder, Image as ImageIcon, ShoppingCart, DollarSign, Zap, ArrowLeft, ChevronLeft, ChevronRight, Edit, EyeOff } from 'lucide-react' 

// Función para formatear el precio como moneda (sin cambios)
const formatCurrency = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.]/g, '')) : amount;
    return new Intl.NumberFormat('es-CL', { 
        style: 'currency', 
        currency: 'CLP', 
        minimumFractionDigits: 0 
    }).format(num);
}

const CATEGORY_MAP: { [key: string]: string } = {
    'web-mobile': 'Desarrollo Web y Móvil',
    'design-creative': 'Diseño y Creatividad',
    'digital-marketing': 'Marketing Digital',
    'writing-translation': 'Redacción y Traducción',
    'support-tutoring': 'Soporte y Tutorías',
    'data-ai': 'Data Science y AI',
    'consulting': 'Consultoría Empresarial',
    'other': 'Otros',
};

// --- Componente MediaContent (Carrusel) sin cambios ---
const MediaContent = ({ servicio, esMio }: { servicio: any, esMio: boolean }) => {
    const rawImages = servicio.image_url;
    const images = Array.isArray(rawImages) 
        ? rawImages.filter((url:string) => url)
        : (rawImages && typeof rawImages === 'string' ? [rawImages] : []);
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    if (images.length > 0) {
        return (
            <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 group">
                <img 
                    src={images[currentImageIndex]} 
                    alt={`Imagen ${currentImageIndex + 1} de ${servicio.title}`} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                />
                
                {images.length > 1 && (
                    <>
                        <button 
                            onClick={prevImage} 
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Imagen anterior"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button 
                            onClick={nextImage} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Siguiente imagen"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {images.map((_:string, index:number) => (
                                <span 
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400 opacity-60'}`}
                                ></span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }
    // Placeholder si no hay imágenes
    return (
        <div className="w-full h-80 md:h-96 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 shadow-inner border border-purple-900/50">
            <div className="text-center p-4">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-purple-600/50" />
                <p className="font-medium text-gray-400 text-sm">Sin imágenes de portada</p>
                {esMio && <p className="text-xs text-purple-700">(Sube imágenes para tu portada)</p>}
            </div>
        </div>
    );
};

export default function DetalleServicio() {
    const params = useParams()
    const router = useRouter()
    const [servicio, setServicio] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [rol, setRol] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [estadoCompra, setEstadoCompra] = useState<'ninguno' | 'en_carrito' | 'comprado'>('ninguno')

    const ESTADO_ACTIVO = 'open';
    // ✅ VALOR CORREGIDO: Usamos 'banned' según tu base de datos
    const ESTADO_BAJA = 'banned'; 

    useEffect(() => {
        async function cargar() {
            setLoading(true);
            const { data } = await supabase.from('projects').select(`*, profiles(full_name)`).eq('id', params.id).single()
            setServicio(data)
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user && data) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                setRol(profile?.role || 'client')
                const { data: ordenes } = await supabase.from('proposals')
                    .select('status')
                    .eq('project_id', data.id)
                    .eq('freelancer_id', user.id)
                if (ordenes && ordenes.length > 0) {
                    const estaPagado = ordenes.some(o => o.status === 'accepted' || o.status === 'completed')
                    const estaEnCarrito = ordenes.some(o => o.status === 'pending')
                    if (estaPagado) setEstadoCompra('comprado')
                    else if (estaEnCarrito) setEstadoCompra('en_carrito')
                }
            }
            setLoading(false);
        }
        if(params.id) cargar()
    }, [params])

    const handleComprar = async () => { 
        if (!user) return router.push('/login')
        if (estadoCompra !== 'ninguno') { router.push('/dashboard'); return }
        setLoading(true)
        const { error } = await supabase.from('proposals').insert({
            project_id: servicio.id, freelancer_id: user.id, price_quoted: servicio.price, cover_letter: 'Compra directa desde web', status: 'pending' 
        })
        if (error) { alert('Error: ' + error.message) } 
        else { alert('✅ ¡Agregado al carrito!') ; router.push('/dashboard') }
        setLoading(false);
    }

    const handleEliminarDelCarrito = async () => { 
        if(!confirm("¿Quitar del carrito?")) return;
        setLoading(true);
        const { error } = await supabase.from('proposals')
            .delete().eq('project_id', servicio.id).eq('freelancer_id', user.id).eq('status', 'pending')
        if (error) alert("Error: " + error.message)
        else { setEstadoCompra('ninguno'); alert("🗑️ Eliminado del carrito") }
        setLoading(false);
    }
    
    // ✅ HANDLER CORREGIDO: Alterna entre 'open' y 'banned'
    const handleDeshabilitar = async () => {
        // Si está ACTIVO, el nuevo estado es BAJA. Si está BAJA, el nuevo estado es ACTIVO.
        const nuevoStatus = servicio.status === ESTADO_ACTIVO ? ESTADO_BAJA : ESTADO_ACTIVO;
        const confirmMsg = nuevoStatus === ESTADO_BAJA
            ? "¿Seguro que deseas dar de baja este servicio? No será visible públicamente."
            : "¿Seguro que deseas reactivar este servicio? Volverá a ser visible en la tienda.";

        if (!confirm(confirmMsg)) return;
        setLoading(true);

        const { error } = await supabase
            .from('projects')
            .update({ status: nuevoStatus })
            .eq('id', servicio.id)
            .eq('client_id', user.id); 

        if (error) {
            alert(`Error al cambiar el estado: ${error.message}`);
        } else {
            setServicio({ ...servicio, status: nuevoStatus }); 
            alert(`✅ Servicio ${nuevoStatus === ESTADO_ACTIVO ? 'reactivado' : 'dado de baja'} con éxito.`);
            router.refresh();
        }
        setLoading(false);
    };

    if (!servicio || loading) return <div className="p-12 text-center text-gray-400 bg-gray-900 min-h-screen">Cargando detalle...</div>

    const esMio = user && user.id === servicio.client_id;
    const esVendedor = rol === 'freelancer';
    // Usamos ESTADO_ACTIVO y ESTADO_BAJA para la visualización
    const estaActivo = servicio.status === ESTADO_ACTIVO;

    return (
        <div className="min-h-screen bg-gray-900 font-sans text-white py-10">
            <div className="container mx-auto px-4 max-w-6xl">
                <Link href={esVendedor ? "/dashboard" : "/"} className="text-purple-400 hover:text-purple-200 hover:underline mb-6 inline-flex items-center gap-1 font-medium">
                    <ArrowLeft className='h-4 w-4' /> Volver a la Tienda
                </Link>

                <div className="bg-gray-800 rounded-xl shadow-2xl shadow-purple-950/50 p-6 md:p-10 border border-purple-900/50">
                    
                    {/* ENCABEZADO: Título y Categoría */}
                    <header className="mb-8 border-b border-purple-800/50 pb-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                            {servicio.title}
                        </h1>
                        <p className="text-xl text-purple-400 font-semibold uppercase flex items-center gap-2">
                            {CATEGORY_MAP[servicio.category] || servicio.category}
                            {esMio && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estaActivo ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {estaActivo ? 'ACTIVO' : 'DADO DE BAJA'}
                                </span>
                            )}
                        </p>
                    </header>

                    {/* ESTRUCTURA PRINCIPAL: IMAGEN/CARRUSEL + INFO + ACCIÓN */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        {/* COLUMNA IZQUIERDA: IMAGEN/CARRUSEL (6/12) */}
                        <div className="lg:col-span-6 space-y-8">
                            <div className="relative">
                                <MediaContent servicio={servicio} esMio={esMio} />
                            </div>

                            {/* VENDEDOR */}
                            <div className="p-4 bg-gray-900 rounded-lg border border-purple-800/50 flex items-center gap-3">
                                <Users className="h-7 w-7 text-purple-400" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Vendido por</p>
                                    <p className="font-bold text-white">{servicio.profiles?.full_name || 'Anónimo'}</p>
                                </div>
                            </div>
                            
                            {/* ETIQUETAS CLAVE */}
                            {servicio.required_skills && servicio.required_skills.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-sm text-purple-500 uppercase mb-3 tracking-wider flex items-center">
                                        <Tag className="h-4 w-4 mr-1"/> Etiquetas Clave
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {servicio.required_skills?.map((sk:string) => (
                                            <span key={sk} className="bg-purple-800/50 text-purple-200 text-sm px-3 py-1.5 rounded-full font-medium border border-purple-700/50 shadow-inner">
                                                {sk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* COLUMNA DERECHA: DESCRIPCIÓN DETALLADA + CAJA DE ACCIÓN (6/12) */}
                        <div className="lg:col-span-6 flex flex-col gap-10">
                            
                            {/* DESCRIPCIÓN LARGA */}
                            <section className="p-6 bg-gray-900 rounded-xl border border-purple-800/50">
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-purple-400" /> Descripción Detallada
                                </h3>
                                <div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                                    {servicio.description}
                                </div>
                            </section>
                            
                            {/* CAJA DE ACCIÓN (Sticky) */}
                            <div className="p-6 rounded-xl bg-gray-900 border border-purple-800/50 shadow-xl lg:sticky lg:top-10">
                                
                                {/* PRECIO */}
                                <div className="mb-6 text-center">
                                    <p className="text-gray-500 font-medium uppercase text-sm tracking-widest mb-1">Precio Único</p>
                                    <p className="text-5xl font-extrabold text-purple-400 tracking-tight">
                                        {formatCurrency(servicio.price)} 
                                    </p>
                                </div>

                                {/* BOTONES DE ACCIÓN */}
                                <div className="relative z-10 space-y-3">
                                    {esMio ? (
                                        /* CASO 1: DUEÑO (Edición/Control) */
                                        <div className="w-full space-y-3">
                                            <div className="w-full bg-purple-900/50 text-purple-300 py-2 px-4 rounded-lg font-bold text-center border border-purple-700/50">
                                                👑 Este es tu servicio
                                            </div>
                                            
                                            <Link 
                                                href={`/publicar/${servicio.id}`} 
                                                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                                            >
                                                <Edit className='h-5 w-5' /> Editar Publicación
                                            </Link>

                                            <button
                                                onClick={handleDeshabilitar}
                                                disabled={loading}
                                                className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${estaActivo ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                            >
                                                <EyeOff className='h-5 w-5' /> {estaActivo ? 'Dar de baja servicio' : 'Reactivar Servicio'}
                                            </button>
                                        </div>
                                    ) : (
                                        /* CASO 2: COMPRADOR (Cliente) */
                                        <>
                                            {estadoCompra === 'ninguno' && (
                                                <button 
                                                    onClick={handleComprar}
                                                    disabled={loading || !estaActivo}
                                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-purple-900/50 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {loading ? 'Procesando...' : <><ShoppingCart className='h-5 w-5' /> Añadir al Carrito</>}
                                                </button>
                                            )}
                                            {estadoCompra === 'en_carrito' && (
                                                <div className="flex flex-col gap-2">
                                                    <button 
                                                        onClick={() => router.push('/dashboard')}
                                                        className="w-full bg-yellow-400 text-yellow-900 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500 hover:shadow-lg transition-all shadow-yellow-800/50 flex items-center justify-center gap-2"
                                                    >
                                                        ⚠️ Ver Carrito
                                                        <span className="text-xs font-medium opacity-80">(Pagar ahora)</span>
                                                    </button>
                                                    <button 
                                                        onClick={handleEliminarDelCarrito}
                                                        disabled={loading}
                                                        className="text-sm text-red-400 hover:text-red-600 font-medium text-center py-2 transition-colors"
                                                    >
                                                        Quitar del carrito
                                                    </button>
                                                </div>
                                            )}
                                            {estadoCompra === 'comprado' && (
                                                <div className="w-full bg-green-900/50 text-green-400 py-4 rounded-lg font-bold text-center border border-green-700/50">
                                                    ✅ Servicio Comprado
                                                    <Link href="/dashboard" className="block text-sm text-green-500 underline mt-1 hover:text-green-300">
                                                        Ver en mis pedidos
                                                    </Link>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                
                                {/* GARANTÍA */}
                                <div className="mt-8 flex justify-center items-center gap-2 text-gray-500 text-xs">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Transacción y pago asegurados.</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}