'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, Loader2, Minimize2, Sparkles } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant';
  content: string;
}

// 💡 PREGUNTAS PREDEFINIDAS
const SUGGESTED_ACTIONS = [
  { label: "Ver ofertas 🔥", text: "¿Qué ofertas tienes disponibles hoy?" },
  { label: "Desarrollo Web 💻", text: "Busco servicios de desarrollo web" },
  { label: "Soy Freelancer 🚀", text: "¿Cómo puedo publicar mis servicios?" },
  { label: "Precios 💰", text: "¿Cuál es el servicio más barato?" },
]

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente IA de FreelanceHub. Puedo recomendarte servicios reales de nuestro catálogo. ¿Qué necesitas?' }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  // Función unificada para enviar mensajes (ya sea por input o botón)
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: [...messages, userMessage] 
        }), 
      })

      if (!response.ok) throw new Error('Error en la API')

      const data = await response.json()

      if (data.choices && data.choices.length > 0) {
        const aiMessage: Message = { 
            role: 'assistant', 
            content: data.choices[0].message.content 
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Tuve un error consultando el catálogo. Intenta de nuevo.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[600px] bg-gray-900 border border-purple-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-900 p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                    <Bot className="text-white h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-sm">Asistente IA</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> 
                        <span className="text-purple-100 text-xs font-medium">Conectado al Catálogo</span>
                    </div>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1">
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/95 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-800 flex items-center justify-center mr-2 flex-shrink-0 border border-purple-600">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start items-center">
                 <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-none px-4 py-3">
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 💡 BOTONES DE SUGERENCIAS */}
          <div className="p-2 bg-gray-900 border-t border-purple-900/30 overflow-x-auto flex gap-2 scrollbar-none">
             {SUGGESTED_ACTIONS.map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => sendMessage(action.text)}
                    disabled={isLoading}
                    className="whitespace-nowrap bg-gray-800 hover:bg-purple-900/50 text-purple-300 text-xs px-3 py-2 rounded-full border border-purple-800/50 transition flex-shrink-0"
                >
                    {action.label}
                </button>
             ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-gray-900 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe aquí..."
              disabled={isLoading}
              className="flex-1 bg-gray-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 border border-gray-700"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl transition"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-gray-700 rotate-90' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}
      >
        {isOpen ? <X className="h-8 w-8 text-white" /> : <Sparkles className="h-8 w-8 text-white" />}
      </button>
    </div>
  )
}