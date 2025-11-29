import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import { WebpayPlus } from 'transbank-sdk'; 
import { Options, IntegrationApiKeys, IntegrationCommerceCodes } from 'transbank-sdk';

// Inicializar Supabase Cliente (Lado Servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, buyOrder, sessionId, email, items } = body; // Recibimos email e items

    // 1. Configuración Webpay
    const tx = new WebpayPlus.Transaction(new Options(
      IntegrationCommerceCodes.WEBPAY_PLUS,
      IntegrationApiKeys.WEBPAY,
      'https://webpay3gint.transbank.cl'
    ));

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const returnUrl = `${origin}/webpay-retorno`;
    
    // 2. Crear Transacción en Transbank
    const response = await tx.create(
      buyOrder, 
      sessionId, 
      amount, 
      returnUrl
    );

    // 3. GUARDAR PEDIDO EN SUPABASE (Estado: 'pending')
    // Esto asegura que la compra existe antes de que el usuario pague
    if (email && items) {
        const { error } = await supabase.from('guest_orders').insert({
            buy_order: buyOrder,
            token_ws: response.token,
            guest_email: email,
            amount: amount,
            items: items, // Guardamos el array de productos JSON
            status: 'pending'
        });
        
        if (error) {
            console.error("Error guardando guest_order:", error);
            // Podríamos fallar aquí, pero mejor dejamos que el usuario intente pagar
            // y confiamos en el log de errores.
        }
    }

    return NextResponse.json({
      token: response.token,
      url: response.url
    });

  } catch (error: any) {
    console.error("Error Transbank Create:", error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}