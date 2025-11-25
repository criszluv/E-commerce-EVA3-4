import { Suspense } from 'react'
import WebpayRetornoContent from './WebpayRetornoContent'

export default function WebpayRetorno() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center font-sans">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Procesando pago...
            </h1>
            <p className="text-gray-500 text-sm">
              Espera mientras confirmamos tu transacción con Webpay.
            </p>
          </div>
        </div>
      }
    >
      <WebpayRetornoContent />
    </Suspense>
  )
}
