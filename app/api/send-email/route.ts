import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("❌ [SERVER] No se encontró RESEND_API_KEY.");
      return NextResponse.json({ error: "Falta configuración del servidor" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const body = await request.json();
    const { email, items, total, buyOrder } = body; // 'email' es el del cliente (criszluv...)

    // --- CONFIGURACIÓN DE SEGURIDAD RESEND (MODO PRUEBA) ---
    // Resend solo permite enviar a tu propio correo si no tienes dominio verificado.
    // Cambia esto a 'false' cuando tengas tu dominio verificado en producción.
    const MODO_PRUEBA = true; 
    const CORREO_ADMIN = 'cristobal.vas.va@gmail.com'; // <--- TU CORREO REGISTRADO EN RESEND

    // Si estamos en modo prueba, forzamos el envío a ti mismo para evitar el error 403
    const destinatarioFinal = MODO_PRUEBA ? CORREO_ADMIN : email;
    
    console.log(`📨 [SERVER] Procesando correo. Cliente: ${email} -> Enviando a: ${destinatarioFinal}`);

    // Lista de productos
    const listaProductos = items.map((i: any) => 
        `<li style="margin-bottom: 5px;">
            <strong>${i.title}</strong> - $${parseInt(i.price).toLocaleString('es-CL')}
         </li>`
    ).join('');

    // Aviso si es redirigido
    const avisoPrueba = MODO_PRUEBA 
        ? `<div style="background:#fff3cd; color:#856404; padding:10px; margin-bottom:15px; border:1px solid #ffeeba; border-radius:5px; font-size:12px;">
            <strong>MODO PRUEBA:</strong> Este correo era para <u>${email}</u>, pero se envió a tu cuenta admin porque Resend requiere verificar dominio para envíos externos.
           </div>` 
        : '';

    const htmlContent = `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        ${avisoPrueba}
        <h1 style="color: #4f46e5; text-align: center;">¡Gracias por tu compra!</h1>
        <p style="text-align: center;">Tu pedido <strong>#${buyOrder}</strong> ha sido confirmado.</p>
        
        <div style="background: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="font-size: 18px; text-align: center; margin: 0;">Total: <strong>$${parseInt(total).toLocaleString('es-CL')}</strong></p>
        </div>
        
        <h3>Resumen del Pedido:</h3>
        <ul>${listaProductos}</ul>
        
        <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">FreelanceHub - Comprobante Automático</p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'FreelanceHub <onboarding@resend.dev>',
      to: [destinatarioFinal], 
      subject: MODO_PRUEBA ? `[PRUEBA] Comprobante #${buyOrder} (Para: ${email})` : `Comprobante de Pago #${buyOrder}`,
      html: htmlContent,
    });

    if (data.error) {
        console.error("❌ [SERVER] Error Resend:", JSON.stringify(data.error));
        return NextResponse.json({ error: data.error.message, name: data.error.name }, { status: 500 });
    }

    console.log(`✅ [SERVER] Email enviado correctamente. ID: ${data.data?.id}`);
    return NextResponse.json({ success: true, id: data.data?.id });

  } catch (error: any) {
    console.error("❌ [SERVER] Error Crítico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}