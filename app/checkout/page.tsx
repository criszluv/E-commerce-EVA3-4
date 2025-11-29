'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, ArrowLeft, Mail, CreditCard, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

// Helper para formato de moneda
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
}

export default function CheckoutPage() {
    const [cartItems, setCartItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [processingPayment, setProcessingPayment] = useState(false)
    const [successMode, setSuccessMode] = useState(false)
    const router = useRouter()

    // Cargar items del LocalStorage (Modo Invitado)
    useEffect(() => {
        async function loadCart() {
            setLoading(true)
            const guestCartIds = JSON.parse(localStorage.getItem('guest_cart') || '[]')
            
            if (guestCartIds.length > 0) {
                const { data } = await supabase
                    .from('projects')
                    .select('*')
                    .in('id', guestCartIds)
                
                if (data) setCartItems(data)
            }
            setLoading(false)
        }
        loadCart()
    }, [])

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0)

    const handleRemoveItem = (id: string) => {
        const updatedItems = cartItems.filter(item => item.id !== id)
        setCartItems(updatedItems)
        const updatedIds = updatedItems.map(item => item.id)
        localStorage.setItem('guest_cart', JSON.stringify(updatedIds))
    }

    // --- Simulación ---
    const handleSimulateSuccess = async () => {
        if (!email.includes('@')) {
            alert("⚠️ Por favor ingresa un correo válido.")
            return
        }
        setProcessingPayment(true)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simular guardado en BD (opcional)
        console.log(`📧 Enviando correo a ${email}`)
        
        localStorage.removeItem('guest_cart')
        localStorage.removeItem('pedido_temp')
        setCartItems([])
        setProcessingPayment(false)
        setSuccessMode(true)
    }

    // --- PAGO REAL WEBPAY (ACTUALIZADO) ---
    const handleWebpayPayment = async () => {
        if (!email.includes('@')) {
            alert("⚠️ Por favor ingresa un correo válido.")
            return
        }
        
        setProcessingPayment(true)

        // 1. Guardar en localStorage por si acaso (backup visual)
        const datosPedido = {
            email: email,
            items: cartItems,
            total: totalAmount,
            fecha: new Date().toISOString()
        }
        localStorage.setItem('pedido_temp', JSON.stringify(datosPedido));

        try {
            const buyOrder = "OC-" + Math.floor(Math.random() * 1000000);
            const sessionId = "S-" + Math.floor(Math.random() * 1000000);

            // 2. Llamar al backend ENVIANDO EMAIL E ITEMS
            const res = await fetch('/api/webpay/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalAmount,
                    buyOrder,
                    sessionId,
                    email,          // <--- NUEVO
                    items: cartItems // <--- NUEVO
                })
            });

            const data = await res.json();

            if (data.token && data.url) {
                // Redirigir a Webpay
                const form = document.createElement('form');
                form.action = data.url;
                form.method = 'POST';
                
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = 'token_ws';
                tokenInput.value = data.token;
                
                form.appendChild(tokenInput);
                document.body.appendChild(form);
                form.submit();
            } else {
                alert("Error al iniciar Webpay: " + (data.error || 'Desconocido'));
                setProcessingPayment(false);
            }

        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servicio de pago");
            setProcessingPayment(false);
        }
    }

    if (successMode) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full text-center border border-green-500/30 shadow-2xl shadow-green-900/20">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">¡Compra Exitosa!</h2>
                    <p className="text-gray-400 mb-6">
                        Hemos enviado el detalle de tu compra a: <br/>
                        <span className="text-purple-400 font-bold">{email}</span>
                    </p>
                    <Link href="/" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition inline-block">
                        Volver a la tienda
                    </Link>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <Loader2 className="animate-spin h-8 w-8 text-purple-500 mr-2"/> Cargando Checkout...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 font-sans text-white p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white mb-8 inline-flex items-center gap-2 transition">
                    <ArrowLeft className="w-4 h-4" /> Seguir comprando
                </Link>

                <h1 className="text-3xl md:text-4xl font-extrabold mb-8 flex items-center gap-3">
                    <span className="bg-purple-600 w-2 h-10 rounded-full inline-block"></span>
                    Resumen de Compra (Invitado)
                </h1>

                {cartItems.length === 0 ? (
                    <div className="text-center py-20 bg-gray-800 rounded-2xl border border-gray-700 border-dashed">
                        <p className="text-xl text-gray-400 mb-4">Tu carrito está vacío</p>
                        <Link href="/" className="text-purple-400 hover:underline">Ir a buscar servicios</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LISTA DE ITEMS */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="bg-gray-800 p-4 rounded-xl flex gap-4 items-center border border-gray-700/50">
                                    <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.image_url ? (
                                            <img src={Array.isArray(item.image_url) ? item.image_url[0] : JSON.parse(item.image_url || '[]')[0] || item.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Sin img</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
                                        <p className="text-purple-400 font-mono mt-1">{formatCurrency(item.price)}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500 transition"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* PANEL DE PAGO */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-800 p-6 rounded-2xl border border-purple-500/20 shadow-xl sticky top-4">
                                <h2 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2">Datos de Pago</h2>
                                
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Correo Electrónico (Requerido)</label>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@correo.com"
                                            className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 outline-none transition"
                                        />
                                        <p className="text-xs text-gray-500 mt-2 ml-1">A este correo enviaremos el comprobante.</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-6 text-xl font-bold">
                                    <span>Total a Pagar:</span>
                                    <span className="text-purple-400">{formatCurrency(totalAmount)}</span>
                                </div>

                                <div className="space-y-3">
                                    <button 
                                        onClick={handleWebpayPayment}
                                        disabled={processingPayment || cartItems.length === 0}
                                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {processingPayment ? <Loader2 className="animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                        Pagar con Webpay
                                    </button>
                                    
                                    <button 
                                        onClick={handleSimulateSuccess}
                                        disabled={processingPayment || cartItems.length === 0}
                                        className="w-full bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/50 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Simular Pago Exitoso
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}