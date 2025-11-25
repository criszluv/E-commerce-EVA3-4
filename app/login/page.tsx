'use client'
import { useState } from 'react'
// ✅ ESTO ES LO CORRECTO
// Ajusta la ruta (../) según donde esté tu archivo
import { supabase } from '@/lib/supabase' 
// O si no usas alias (@): import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'



export default function AuthPage() {
  const [view, setView] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<'client' | 'freelancer'>('client') // Rol por defecto
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMensaje('❌ ' + error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if(password.length < 6) {
        setMensaje('⚠️ La contraseña debe tener 6+ caracteres.')
        setLoading(false)
        return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: rol } // Enviamos el rol seleccionado
      }
    })

    if (error) {
      setMensaje('❌ ' + error.message)
    } else {
      setMensaje('✅ ¡Cuenta creada! Redirigiendo...')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-600 p-4 relative overflow-hidden font-sans">
      
      {/* Decoración de Fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-purple-900/50 p-8 relative z-10 transition-all duration-300 hover:scale-[1.01]">
        
        <div className="text-center mb-6">
            <Link href="/" className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center gap-2 hover:opacity-80 transition">
                <span>🚀</span> FreelanceHub
            </Link>
            <h1 className="text-xl font-bold text-gray-800 mt-4">
                {view === 'login' ? '¡Hola de nuevo!' : 'Crea tu cuenta gratis'}
            </h1>
        </div>

        <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-4">
            
            {/* SELECTOR DE ROL (SOLO VISIBLE EN REGISTRO) */}
            {view === 'register' && (
                <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-in-down">
                    <div 
                        onClick={() => setRol('client')}
                        className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${
                            rol === 'client' 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                    >
                        <div className="text-2xl mb-1">👔</div>
                        <div className={`font-bold text-sm ${rol === 'client' ? 'text-blue-700' : 'text-gray-500'}`}>
                            Cliente
                        </div>
                    </div>

                    <div 
                        onClick={() => setRol('freelancer')}
                        className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${
                            rol === 'freelancer' 
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                            : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                        }`}
                    >
                        <div className="text-2xl mb-1">💻</div>
                        <div className={`font-bold text-sm ${rol === 'freelancer' ? 'text-purple-700' : 'text-gray-500'}`}>
                            Freelancer
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wider">Correo</label>
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                    placeholder="tu@email.com"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wider">Contraseña</label>
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                />
            </div>

            {mensaje && (
                <div className={`p-3 rounded-xl text-sm text-center font-medium animate-pulse ${mensaje.includes('❌') || mensaje.includes('⚠️') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                    {mensaje}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70"
            >
                {loading ? 'Procesando...' : (view === 'login' ? 'Ingresar' : 'Crear Cuenta')}
            </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
                {view === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button 
                    onClick={() => {
                        setView(view === 'login' ? 'register' : 'login')
                        setMensaje('')
                    }}
                    className="ml-2 text-purple-600 font-bold hover:text-purple-800 hover:underline transition-colors"
                >
                    {view === 'login' ? 'Regístrate' : 'Inicia sesión'}
                </button>
            </p>
        </div>

      </div>
    </div>
  )
}