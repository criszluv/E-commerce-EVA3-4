'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Home, Loader2, Download, AlertTriangle, CreditCard, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf' 

export default function WebpayRetornoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token_ws') || searchParams.get('TBK_TOKEN')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [mensaje, setMensaje] = useState('Procesando tu pago...')
  const [dataPedido, setDataPedido] = useState<any>(null)
  const [transbankData, setTransbankData] = useState<any>(null)
  const [emailStatus, setEmailStatus] = useState<'pending' | 'sent' | 'error'>('pending')
  const [tipoUsuario, setTipoUsuario] = useState<'guest' | 'registrado'>('guest')
  
  const processed = useRef(false)

  // --- 1. FUNCIÓN: Generar PDF (Visualmente Corregido) ---
  const generarPDF = () => {
    if (!transbankData) return alert("Faltan datos para el PDF.");

    try {
        const doc = new jsPDF();
        
        // Encabezado
        doc.setFillColor(67, 56, 202); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("FreelanceHub", 20, 25);
        doc.setFontSize(12);
        doc.text("Comprobante de Pago", 150, 25);

        // Info General (Texto Negro)
        doc.setTextColor(0, 0, 0); 
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 55);
        doc.text(`Estado: APROBADO`, 150, 55);

        // Caja Detalle
        doc.rect(20, 65, 170, 40);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Detalle de la Transacción", 25, 75);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Orden: ${transbankData.buy_order}`, 25, 85);
        doc.text(`Código Auth: ${transbankData.authorization_code}`, 100, 85);
        doc.text(`Tarjeta: **** **** **** ${transbankData.card_detail?.card_number || 'XXXX'}`, 25, 95);

        doc.setFontSize(16);
        doc.setTextColor(22, 163, 74); 
        doc.setFont("helvetica", "bold");
        doc.text(`Total: $${(transbankData.amount || 0).toLocaleString('es-CL')}`, 100, 95);

        // Items
        if (dataPedido && dataPedido.items) {
            doc.setTextColor(0, 0, 0); 
            doc.setFontSize(14);
            doc.text("Productos", 20, 120);
            
            let y = 135;
            dataPedido.items.forEach((item: any, index: number) => {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const titulo = item.title?.substring(0, 50) || "Servicio";
                const precio = (item.price || 0).toLocaleString('es-CL');
                doc.text(`${index + 1}. ${titulo}`, 25, y);
                doc.text(`$${precio}`, 160, y, { align: 'right' });
                y += 10;
            });
        }
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Gracias por preferir FreelanceHub.", 105, 280, { align: 'center' });

        doc.save(`Comprobante_${transbankData.buy_order}.pdf`);
    } catch (error) {
        console.error("Error PDF:", error);
    }
  }

  // --- 2. FUNCIÓN: Enviar Correo (Backend API) ---
  const enviarCorreo = async (pedido: any, tbk: any) => {
    try {
        const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: pedido.email,
                items: pedido.items,
                total: tbk.amount,
                buyOrder: tbk.buy_order
            })
        });
        if (res.ok) setEmailStatus('sent');
        else setEmailStatus('error');
    } catch (e) {
        console.error("Error envío correo:", e);
        setEmailStatus('error');
    }
  }

  // --- 3. LÓGICA PRINCIPAL: Procesar Pago ---
  useEffect(() => {
    if (!token || processed.current) {
        if (!token) {
            setStatus('error')
            setMensaje('No hay token de transacción.')
        }
        return
    }
    processed.current = true

    async function procesarTodo() {
      try {
        // A. Confirmar con Transbank (Común para todos)
        const res = await fetch('/api/webpay/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        const tbkData = await res.json()
        setTransbankData(tbkData)

        if (!res.ok || (tbkData.status !== 'AUTHORIZED' && tbkData.response_code !== 0)) {
           throw new Error(tbkData.message || 'Pago rechazado por el banco.')
        }

        // B. Determinar si es INVITADO o USUARIO REGISTRADO
        let pedidoFinal = null;

        // --- CAMINO 1: USUARIO REGISTRADO (Tu código antiguo) ---
        const pagoPendienteLocal = localStorage.getItem('pago_pendiente');
        
        if (pagoPendienteLocal) {
            setTipoUsuario('registrado');
            console.log("👤 Detectado flujo de Usuario Registrado (LocalStorage)");
            const pedidoUsuario = JSON.parse(pagoPendienteLocal);

            // Ejecutar tu lógica antigua de base de datos
            // 1. Insertar en payments
            const { error: errorPago } = await supabase.from('payments').insert({
                project_id: pedidoUsuario.project_id,
                payer_id: pedidoUsuario.payer_id,
                payee_id: pedidoUsuario.payee_id,
                amount: pedidoUsuario.amount,
                status: 'released', // O el estado que corresponda
            });

            if (errorPago && !errorPago.message.includes('unique')) throw new Error(errorPago.message);

            // 2. Actualizar propuesta
            if (pedidoUsuario.propuesta_id) {
                await supabase.from('proposals').update({ status: 'accepted' }).eq('id', pedidoUsuario.propuesta_id);
            }

            // Preparar datos para visualización/correo
            pedidoFinal = {
                email: pedidoUsuario.email_usuario || "usuario@registrado.com", // Asegúrate de guardar el email en pago_pendiente si quieres enviarlo
                items: [{ title: "Servicio Contratado", price: pedidoUsuario.amount }], // Simplificado si no guardaste detalles
                total: pedidoUsuario.amount
            };

            // Limpiar
            localStorage.removeItem('pago_pendiente');

        } else {
            // --- CAMINO 2: INVITADO (Lógica nueva) ---
            setTipoUsuario('guest');
            console.log("👽 Detectado flujo de Invitado (Buscando en DB guest_orders)");

            // Buscar la orden en la tabla de invitados usando el token
            const { data: ordenGuest, error } = await supabase
                .from('guest_orders')
                .select('*')
                .eq('token_ws', token)
                .single();

            if (error || !ordenGuest) {
                // Último intento: LocalStorage de invitado
                const guestTemp = localStorage.getItem('pedido_temp');
                if (guestTemp) {
                    pedidoFinal = JSON.parse(guestTemp);
                    localStorage.removeItem('pedido_temp');
                    localStorage.removeItem('guest_cart');
                } else {
                    console.warn("⚠️ No se encontraron datos del pedido.");
                }
            } else {
                // Encontrado en DB
                pedidoFinal = {
                    email: ordenGuest.guest_email,
                    items: typeof ordenGuest.items === 'string' ? JSON.parse(ordenGuest.items) : ordenGuest.items,
                    total: ordenGuest.amount
                };
                
                // ✅ CORRECCIÓN: Limpiar carrito también si se encuentra en DB
                localStorage.removeItem('pedido_temp');
                localStorage.removeItem('guest_cart');
            }
        }

        // C. Finalizar
        setDataPedido(pedidoFinal);
        setStatus('success');

        if (pedidoFinal) {
            enviarCorreo(pedidoFinal, tbkData);
        }

      } catch (error: any) {
        console.error("❌ Error Crítico:", error)
        setStatus('error')
        setMensaje(error.message || 'Error desconocido.')
      }
    }

    procesarTodo()
  }, [token])

  // --- VISTA LOADING ---
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[60vh] text-gray-800">
        <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Procesando pago...</h2>
        <p className="text-gray-500">Estamos registrando tu compra.</p>
      </div>
    )
  }

  // --- VISTA ERROR ---
  if (status === 'error') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-gray-800">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Algo salió mal</h2>
                <p className="text-gray-600 mb-6 text-sm">{mensaje}</p>
                <button onClick={() => router.push('/checkout')} className="bg-gray-800 text-white px-5 py-3 rounded-xl font-bold w-full">
                    Intentar de nuevo
                </button>
            </div>
        </div>
    )
  }

  // --- VISTA ÉXITO (MODO OSCURO FORZADO A NEGRO PARA VERSE EN FONDO BLANCO) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans animate-fade-in text-gray-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-green-100 relative overflow-hidden">
        
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">¡Pago Exitoso!</h1>
            <p className="text-gray-500">
                {tipoUsuario === 'registrado' ? 'Tu servicio ha sido contratado.' : 'Tu compra como invitado fue exitosa.'}
            </p>
        </div>

        {/* Resumen Transbank (Texto Forzado a Oscuro) */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200 text-sm space-y-3">
            <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Orden:</span>
                <span className="font-mono font-bold text-gray-900">{transbankData?.buy_order}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Monto:</span>
                <span className="font-black text-green-600 text-lg">${(transbankData?.amount || 0).toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Tarjeta:</span>
                <span className="font-bold flex items-center gap-1 text-gray-900">
                     **** {transbankData?.card_detail?.card_number}
                </span>
            </div>
        </div>

        {/* Estado Correo */}
        {dataPedido && (
            <div className={`text-center mb-6 p-3 rounded-lg text-xs flex items-center justify-center gap-2 border ${emailStatus === 'sent' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                <Mail className="w-4 h-4" />
                {emailStatus === 'sent' 
                    ? `Comprobante enviado a ${dataPedido.email}` 
                    : 'Procesando envío de correo...'}
            </div>
        )}

        <div className="flex flex-col gap-3">
            <button onClick={generarPDF} className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition active:scale-95">
                <Download className="w-4 h-4" /> Descargar Comprobante PDF
            </button>
            
            <Link href={tipoUsuario === 'registrado' ? "/dashboard" : "/"} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
                <Home className="w-4 h-4" /> {tipoUsuario === 'registrado' ? 'Ir a mi Dashboard' : 'Volver a la Tienda'}
            </Link>
        </div>
      </div>
    </div>
  )
}