'use client'
import { useState, useEffect } from 'react'
// ✅ ESTO ES LO CORRECTO
// Ajusta la ruta (../) según donde esté tu archivo
import { supabase } from '@/lib/supabase' 
// O si no usas alias (@): import { supabase } from '../../../lib/supabase'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    // Seleccionamos todo, incluyendo la nueva columna is_banned
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true }) 
    
    if (error) console.error("Error:", error.message)
    else setUsuarios(data || [])
    
    setLoading(false)
  }

  // --- ACCIÓN 1: CAMBIAR ROL ---
  const cambiarRol = async (userId: string, nuevoRol: string) => {
    if(!confirm(`¿Cambiar rol a ${nuevoRol}?`)) return;
    const { error } = await supabase.from('profiles').update({ role: nuevoRol }).eq('id', userId)
    if (error) alert(error.message)
    else loadUsers()
  }

  // --- ACCIÓN 2: EDITAR INFORMACIÓN (Nombre) ---
  const editarUsuario = async (userId: string, nombreActual: string) => {
    const nuevoNombre = prompt("Editar nombre del usuario:", nombreActual)
    if (!nuevoNombre || nuevoNombre === nombreActual) return;

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: nuevoNombre })
        .eq('id', userId)

    if (error) alert("Error: " + error.message)
    else {
        alert("✅ Nombre actualizado")
        loadUsers()
    }
  }

  // --- ACCIÓN 3: BANEAR / DESHABILITAR (Soft Delete) ---
  const toggleBan = async (userId: string, estadoActualBan: boolean) => {
    const accion = estadoActualBan ? "REACTIVAR" : "BLOQUEAR"
    if(!confirm(`¿Estás seguro de que quieres ${accion} a este usuario?`)) return;

    const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !estadoActualBan }) // Invierte el valor (true -> false, false -> true)
        .eq('id', userId)

    if (error) alert("Error: " + error.message)
    else loadUsers()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-400">👥 Gestión de Usuarios</h1>
        <button onClick={loadUsers} className="bg-gray-800 text-xs px-3 py-2 rounded hover:bg-gray-700 border border-gray-600">
            🔄 Refrescar
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-xs uppercase text-gray-400">
                <tr>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Estado / Rol</th>
                    <th className="p-4 text-center">Gestión</th>
                </tr>
            </thead>
            <tbody>
                {usuarios.map((u) => (
                    <tr key={u.id} className={`border-b border-gray-700 transition ${u.is_banned ? 'bg-red-900/20' : 'hover:bg-gray-700/50'}`}>
                        <td className="p-4">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${u.is_banned ? 'text-red-400 line-through' : 'text-white'}`}>
                                    {u.full_name || 'Sin nombre'}
                                </span>
                                {/* Botón Editar Nombre Pequeño */}
                                <button onClick={() => editarUsuario(u.id, u.full_name)} className="text-gray-500 hover:text-blue-400">
                                    ✏️
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 font-mono">{u.email}</div>
                            
                            {u.is_banned && (
                                <span className="text-[10px] bg-red-600 text-white px-1 rounded ml-0 mt-1 inline-block">BANEADO</span>
                            )}
                        </td>

                        <td className="p-4">
                            <div className="flex flex-col gap-2 items-start">
                                {/* Selector de Roles visual */}
                                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                                    {['client', 'freelancer', 'admin'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => u.role !== role && cambiarRol(u.id, role)}
                                            className={`px-2 py-0.5 text-[10px] rounded uppercase transition ${
                                                u.role === role 
                                                ? 'bg-blue-600 text-white shadow' 
                                                : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                        >
                                            {role.substring(0,3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </td>

                        <td className="p-4 text-center">
                            {/* Botón de Banear / Reactivar */}
                            <button 
                                onClick={() => toggleBan(u.id, u.is_banned)}
                                className={`w-full px-3 py-1.5 rounded text-xs font-bold border transition ${
                                    u.is_banned 
                                    ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900' 
                                    : 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900'
                                }`}
                            >
                                {u.is_banned ? '♻️ Reactivar Cuenta' : '🚫 Deshabilitar'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  )
}