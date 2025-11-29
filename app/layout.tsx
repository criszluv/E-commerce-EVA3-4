import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; 
import ChatBot from "@/components/ChatBot"; // 👈 1. Importamos el ChatBot

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FreelanceHub",
  description: "Marketplace de servicios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        // 👈 2. Cambié el fondo a 'bg-gray-900' para que coincida con el diseño oscuro de la tienda
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white selection:bg-purple-500 selection:text-white`}
      >
        {/* Navbar global */}
        <Navbar />

        {/* Quitamos 'container mx-auto px-4' de aquí para permitir 
           que las páginas controlen sus propios anchos (útil para banners full-width).
        */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* 👈 3. El ChatBot flotante va aquí al final */}
        <ChatBot />
      </body>
    </html>
  );
}