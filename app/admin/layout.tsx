'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const menuItems = [
    { name: '📊 Resumen', href: '/admin', icon: '🏠' },
    { name: '👥 Usuarios', href: '/admin/usuarios', icon: '👤' },
    
    // AHORA SÍ: "Proyectos" apunta al catálogo Open
    { name: '📂 Catálogo (Open)', href: '/admin/proyectos', icon: '📁' },
    
    // AHORA SÍ: "Ventas" apunta al dinero y contratos
    { name: '💰 Ventas y Pagos', href: '/admin/ventas', icon: '💲' },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-red-500 tracking-wider">GOD MODE</h2>
          <p className="text-xs text-gray-400 mt-1">Administración v1.0</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
            <Link href="/" className="block text-center text-sm text-gray-500 hover:text-white">
                ← Volver a la Web
            </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-900 p-8">
        {children}
      </main>
    </div>
  )
}