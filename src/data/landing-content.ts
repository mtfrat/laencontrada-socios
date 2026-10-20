export interface MenuItem {
  title: string;
  description: string;
  pairing?: string;
  category: "entradas" | "principales" | "postres" | "vinos";
  tag?: string;
  image?: string;
}

export interface ReviewItem {
  author: string;
  comment: string;
  rating: number;
  date: string;
}

export const RESTAURANT_INFO = {
  name: "La Encontrada Wine Bistro",
  shortName: "La Encontrada",
  tagline: "Wine Bistro & Alta Cocina Patagónica",
  address: "Callejón Cerro Amigo, R8430 El Bolsón, Río Negro, Argentina",
  phone: "+54 9 294 430-3105",
  whatsappNumber: "5492944303105",
  email: "laencontradaresto@gmail.com",
  instagramUrl: "https://www.instagram.com/laencontradawinebistro",
  instagramHandle: "@laencontradawinebistro",
  mapsUrl:
    "https://www.google.com.ar/maps/place/La+Encontrada+Wine+Bistro/@-41.9688824,-71.5241724,17z/data=!3m1!4b1!4m6!3m5!1s0x961bbf68c07b8097:0x57fb41b09a2e0b6b!8m2!3d-41.9688864!4d-71.5215975!16s%2Fg%2F11x0gss0pm?hl=es",
  googleRating: 4.9,
  googleReviewsCount: "+250",
  schedule: {
    lunch: "13:00 – 16:30 hs (Todos los días)",
    dinnerWeekdays: "20:30 – 23:00 hs (Dom a Mié)",
    dinnerWeekends: "20:30 – 23:30 hs (Jue, Vie, Sáb)",
  },
  images: {
    hero: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1920&auto=format&fit=crop", // Wine glass in bistro atmosphere
    cellar: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop", // Wine bottles cellar
    patagonia: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop", // Andes mountains
    dish1: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop", // Braised meat / cordero
    dish2: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=1000&auto=format&fit=crop", // Artisanal pasta / delicate dish
    dish3: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1000&auto=format&fit=crop", // Salmon / Trout gourmet
    dessert: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1000&auto=format&fit=crop", // Fine chocolate & red berries dessert
    ambience: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop", // Warm evening bistro
  },
};

export const CONTENT = {
  es: {
    nav: {
      philosophy: "Filosofía",
      cava: "La Cava",
      cuisine: "Propuesta Culinaria",
      hours: "Horarios & Visita",
      club: "Club de Socios",
      reserve: "Reservar Mesa",
    },
    hero: {
      badge: "Wine Bistro • El Bolsón, Patagonia",
      ratingBadge: "4.9 ★ en Google Maps • Callejón Cerro Amigo",
      title: "El encuentro entre la alta cocina patagónica y el alma del buen vino.",
      subtitle:
        "Enclavados en el Callejón Cerro Amigo de El Bolsón, concebimos un espacio íntimo donde los productos de la cordillera dialogan con una curaduría de vinos de la Comarca Andina.",
      ctaReserve: "Reservar Mesa",
      ctaMenu: "Explorar la Carta",
      ctaLinks: "Canales Directos",
    },
    philosophy: {
      tag: "FILOSOFÍA & TERROIR",
      title: "Cocina de origen, respeto por la estación y la tierra",
      p1: "En La Encontrada concebimos cada velada como una pausa en el tiempo. Frente a la silueta del Cerro Piltriquitrón y rodeados por la quietud del bosque nativo, nuestro bistró rinde tributo a la nobleza de la Patagonia.",
      p2: "Nuestra cocina trabaja con productores locales y cosechas estacionales: truchas de deshielo, cordero braseado pacientemente a fuego lento, hongos silvestres recolectados en los pinares y quesos artesanales de los valles andinos.",
      quote: "«El lujo silencioso de una mesa compartida junto al fuego y una copa elegida con devoción».",
      stats: [
        { value: "4.9", label: "Google Maps", note: "Excelencia verificada" },
        { value: "100+", label: "Etiquetas en Cava", note: "Bodegas boutique y de la comarca" },
        { value: "100%", label: "Origen Patagónico", note: "Identidad cordillerana" },
      ],
    },
    cava: {
      tag: "LA CAVA",
      title: "Un diálogo entre valles australes y viñedos de altura",
      subtitle:
        "El vino es el eje que vertebra nuestra propuesta. Cada etiqueta representa la frescura de la Patagonia y la riqueza de terruños irrepetibles.",
      points: [
        {
          title: "Vinos de la Comarca Andina",
          desc: "Etiquetas de microbodegas locales como De Bernardi y Adamow, con Pinot Noir y cepas de clima frío de extrema elegancia.",
        },
        {
          title: "Río Negro & Neuquén",
          desc: "Merlot, Semillón y Malbec de los valles fluviales patagónicos, caracterizados por su mineralidad y acidez vibrante.",
        },
        {
          title: "Selección de Altura & Crianzas",
          desc: "Grandes ejemplares de guarda seleccionados para potenciar nuestras carnes braseadas y piezas de caza.",
        },
        {
          title: "Maridaje Guiado en Mesa",
          desc: "Servicio por copa y sugerencias a medida para que cada plato encuentre su armonía perfecta.",
        },
      ],
    },
    cuisine: {
      tag: "PROPUESTA GASTRONÓMICA",
      title: "Platos Insignia de Estación",
      subtitle: "Cocciones medidas, producto noble sin artificios y el sabor auténtico de la cordillera.",
      tabs: {
        entradas: "Entradas",
        principales: "Principales",
        postres: "Postres",
        vinos: "Vinos & Cava",
      },
      items: [
        {
          title: "Tartar de Trucha Andina & Palta Quemada",
          category: "entradas",
          tag: "De Deshielo",
          description: "Trucha fresca de cordillera curada con cítricos locales, emulsión de eneldo, alcaparras crocantes y tostón de masa madre.",
          pairing: "Maridaje: Pinot Noir Rosé o Chardonnay de la comarca.",
          image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Degustación de Quesos de Campo & Hongos de Pino",
          category: "entradas",
          tag: "Valle Andino",
          description: "Quesos madurados de la zona, conserva tibia de gírgolas y morillas del bosque, miel de pradera y frutos secos tostados.",
          pairing: "Maridaje: Sauvignon Blanc patagónico mineral.",
          image: "https://images.unsplash.com/photo-1541529086526-db283c563270?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Cordero Patagónico Braseado al Malbec",
          category: "principales",
          tag: "Plato Insignia",
          description: "Cocción lenta a fuego pausado durante 8 horas en reducción de vino tinto y hierbas silvestres, cremoso de boniato ahumado y demi-glace.",
          pairing: "Maridaje: Malbec Reserva o Cabernet Franc austral.",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Trucha Asada a la Leña con Manteca de Salvia",
          category: "principales",
          tag: "Especialidad",
          description: "Pesca andina con costra crujiente, papines salteados en manteca clarificada con salvia fresca y vegetales tiernos de huerta.",
          pairing: "Maridaje: Semillón patagónico o Pinot Noir de clima frío.",
          image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Sorrentinos Artesanales de Cordero y Tomillo",
          category: "principales",
          tag: "Pastas Frescas",
          description: "Masa elaborada a mano, relleno braseado al horno de barro, en salsa suave de hongos de pino y reducción de fondo oscuro.",
          pairing: "Maridaje: Bonarda o Blend tinto patagónico.",
          image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Sinfonía de Chocolate Amargo & Frutos Rojos",
          category: "postres",
          tag: "Dulce Final",
          description: "Marquise sedosa de chocolate 70% cacao con coulis tibio de frambuesas y moras de El Bolsón, crocante de nueces y helado artesanal.",
          pairing: "Maridaje: Oporto o Espumante Extra Brut.",
          image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Crème Brûlée de Cardamomo y Rosa Mosqueta",
          category: "postres",
          tag: "Clásico del Bistró",
          description: "Crema suave aromatizada con especias cálidas, costra de caramelo crocante y dulce artesanal de rosa mosqueta patagónica.",
          pairing: "Maridaje: Cosecha tardía / Late harvest.",
          image: "https://images.unsplash.com/photo-1570741270222-38d01df4000d?q=85&w=800&auto=format&fit=crop",
        },
      ] as MenuItem[],
    },
    reviews: {
      tag: "OPINIONES DE HUÉSPEDES",
      title: "Lo que dicen quienes nos visitan",
      subtitle: "Con más de 250 reseñas y un promedio de 4.9 estrellas, nuestro mayor compromiso es la excelencia de tu momento.",
      items: [
        {
          author: "Mariana R.",
          rating: 5,
          date: "Hace 2 semanas",
          comment: "Una experiencia sublime en El Bolsón. El cordero braseado se deshacía con el tenedor y la selección de vinos patagónicos fue impecable. La atención es de primer nivel mundial.",
        },
        {
          author: "Esteban G.",
          rating: 5,
          date: "Hace 1 mes",
          comment: "Ambiente cálido, íntimo y acogedor. El Callejón Cerro Amigo le da un marco de paz único. La copa y la comida fueron un 10 rotundo. Volveremos siempre.",
        },
        {
          author: "Lucas & Clara",
          rating: 5,
          date: "Hace 1 mes",
          comment: "El mejor bistró de la región sin dudarlo. El asesoramiento sobre los vinos y los postres con frutos rojos locales hicieron de nuestra cena de aniversario algo inolvidable.",
        },
      ] as ReviewItem[],
    },
    location: {
      tag: "PLANIFICÁ TU ENCUENTRO",
      title: "Horarios, Ubicación & Entorno",
      addressLabel: "Dirección",
      addressValue: "Callejón Cerro Amigo, R8430 El Bolsón, Río Negro",
      hoursLabel: "Turnos de Atención",
      lunchTitle: "Almuerzos (Mediodía)",
      lunchHours: "13:00 a 16:30 hs (Todos los días)",
      dinnerTitle: "Cenas (Noche)",
      dinnerWeekdays: "20:30 a 23:00 hs (Domingo a Miércoles)",
      dinnerWeekends: "20:30 a 23:30 hs (Jueves, Viernes y Sábado)",
      contactLabel: "Contacto Directo",
      phone: "+54 9 294 430-3105",
      email: "laencontradaresto@gmail.com",
      mapHint: "Ubicado a escasos minutos del centro de El Bolsón en un entorno sereno frente al cerro.",
      btnMaps: "Abrir en Google Maps",
      btnReserve: "Reservar Mesa Ahora",
    },
    club: {
      tag: "CLUB EXCLUSIVO",
      title: "¿Sos comensal frecuente? Sumate a nuestro Club de Socios",
      desc: "Acumulá puntos en cada visita, accedé a etiquetas de cava reservadas, catas privadas guiadas y canjes exclusivos en mesa mediante código QR.",
      btn: "Ingresar al Portal de Socios",
    },
    footer: {
      about: "La Encontrada Wine Bistro — Restaurante de alta cocina patagónica y curaduría de vinos en El Bolsón, Río Negro.",
      rights: "Todos los derechos reservados.",
      links: "Enlaces rápidos",
      contact: "Contacto",
      developedBy: "La Encontrada • Wine Bistro",
    },
    modal: {
      title: "Reservá tu Experiencia",
      subtitle: "Seleccioná los datos de tu reserva para confirmar directamente con nuestro equipo por WhatsApp.",
      step1: "1. Fecha y Turno",
      dateLabel: "Fecha deseada",
      shiftLabel: "Turno",
      shiftLunch: "Almuerzo (13:00 a 16:30)",
      shiftDinner: "Cena (20:30 en adelante)",
      timeLabel: "Horario estimado",
      step2: "2. Comensales y Contacto",
      guestsLabel: "Cantidad de personas",
      nameLabel: "Nombre y Apellido",
      namePlaceholder: "Ej. Martín Fernández",
      phoneLabel: "Teléfono / WhatsApp",
      phonePlaceholder: "Ej. +54 9 11 1234-5678",
      notesLabel: "Notas especiales (Alergias, mesa preferida, aniversario...)",
      notesPlaceholder: "Ej. Mesa cerca del rincón, aniversario de pareja...",
      btnSubmit: "Confirmar Reserva por WhatsApp",
      directWhatsapp: "O si preferís chatear directamente:",
      directWhatsappBtn: "Abrir chat libre en WhatsApp",
      cancel: "Cerrar",
    },
  },
  en: {
    nav: {
      philosophy: "Philosophy",
      cava: "Wine Cellar",
      cuisine: "Culinary Proposal",
      hours: "Hours & Visit",
      club: "Members Club",
      reserve: "Book a Table",
    },
    hero: {
      badge: "Wine Bistro • El Bolsón, Patagonia",
      ratingBadge: "4.9 ★ on Google Maps • Callejón Cerro Amigo",
      title: "Where the essence of Patagonian gastronomy meets exceptional wine.",
      subtitle:
        "Nestled in Callejón Cerro Amigo in El Bolsón, we craft an intimate space where seasonal Andean ingredients converse with a thoughtful curation of wines from the Andean region.",
      ctaReserve: "Book a Table",
      ctaMenu: "Explore the Menu",
      ctaLinks: "Quick Bio Links",
    },
    philosophy: {
      tag: "PHILOSOPHY & TERROIR",
      title: "Cuisine of origin, honoring seasonality and the land",
      p1: "At La Encontrada, every evening is conceived as a pause in time. Overlooking the silhouette of Mount Piltriquitrón and sheltered by native forests, our bistro honors the purity of Patagonia.",
      p2: "Our kitchen partners with local growers: meltwater trout, slow-braised lamb, wild mushrooms foraged from pine hills, and artisanal cheeses from the Andean valleys.",
      quote: "«The quiet luxury of a shared table by the hearth and a vintage poured with devotion».",
      stats: [
        { value: "4.9", label: "Google Maps", note: "Verified excellence" },
        { value: "100+", label: "Labels in Cellar", note: "Boutique & regional wineries" },
        { value: "100%", label: "Patagonian Origin", note: "Mountain terroir identity" },
      ],
    },
    cava: {
      tag: "THE CELLAR",
      title: "A dialogue between southern valleys and mountain vineyards",
      subtitle:
        "Wine is the soul of our house. Each label expresses the crisp freshness of Patagonia and the richness of untamed terroirs.",
      points: [
        {
          title: "Andean Region Vintages",
          desc: "Cold-climate Pinot Noir and whites from boutique producers like De Bernardi and Adamow.",
        },
        {
          title: "Río Negro & Neuquén",
          desc: "Merlot, Semillon, and Malbec from southern river valleys, shaped by limestone minerality and vibrant acidity.",
        },
        {
          title: "Cellar Reserves & Barrel Selections",
          desc: "Aged vintages curated to accompany slow-braised meats and regional game.",
        },
        {
          title: "Tailored Table Pairings",
          desc: "Wine by the glass and sommelier advice tailored to each course of your dinner.",
        },
      ],
    },
    cuisine: {
      tag: "CULINARY PROPOSAL",
      title: "Signature Seasonal Dishes",
      subtitle: "Honest techniques, noble produce, and the authentic taste of the Andes.",
      tabs: {
        entradas: "Starters",
        principales: "Main Courses",
        postres: "Desserts",
        vinos: "Wines & Cellar",
      },
      items: [
        {
          title: "Andean Trout Tartare & Charred Avocado",
          category: "entradas",
          tag: "Glacial Freshness",
          description: "Fresh river trout cured with native citrus, dill emulsion, crispy capers, and rustic sourdough toast.",
          pairing: "Pairing: Pinot Noir Rosé or local Chardonnay.",
          image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Farmhouse Cheese Tasting & Pine Mushrooms",
          category: "entradas",
          tag: "Andean Valleys",
          description: "Aged regional cheeses, warm wild oyster and morel preserves, meadow honey, and roasted nuts.",
          pairing: "Pairing: Crisp Patagonian Sauvignon Blanc.",
          image: "https://images.unsplash.com/photo-1541529086526-db283c563270?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Slow-Braised Patagonian Lamb in Malbec",
          category: "principales",
          tag: "Signature Dish",
          description: "Gently braised for 8 hours in red wine reduction and wild herbs, served over smoked sweet potato purée and demi-glace.",
          pairing: "Pairing: Malbec Reserva or cool-climate Cabernet Franc.",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Wood-Fired Roasted Trout with Sage Butter",
          category: "principales",
          tag: "Specialty",
          description: "Crispy skin Andean trout, roasted fingerling potatoes in clarified sage butter, and tender garden vegetables.",
          pairing: "Pairing: Aged Semillon or Patagonian Pinot Noir.",
          image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Handmade Lamb & Thyme Sorrentinos",
          category: "principales",
          tag: "Fresh Pasta",
          description: "Delicate artisan pasta filled with oven-braised lamb, in wild pine mushroom sauce and rich savory jus.",
          pairing: "Pairing: Bonarda or Patagonian Red Blend.",
          image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Dark Chocolate Symphony & Andean Berries",
          category: "postres",
          tag: "Sweet Finale",
          description: "Velvety 70% dark chocolate marquise with warm raspberry & blackberry coulis, caramelized walnuts, and artisanal gelato.",
          pairing: "Pairing: Tawny Port or Extra Brut Sparkler.",
          image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=85&w=800&auto=format&fit=crop",
        },
        {
          title: "Cardamom & Rose Hip Crème Brûlée",
          category: "postres",
          tag: "Bistro Classic",
          description: "Silky custard infused with warm aromatic spices, crisp caramelized crust, and local rose hip compote.",
          pairing: "Pairing: Late harvest white wine.",
          image: "https://images.unsplash.com/photo-1570741270222-38d01df4000d?q=85&w=800&auto=format&fit=crop",
        },
      ] as MenuItem[],
    },
    reviews: {
      tag: "GUEST EXPERIENCES",
      title: "What our guests say",
      subtitle: "With more than 250 Google reviews and a 4.9-star average, our highest priority is your unforgettable evening.",
      items: [
        {
          author: "Mariana R.",
          rating: 5,
          date: "2 weeks ago",
          comment: "A sublime dining experience in El Bolsón. The braised lamb melted like butter, and the Patagonian wine list was impeccable. World-class hospitality.",
        },
        {
          author: "Esteban G.",
          rating: 5,
          date: "1 month ago",
          comment: "Cozy, warm, and intimate setting. Callejón Cerro Amigo provides a serene natural backdrop. Food and wine were a solid 10/10.",
        },
        {
          author: "Lucas & Clara",
          rating: 5,
          date: "1 month ago",
          comment: "Hands down the best bistro in the region. The wine pairing guidance and local berry desserts turned our anniversary dinner into pure magic.",
        },
      ] as ReviewItem[],
    },
    location: {
      tag: "PLAN YOUR VISIT",
      title: "Opening Hours, Location & Setting",
      addressLabel: "Address",
      addressValue: "Callejón Cerro Amigo, R8430 El Bolsón, Río Negro, Argentina",
      hoursLabel: "Opening Hours",
      lunchTitle: "Lunch Service",
      lunchHours: "1:00 PM – 4:30 PM (Daily)",
      dinnerTitle: "Dinner Service",
      dinnerWeekdays: "8:30 PM – 11:00 PM (Sunday to Wednesday)",
      dinnerWeekends: "8:30 PM – 11:30 PM (Thursday, Friday & Saturday)",
      contactLabel: "Direct Contact",
      phone: "+54 9 294 430-3105",
      email: "laencontradaresto@gmail.com",
      mapHint: "Just a few minutes from downtown El Bolsón, in a peaceful mountain retreat setting.",
      btnMaps: "Open in Google Maps",
      btnReserve: "Book Table Now",
    },
    club: {
      tag: "EXCLUSIVE CLUB",
      title: "Frequent Guest? Join our Members Club",
      desc: "Earn points with every meal, unlock reserved cellar vintages, join private tastings, and redeem table rewards effortlessly via QR code.",
      btn: "Enter Members Portal",
    },
    footer: {
      about: "La Encontrada Wine Bistro — High-end Patagonian dining and curated wine cellar in El Bolsón, Río Negro.",
      rights: "All rights reserved.",
      links: "Quick Links",
      contact: "Contact",
      developedBy: "La Encontrada • Wine Bistro",
    },
    modal: {
      title: "Reserve Your Table",
      subtitle: "Select your reservation details to confirm immediately with our team via WhatsApp.",
      step1: "1. Date & Service",
      dateLabel: "Desired Date",
      shiftLabel: "Service",
      shiftLunch: "Lunch (1:00 PM to 4:30 PM)",
      shiftDinner: "Dinner (8:30 PM onwards)",
      timeLabel: "Estimated Time",
      step2: "2. Guests & Contact",
      guestsLabel: "Number of Guests",
      nameLabel: "Full Name",
      namePlaceholder: "E.g., John Miller",
      phoneLabel: "Phone / WhatsApp",
      phonePlaceholder: "E.g., +1 555 123-4567",
      notesLabel: "Special Notes (Allergies, preferred table, anniversary...)",
      notesPlaceholder: "E.g., Quiet corner table, celebrating an anniversary...",
      btnSubmit: "Confirm Booking on WhatsApp",
      directWhatsapp: "Or chat directly with our front desk:",
      directWhatsappBtn: "Open direct WhatsApp chat",
      cancel: "Close",
    },
  },
};
