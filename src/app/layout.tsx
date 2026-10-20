import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://laencontradawinebistro.com"),
  title: "La Encontrada Wine Bistro | Alta Cocina & Cava en El Bolsón, Patagonia",
  description:
    "Restaurante gourmet y wine bistro en Callejón Cerro Amigo, El Bolsón, Río Negro. Calificación 4.9★ en Google Maps. Cocina de autor patagónica, cordero braseado, trucha andina y selecta cava de vinos.",
  keywords: [
    "restaurante gourmet en El Bolsón",
    "wine bistro Patagonia",
    "alta cocina Río Negro",
    "La Encontrada Wine Bistro",
    "donde comer en El Bolsón",
    "restaurante Callejón Cerro Amigo",
    "maridaje vinos Patagonia",
  ],
  authors: [{ name: "La Encontrada Wine Bistro" }],
  openGraph: {
    title: "La Encontrada Wine Bistro | Alta Cocina & Cava en El Bolsón",
    description:
      "Experiencia gastronómica de excelencia en la Patagonia. 4.9★ en Google Maps. Cava seleccionada y cocina andina de autor.",
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
  themeColor: "#5c131d",
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
    priceRange: "$$$",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "250",
    },
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
    <html lang="es" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#010101] text-white selection:bg-[#5c131d] selection:text-white">
        {children}
      </body>
    </html>
  );
}
