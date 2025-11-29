import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import { WebpayPlus } from 'transbank-sdk'; 
import { Options, IntegrationApiKeys, IntegrationCommerceCodes } from 'transbank-sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
        return NextResponse.json({ message: 'Token no proporcionado' }, { status: 400 });
    }

    const tx = new WebpayPlus.Transaction(new Options(
      IntegrationCommerceCodes.WEBPAY_PLUS, 
      IntegrationApiKeys.WEBPAY,            
      'https://webpay3gint.transbank.cl'   
    ));

    // 1. Confirmar Transacción (COMMIT)
    const response = await tx.commit(token);

    // 2. Si el pago fue autorizado, actualizar Supabase
    if (response.status === 'AUTHORIZED' && response.response_code === 0) {
        // Buscamos la orden por el token (o buy_order) y la marcamos como pagada
        const { error } = await supabase
            .from('guest_orders')
            .update({ status: 'paid' })
            .eq('token_ws', token); // Usamos el token como llave única de la sesión
        
        if (error) {
            console.error("Error actualizando guest_order a PAID:", error);
        } else {
            console.log(`✅ Orden invitada actualizada a PAID (Token: ${token})`);
        }
    } else {
        // Pago rechazado
         await supabase
            .from('guest_orders')
            .update({ status: 'rejected' })
            .eq('token_ws', token);
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error Transbank Commit:", error);
    return NextResponse.json({ 
        message: 'Error al confirmar transacción', 
        error: error.message 
    }, { status: 500 });
  }
}