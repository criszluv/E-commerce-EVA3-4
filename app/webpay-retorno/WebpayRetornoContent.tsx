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
  const [mensaje, setMensaje] = useState('Confirmando transacción...')
  const [dataPedido, setDataPedido] = useState<any>(null)
  const [transbankData, setTransbankData] = useState<any>(null)
  const [emailStatus, setEmailStatus] = useState<'pending' | 'sent' | 'error'>('pending')
  
  const processed = useRef(false)

  // --- FUNCIÓN: Generar PDF ---
  const generarPDF = () => {
    if (!transbankData) {
        alert("Aún no se han cargado los datos de Transbank para generar el PDF.");
        return;
    }

    try {
        const doc = new jsPDF();
        
        // Encabezado moderno
        doc.setFillColor(67, 56, 202); // Indigo 700
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("FreelanceHub", 20, 25);
        doc.setFontSize(12);
        doc.text("Comprobante de Pago Electrónico", 130, 25);

        // Información General
        doc.setTextColor(0, 0, 0); // Texto Negro
        doc.setFontSize(10);
        doc.text(`Fecha Emisión: ${new Date().toLocaleString()}`, 20, 55);
        doc.text(`Estado: APROBADO`, 150, 55);

        // Caja de Datos Transbank
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, 65, 170, 45);
        
        // Aseguramos color negro para el detalle
        doc.setTextColor(0, 0, 0); 
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Detalle de la Transacción", 25, 75);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        doc.text(`Orden de Compra:`, 25, 85);
        doc.text(`${transbankData.buy_order}`, 80, 85);
        
        doc.text(`Código Autorización:`, 25, 92);
        doc.text(`${transbankData.authorization_code}`, 80, 92);
        
        doc.text(`Tarjeta:`, 25, 99);
        doc.text(`**** **** **** ${transbankData.card_detail?.card_number || 'XXXX'}`, 80, 99);

        // Monto Destacado
        doc.setFontSize(16);
        doc.setTextColor(22, 163, 74); // Verde para el dinero
        doc.setFont("helvetica", "bold");
        doc.text(`Total Pagado: $${(transbankData.amount || 0).toLocaleString('es-CL')}`, 130, 95);

        // Lista de Productos
        if (dataPedido && dataPedido.items) {
            doc.setTextColor(0, 0, 0); // Volver a negro
            doc.setFontSize(14);
            doc.text("Resumen de Productos", 20, 130);
            
            let y = 140;
            dataPedido.items.forEach((item: any, index: number) => {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const titulo = item.title.length > 60 ? item.title.substring(0, 60) + '...' : item.title;
                doc.text(`${index + 1}. ${titulo}`, 25, y);
                doc.text(`$${(item.price || 0).toLocaleString('es-CL')}`, 170, y, { align: 'right' });
                y += 8;
            });
        }

        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Gracias por confiar en FreelanceHub.", 105, 280, { align: 'center' });

        doc.save(`Comprobante_${transbankData.buy_order}.pdf`);
    } catch (error) {
        console.error("Error generando PDF:", error);
        alert("Ocurrió un error al generar el PDF.");
    }
  }

  // --- FUNCIÓN: Enviar Correo ---
  const enviarCorreoConfirmacion = async (pedido: any, tbkData: any) => {
    try {
        console.log("📨 Enviando solicitud de correo al servidor...");
        const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: pedido.email,
                items: pedido.items,
                total: tbkData.amount,
                buyOrder: tbkData.buy_order,
                orderId: token 
            })
        });
        
        const result = await res.json();
        
        if (res.ok) {
            setEmailStatus('sent');
            console.log("✅ Correo enviado/simulado correctamente:", result);
        } else {
            console.error("❌ Error del servidor al enviar correo:", result);
            setEmailStatus('error');
        }
    } catch (e) {
        console.error("❌ Error de red enviando correo:", e);
        setEmailStatus('error');
    }
  }

  useEffect(() => {
    if (!token || processed.current) {
        if (!token) {
            setStatus('error')
            setMensaje('No se recibió un token de transacción válido.')
        }
        return
    }
    processed.current = true

    async function confirmarTransaccion() {
      try {
        // 1. Confirmar con Transbank
        const res = await fetch('/api/webpay/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        
        const data = await res.json()
        setTransbankData(data) 

        if (!res.ok || (data.status !== 'AUTHORIZED' && data.response_code !== 0)) {
           throw new Error(data.message || 'La transacción fue rechazada.')
        }

        // 2. Recuperar Datos del Pedido
        let pedidoFinal = null;
        
        const pedidoTemp = localStorage.getItem('pedido_temp')
        if (pedidoTemp) {
          console.log("📦 Datos recuperados de LocalStorage");
          pedidoFinal = JSON.parse(pedidoTemp)
          localStorage.removeItem('guest_cart')
          localStorage.removeItem('pedido_temp')
        } 
        
        if (!pedidoFinal) {
            console.log("🔍 Buscando datos en Supabase (guest_orders)...");
            const { data: ordenBD, error } = await supabase
                .from('guest_orders')
                .select('*')
                .eq('token_ws', token)
                .single()
            
            if (error) {
                console.error("❌ Error consultando Supabase:", error);
            }

            if (ordenBD) {
                console.log("📦 Datos recuperados de Supabase");
                pedidoFinal = {
                    email: ordenBD.guest_email,
                    items: typeof ordenBD.items === 'string' ? JSON.parse(ordenBD.items) : ordenBD.items, 
                    total: ordenBD.amount
                }
            }
        }

        setDataPedido(pedidoFinal);
        setStatus('success');

        if (pedidoFinal) {
            enviarCorreoConfirmacion(pedidoFinal, data);
        } else {
            console.warn("⚠️ No se encontraron los datos del pedido.");
        }
        
      } catch (error: any) {
        console.error("❌ Error crítico en proceso de pago:", error)
        setStatus('error')
        setMensaje(error.message || 'Error desconocido.')
      }
    }

    confirmarTransaccion()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[60vh] text-gray-800">
        <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Procesando pago...</h2>
        <p className="text-gray-500">No cierres esta ventana.</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-gray-800">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Algo salió mal</h2>
                <p className="text-gray-600 mb-6 text-sm">{mensaje}</p>
                <button onClick={() => router.push('/checkout')} className="bg-gray-800 text-white px-5 py-3 rounded-xl font-bold w-full">
                    Volver al Checkout
                </button>
            </div>
        </div>
    )
  }

  return (
    // ✅ CORRECCIÓN CLAVE: 'text-gray-900' fuerza el color de texto a oscuro
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans animate-fade-in text-gray-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-green-100 relative overflow-hidden">
        
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            {/* Texto oscuro explícito */}
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">¡Pago Exitoso!</h1>
            <p className="text-gray-500">Transacción aprobada.</p>
        </div>

        {/* Resumen Transbank */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200 text-sm space-y-3">
            <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Orden:</span>
                {/* Texto oscuro explícito */}
                <span className="font-mono font-bold text-gray-900">{transbankData?.buy_order}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Monto:</span>
                <span className="font-black text-green-600 text-lg">${(transbankData?.amount || 0).toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Tarjeta:</span>
                {/* Texto oscuro explícito */}
                <span className="font-bold flex items-center gap-1 text-gray-900">
                     **** {transbankData?.card_detail?.card_number}
                </span>
            </div>
        </div>

        {/* Estado del Correo */}
        {dataPedido ? (
            <div className={`text-center mb-6 p-3 rounded-lg text-xs flex items-center justify-center gap-2 border ${emailStatus === 'sent' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                <Mail className="w-4 h-4" />
                {emailStatus === 'sent' 
                    ? `Comprobante enviado a ${dataPedido.email}` 
                    : emailStatus === 'error' ? 'Error enviando correo' : 'Procesando correo...'}
            </div>
        ) : (
            <div className="text-center mb-6 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700 border border-yellow-200 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>No se pudieron cargar los productos para el reporte.</span>
            </div>
        )}

        <div className="flex flex-col gap-3">
            <button 
                onClick={generarPDF}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition active:scale-95"
            >
                <Download className="w-4 h-4" /> Descargar Comprobante PDF
            </button>
            
            <Link href="/" className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
                <Home className="w-4 h-4" /> Volver a la Tienda
            </Link>
        </div>
      </div>
    </div>
  )
}