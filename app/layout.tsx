import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // <--- Importamos el componente inteligente

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-purple-50 text-gray-900`}
      >
        {/* Navbar global */}
        <Navbar />

        <main className="min-h-screen container mx-auto px-4 md:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
