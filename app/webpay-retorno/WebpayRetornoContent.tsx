'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase' 

export default function WebpayRetornoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token_ws = searchParams.get('token_ws')

  const [status, setStatus] = useState('Procesando pago...')
  const [errorDetalle, setErrorDetalle] = useState('')
  const processed = useRef(false)

  useEffect(() => {
    // Evita ejecutar si no hay token o si ya lo procesamos
    if (!token_ws || processed.current) return
    processed.current = true

    async function procesarPago() {
      try {
        console.log("1. Recuperando datos del pedido...")
        const datosRaw = localStorage.getItem('pago_pendiente')
        
        if (!datosRaw) {
          throw new Error("No se encontraron datos del pedido en el navegador.")
        }
        
        const pedido = JSON.parse(datosRaw)
        
        // Validar que tengamos IDs
        if (!pedido.project_id || !pedido.propuesta_id) {
          throw new Error("Datos del pedido corruptos o incompletos.")
        }

        console.log("2. Registrando pago en base de datos...", pedido)

        // A) REGISTRAR EL PAGO
        const { error: errorPago } = await supabase.from('payments').insert({
          project_id: pedido.project_id,
          payer_id: pedido.payer_id,
          payee_id: pedido.payee_id,
          amount: pedido.amount,
          status: 'released',
        })

        // Ignoramos error si es por duplicado
        if (errorPago && !errorPago.message.includes('unique')) {
          throw new Error(`Error guardando pago: ${errorPago.message}`)
        }

        console.log("3. Actualizando estado de propuesta (pedido individual)...")

        // B) ACTUALIZAR PROPUESTA -> accepted
        const { error: errorProp } = await supabase
          .from('proposals')
          .update({ status: 'accepted' })
          .eq('id', pedido.propuesta_id)

        if (errorProp) {
          throw new Error(`Error actualizando propuesta: ${errorProp.message}`)
        }

        // No tocamos projects.status, se queda 'open'

        setStatus('¡Pago Exitoso! Redirigiendo...')
        localStorage.removeItem('pago_pendiente')

        setTimeout(() => {
          router.push('/dashboard')
        }, 2500)
      } catch (error: any) {
        console.error("❌ Error Crítico:", error)
        setStatus('Ocurrió un problema al finalizar la compra.')
        setErrorDetalle(error.message || JSON.stringify(error))
      }
    }

    procesarPago()
  }, [token_ws, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        
        {/* ICONO ANIMADO */}
        <div className="mb-6">
          {status.includes('Exitoso') ? (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
              🎉
            </div>
          ) : errorDetalle ? (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-4xl">
              ❌
            </div>
          ) : (
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">{status}</h1>

        {/* DETALLE DEL ERROR (Si existe) */}
        {errorDetalle && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-left break-words">
            <strong>Detalle técnico:</strong><br />
            {errorDetalle}
          </div>
        )}

        <p className="text-gray-400 text-xs mt-8">
          ID Transacción: {token_ws || '...'}
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 text-purple-600 font-bold hover:text-purple-800 underline text-sm"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  )
}
