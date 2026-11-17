import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./marfil-app.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://laencontradawinebistro.com"),
  title: "La Encontrada Wine Bistro | Cocina patagónica y vinos en El Bolsón",
  description:
    "En Callejón Cerro Amigo, El Bolsón, una carta de temporada inspirada en productos regionales y vinos de la Comarca Andina. Consultá la carta actual y reservá por WhatsApp.",
  keywords: [
    "restaurante en El Bolsón",
    "La Encontrada Wine Bistro",
    "cocina patagónica",
    "vinos de la Comarca Andina",
    "restaurante Callejón Cerro Amigo",
  ],
  authors: [{ name: "La Encontrada Wine Bistro" }],
  openGraph: {
    title: "La Encontrada Wine Bistro | Cocina patagónica y vinos en El Bolsón",
    description:
      "Cocina regional de temporada y vinos de la Comarca Andina en Callejón Cerro Amigo, El Bolsón. Consultá la carta y reservá tu mesa.",
    url: "https://laencontradawinebistro.com",
    siteName: "La Encontrada Wine Bistro",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "La Encontrada Wine Bistro",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f5f0e7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "La Encontrada Wine Bistro",
    image: "https://laencontradawinebistro.com/logo.png",
    telephone: "+5492944303105",
    email: "laencontradaresto@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Callejón Cerro Amigo",
      addressLocality: "El Bolsón",
      addressRegion: "Río Negro",
      postalCode: "R8430",
      addressCountry: "AR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -41.9688864,
      longitude: -71.5215975,
    },
    servesCuisine: ["Patagónica", "Gourmet", "Wine Bar", "Bistró"],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "13:00",
        closes: "16:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday"],
        opens: "20:30",
        closes: "23:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Thursday", "Friday", "Saturday"],
        opens: "20:30",
        closes: "23:30",
      },
    ],
  };

  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
