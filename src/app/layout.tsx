import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Encontrada - Wine Bistro | Club de Socios",
  description: "Sistema exclusivo de membresía, puntos y beneficios de La Encontrada Wine Bistro.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5c131d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased min-h-screen bg-[#010101] text-white selection:bg-[#5c131d] selection:text-white">
        {children}
      </body>
    </html>
  );
}
