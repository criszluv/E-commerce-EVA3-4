'use client'
import { useState } from 'react'
// Ajusta la ruta según tu estructura real
import { supabase } from '@/lib/supabase' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AuthPage() {
  // Ahora view soporta 'recovery'
  const [view, setView] = useState<'login' | 'register' | 'recovery'>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Nuevos estados para Registro
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')

  const [rol, setRol] = useState<'client' | 'freelancer'>('client')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const router = useRouter()

  // --- LOGIN ---
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

  // --- REGISTRO ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')
    
    // Validaciones
    if (!name.trim()) {
        setMensaje('⚠️ El nombre es obligatorio.')
        setLoading(false)
        return
    }
    if (password.length < 6) {
        setMensaje('⚠️ La contraseña debe tener 6+ caracteres.')
        setLoading(false)
        return
    }
    if (password !== confirmPassword) {
        setMensaje('⚠️ Las contraseñas no coinciden.')
        setLoading(false)
        return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Guardamos el rol y el nombre en la metadata del usuario
        data: { 
            role: rol,
            full_name: name 
        } 
      }
    })

    if (error) {
      setMensaje('❌ ' + error.message)
    } else {
      setMensaje('✅ ¡Cuenta creada! Revisa tu correo para confirmar.')
      // Opcional: Redirigir o limpiar formulario
      setTimeout(() => {
        // router.push('/dashboard') // Si tienes auto-confirm desactivado
        setView('login') // O mandar al login
      }, 2000)
    }
    setLoading(false)
  }

  // --- RECUPERAR CONTRASEÑA ---
  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')

    // Asegúrate de configurar la URL de redirección en Supabase Dashboard -> Auth -> URL Configuration
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : undefined,
    })

    if (error) {
        setMensaje('❌ ' + error.message)
    } else {
        setMensaje('✅ Correo de recuperación enviado. Revisa tu bandeja.')
    }
    setLoading(false)
  }

  // Título dinámico según la vista
  const getTitle = () => {
      if (view === 'login') return '¡Hola de nuevo!'
      if (view === 'register') return 'Crea tu cuenta gratis'
      return 'Recuperar Contraseña'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-600 p-4 relative overflow-hidden font-sans">
      
      {/* Decoración de Fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-purple-900/50 p-8 relative z-10 transition-all duration-300">
        
        <div className="text-center mb-6">
            <Link href="/" className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center gap-2 hover:opacity-80 transition">
                <span>🚀</span> FreelanceHub
            </Link>
            <h1 className="text-xl font-bold text-gray-800 mt-4">
                {getTitle()}
            </h1>
            {view === 'recovery' && (
                <p className="text-sm text-gray-500 mt-2">Te enviaremos un enlace para restablecerla.</p>
            )}
        </div>

        <form onSubmit={
            view === 'login' ? handleLogin : 
            view === 'register' ? handleSignUp : 
            handleRecoverPassword
        } className="space-y-4">
            
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

            {/* CAMPO NOMBRE (SOLO REGISTRO) */}
            {view === 'register' && (
                <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wider">Nombre Completo</label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                        placeholder="Ej. Juan Pérez"
                    />
                </div>
            )}

            {/* CAMPO EMAIL (TODAS LAS VISTAS) */}
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

            {/* CAMPO PASSWORD (LOGIN Y REGISTRO) */}
            {view !== 'recovery' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-1 ml-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Contraseña</label>
                        {view === 'login' && (
                            <button 
                                type="button"
                                onClick={() => {
                                    setView('recovery')
                                    setMensaje('')
                                }}
                                className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        )}
                    </div>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                        placeholder="••••••••"
                    />
                </div>
            )}

            {/* CAMPO CONFIRMAR PASSWORD (SOLO REGISTRO) */}
            {view === 'register' && (
                <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wider">Confirmar Contraseña</label>
                    <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full bg-gray-50 border px-4 py-3 rounded-xl focus:ring-2 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400 ${
                            confirmPassword && password !== confirmPassword 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-200 focus:ring-purple-500'
                        }`}
                        placeholder="Repite tu contraseña"
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-1 ml-1">Las contraseñas no coinciden</p>
                    )}
                </div>
            )}

            {/* MENSAJES DE ERROR/EXITO */}
            {mensaje && (
                <div className={`p-3 rounded-xl text-sm text-center font-medium animate-pulse ${mensaje.includes('❌') || mensaje.includes('⚠️') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                    {mensaje}
                </div>
            )}

            {/* BOTÓN SUBMIT */}
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70"
            >
                {loading ? 'Procesando...' : (
                    view === 'login' ? 'Ingresar' : 
                    view === 'register' ? 'Crear Cuenta' : 
                    'Enviar enlace'
                )}
            </button>
        </form>

        {/* LINKS DE NAVEGACION INFERIOR */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
            
            {view === 'login' && (
                <p className="text-sm text-gray-500">
                    ¿No tienes cuenta?
                    <button 
                        onClick={() => { setView('register'); setMensaje('') }}
                        className="ml-2 text-purple-600 font-bold hover:text-purple-800 hover:underline transition-colors"
                    >
                        Regístrate
                    </button>
                </p>
            )}

            {view === 'register' && (
                <p className="text-sm text-gray-500">
                    ¿Ya tienes cuenta?
                    <button 
                        onClick={() => { setView('login'); setMensaje('') }}
                        className="ml-2 text-purple-600 font-bold hover:text-purple-800 hover:underline transition-colors"
                    >
                        Inicia sesión
                    </button>
                </p>
            )}

            {view === 'recovery' && (
                <button 
                    onClick={() => { setView('login'); setMensaje('') }}
                    className="text-sm text-gray-500 hover:text-gray-800 font-medium hover:underline transition-colors"
                >
                    ← Volver al inicio de sesión
                </button>
            )}
        </div>

      </div>
    </div>
  )
}