import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    // 1. Validar Claves
    const apiKey = process.env.GROQ_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiKey) return NextResponse.json({ error: 'Falta GROQ API Key' }, { status: 500 });

    // 2. Obtener mensaje del usuario
    const body = await req.json();
    const { messages } = body;
    const lastMessage = messages?.[messages.length - 1]?.content || "Hola";
    const msgLower = lastMessage.toLowerCase(); // Convertir a minúsculas para analizar

    // 3. 🧠 LÓGICA DE BÚSQUEDA INTELIGENTE EN SUPABASE (RAG)
    let contextText = "No se encontraron servicios específicos en el catálogo para esta búsqueda.";
    
    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Construimos la consulta base
            let query = supabase
                .from('projects')
                .select(`
                    id, 
                    title, 
                    price, 
                    category, 
                    description,
                    required_skills, 
                    profiles(full_name)
                `)
                .eq('status', 'open'); // Solo servicios activos

            // --- FILTROS DINÁMICOS ---
            
            // A. Filtro por Categoría / Tema
            if (msgLower.includes('web') || msgLower.includes('app') || msgLower.includes('móvil')) {
                query = query.ilike('category', '%web-mobile%');
            } else if (msgLower.includes('diseño') || msgLower.includes('logo') || msgLower.includes('branding')) {
                query = query.ilike('category', '%design-creative%');
            } else if (msgLower.includes('marketing') || msgLower.includes('redes') || msgLower.includes('ads')) {
                query = query.ilike('category', '%digital-marketing%');
            } else if (msgLower.includes('traducción') || msgLower.includes('redacción') || msgLower.includes('escribir')) {
                query = query.ilike('category', '%writing-translation%');
            }

            // B. Filtro por Precio
            if (msgLower.includes('barato') || msgLower.includes('económico') || msgLower.includes('menor precio')) {
                query = query.order('price', { ascending: true });
            } else if (msgLower.includes('caro') || msgLower.includes('mejor precio') || msgLower.includes('mayor precio')) {
                query = query.order('price', { ascending: false });
            } else {
                // Por defecto: los más recientes primero
                query = query.order('created_at', { ascending: false });
            }

            // Limitamos a 8 resultados para dar buen contexto
            const { data: services, error } = await query.limit(8);

            if (!error && services && services.length > 0) {
                // Formateamos los datos para que la IA los entienda fácil
                contextText = services.map((s: any) => {
                    const skills = Array.isArray(s.required_skills) ? s.required_skills.join(', ') : 'Generales';
                    return `- ID: ${s.id} | Servicio: "${s.title}" | Precio: $${s.price} | Vendedor: ${s.profiles?.full_name} | Habilidades: ${skills} | Desc: ${s.description?.substring(0, 60)}...`;
                }).join('\n');
                
                console.log(`✅ Supabase encontró ${services.length} servicios para: "${lastMessage}"`);
            } else if (error) {
                console.error("Error Supabase:", error);
            }

        } catch (e) {
            console.error("Fallo conexión Supabase:", e);
        }
    }

    // 4. Llamar a Groq (Modelo Llama 3.3)
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres el asistente de ventas experto de "FreelanceHub".
          
          TU MISIÓN: Ayudar al usuario a encontrar servicios basándote en la lista de abajo.
          
          --------------------------------------------------
          CATÁLOGO DE SERVICIOS ENCONTRADOS (Contexto Real):
          ${contextText}
          --------------------------------------------------
          
          INSTRUCCIONES:
          1. Recomienda los servicios de la lista mencionando Título, Precio y Vendedor.
          2. Si preguntan "¿Qué ofertas hay?", lista 2 o 3 opciones variadas.
          3. Si la lista está vacía, di amablemente que no encontraste coincidencias exactas y sugiere buscar otra cosa.
          4. Sé breve, profesional y usa emojis.
          5. ¡NO inventes servicios que no estén en la lista!`
        },
        ...messages // Historial de conversación
      ],
      // 🔴 MODELO ACTUALIZADO Y POTENTE
      model: "llama-3.3-70b-versatile", 
      temperature: 0.5,
      max_tokens: 400,
    });

    const responseContent = completion.choices[0]?.message?.content || "No pude generar una respuesta.";

    return NextResponse.json({
      choices: [{ message: { role: 'assistant', content: responseContent } }]
    });

  } catch (error: any) {
    console.error('🚨 ERROR API GROQ:', error);
    return NextResponse.json({ 
        choices: [{ message: { role: 'assistant', content: "Lo siento, tuve un error de conexión temporal. Por favor intenta de nuevo." } }]
    });
  }
}