import { NextResponse } from 'next/server';
// @ts-ignore
import { WebpayPlus } from 'transbank-sdk'; 
import { Options, IntegrationApiKeys, IntegrationCommerceCodes } from 'transbank-sdk';

export async function POST(request: Request) {
  const body = await request.json();
  const { amount, buyOrder, sessionId } = body;

  // 1. Configuración de Transbank (Modo Pruebas)
  // Usamos las llaves públicas de integración de Transbank
    const tx = new WebpayPlus.Transaction(new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS, // <--- CÓDIGO 597055555532
    IntegrationApiKeys.WEBPAY,            // <--- LLAVE DE PRUEBA
    'https://webpay3gint.transbank.cl'
    ));

  try {
    // 2. Crear la transacción
    // returnUrl: A donde vuelve el usuario después de pagar
    const returnUrl = `${request.headers.get('origin')}/webpay-retorno`;
    
    const response = await tx.create(
      buyOrder, 
      sessionId, 
      amount, 
      returnUrl
    );

    // 3. Devolver token y url al frontend
    return NextResponse.json({
      token: response.token,
      url: response.url
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}