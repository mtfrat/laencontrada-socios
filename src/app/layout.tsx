import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Encontrada - Club de Socios & Fidelización",
  description: "Sistema de puntos, beneficios exclusivos y seguimiento gastronómico de La Encontrada.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#895626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-[#fbf7f0] text-stone-900 selection:bg-amber-200">
        {children}
      </body>
    </html>
  );
}
