import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API Key' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Esta función lista los modelos disponibles para tu cuenta
    const modelResponse = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    // Nota: El SDK no expone listModels directamente en todas las versiones, 
    // pero vamos a probar si el modelo flash responde con un 'countTokens' básico para validar.
    
    const info = await modelResponse.countTokens("Test");
    
    return NextResponse.json({ 
        status: "OK", 
        message: "El modelo gemini-1.5-flash responde correctamente", 
        tokens: info 
    });

  } catch (error: any) {
    return NextResponse.json({ 
        status: "ERROR", 
        details: error.message,
        hint: "Si esto falla, tu API Key no tiene acceso a este modelo o la librería es vieja."
    });
  }
}