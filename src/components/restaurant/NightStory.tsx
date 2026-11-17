import Image from "next/image";
import { ArrowUpRight, Plus, Star } from "lucide-react";
import { RESTAURANT_INFO } from "@/data/landing-content";
import { experienceCopy, restaurantPhotos } from "./restaurant-copy";
import styles from "./restaurant.module.css";

const nightCopy = {
  es: {
    lead: "La noche empieza mucho antes del primer plato.",
    leadBody: "Una mesa junto a los árboles, algo rico para abrir el apetito y tiempo para elegir el vino. En La Encontrada, los detalles hacen que la cena se sienta propia.",
    kitchenTitle: "Para empezar, para compartir, para recordar.",
    kitchenBody: "Quienes nos visitan hablan de una cocina generosa y cuidada: entradas para conversar, platos con sabores de la zona y postres que merecen su propio momento.",
    menu: "Preguntar por la carta de hoy",
    menuNote: "La carta puede cambiar según la temporada. Consultá los platos y vinos disponibles al reservar.",
    firstCaption: "Una copa y algo para empezar",
    secondCaption: "Entradas para compartir",
    thirdCaption: "El plato principal también cuenta una historia",
    fourthCaption: "Y después, el postre",
    placeTitle: "Un rincón para bajar el ritmo.",
    placeBody: "En Callejón Cerro Amigo, la madera, los ventanales y el paisaje acompañan la mesa. Hay lugar para una cena íntima y también para una sobremesa que se estira sin mirar la hora.",
    outdoorCaption: "La casa, entre árboles",
    terraceCaption: "Una mesa afuera cuando acompaña el día",
    reviewsTitle: "La mejor recomendación viene de otra mesa.",
    reviewIntro: "Tres experiencias que cuentan algo más que una puntuación.",
    reviewOne: "Cecilia destacó el cuidado desde la llegada, la ambientación elegante y la presentación de los platos. Contó que la recibió personalmente la dueña.",
    reviewTwo: "Felipe recordó la sopa de cortesía, las empanadas, la trucha, la humita de cordero y dos postres. También subrayó el trato amable durante toda la visita.",
    reviewThree: "Elio recordó el goulash de ciervo, la trucha y una cata de vinos patagónicos. También destacó la atención de Mercedes y el ambiente del lugar.",
    reviewSource: "Reseña en Google Maps",
    reviewsLink: "Leer las reseñas completas",
    checked: "Consultado el 5 de noviembre de 2026",
    closingTitle: "La próxima buena mesa puede ser la tuya.",
    closingBody: "Elegí el momento. Nosotros te ayudamos a encontrar la mesa.",
    reserve: "Reservar una mesa",
    expand: "Ampliar fotografía",
  },
  en: {
    lead: "The evening begins before the first course.",
    leadBody: "A table by the trees, something good to start with, and time to choose a wine. At La Encontrada, small details make dinner feel personal.",
    kitchenTitle: "To start, to share, to remember.",
    kitchenBody: "Our guests describe thoughtful, generous cooking: starters to linger over, dishes with regional flavours and desserts worth their own moment.",
    menu: "Ask for today's menu",
    menuNote: "The menu may change with the season. Ask about current dishes and wines when booking.",
    firstCaption: "A glass and something to start",
    secondCaption: "Starters to share",
    thirdCaption: "A main course with its own story",
    fourthCaption: "And then, dessert",
    placeTitle: "A corner of Patagonia to slow down.",
    placeBody: "On Callejón Cerro Amigo, timber, windows and the landscape frame the table. Come for an intimate dinner or a conversation that runs a little longer.",
    outdoorCaption: "The house among the trees",
    terraceCaption: "A table outside when the day allows",
    reviewsTitle: "The best recommendation comes from another table.",
    reviewIntro: "Three experiences that say more than a rating.",
    reviewOne: "Cecilia highlighted the care from the moment she arrived, the elegant setting and the presentation of each dish. She said the owner welcomed her personally.",
    reviewTwo: "Felipe remembered the complimentary soup, empanadas, trout, lamb humita and two desserts. He also praised the kind service throughout his visit.",
    reviewThree: "Elio remembered venison goulash, trout and a tasting of Patagonian wines. He also praised Mercedes's hospitality and the atmosphere.",
    reviewSource: "Review on Google Maps",
    reviewsLink: "Read the full reviews",
    checked: "Checked on November 5, 2026",
    closingTitle: "The next good table could be yours.",
    closingBody: "Choose your moment. We'll help you find a table.",
    reserve: "Reserve a table",
    expand: "Enlarge photograph",
  },
} as const;

const stories = [
  { author: "Cecilia Moll", quote: "la atención cálida y profesional", description: "reviewOne" },
  { author: "Felipe Paleo", quote: "La comida es excelente", description: "reviewTwo" },
  { author: "Elio Cavalieri", quote: "la cata de excelentes vinos de bodegas de la Patagonia", description: "reviewThree" },
] as const;

export default function NightStory({ lang, onPhoto, onReserve, menuUrl }: { lang: "es" | "en"; onPhoto: (index: number) => void; onReserve: () => void; menuUrl: string }) {
  const t = nightCopy[lang];
  const photo = (index: number, className: string, caption: string) => (
    <figure className={className} key={index}>
      <button className={styles.photoButton} onClick={() => onPhoto(index)} aria-label={`${t.expand}: ${restaurantPhotos[index][lang]}`}>
        <Image src={restaurantPhotos[index].src} alt={restaurantPhotos[index][lang]} fill sizes="(max-width: 760px) 100vw, 55vw" />
        <span className={styles.expandIcon} aria-hidden="true"><Plus size={20} /></span>
      </button>
      <figcaption>{caption}</figcaption>
    </figure>
  );

  return <>
    <section className={styles.nightPrelude} aria-labelledby="night-lead">
      <h2 id="night-lead">{t.lead}</h2>
      <p>{t.leadBody}</p>
      <span className={styles.nightRule} aria-hidden="true" />
    </section>

    <section id="cocina" className={styles.nightKitchen} aria-labelledby="night-kitchen-title">
      <div className={styles.nightSectionHead}>
        <h2 id="night-kitchen-title">{t.kitchenTitle}</h2>
        <div><p>{t.kitchenBody}</p><a href={menuUrl} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{t.menu}<ArrowUpRight size={17} /></a></div>
      </div>
      <div className={styles.nightFoodGrid}>
        {photo(4, styles.nightFoodFirst, t.firstCaption)}
        {photo(3, styles.nightFoodSecond, t.secondCaption)}
        {photo(1, styles.nightFoodThird, t.thirdCaption)}
        {photo(2, styles.nightFoodFourth, t.fourthCaption)}
      </div>
      <p className={styles.nightMenuNote}>{t.menuNote}</p>
    </section>

    <section id="lugar" className={styles.nightPlace} aria-labelledby="night-place-title">
      <div className={styles.nightPlaceText}>
        <h2 id="night-place-title">{t.placeTitle}</h2>
        <p>{t.placeBody}</p>
      </div>
      <div className={styles.nightPlacePhotos}>
        {photo(6, styles.nightOutside, t.outdoorCaption)}
        {photo(5, styles.nightTerrace, t.terraceCaption)}
      </div>
    </section>

    <section className={styles.nightReviews} aria-labelledby="night-reviews-title">
      <div className={styles.nightReviewsHead}>
        <h2 id="night-reviews-title">{t.reviewsTitle}</h2>
        <div className={styles.nightReviewsMeta}><p>{t.reviewIntro}</p><a href={RESTAURANT_INFO.mapsUrl} target="_blank" rel="noopener noreferrer"><Star size={17} fill="currentColor" />{experienceCopy[lang].rating}<ArrowUpRight size={16} /></a><small>{t.checked}</small></div>
      </div>
      <div className={styles.nightReviewList}>
        {stories.map((story) => <figure key={story.author}>
          <div><blockquote lang="es">“{story.quote}”</blockquote><p>{t[story.description]}</p></div>
          <figcaption><strong>{story.author}</strong><span>{t.reviewSource}</span></figcaption>
        </figure>)}
      </div>
      <a href={RESTAURANT_INFO.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{t.reviewsLink}<ArrowUpRight size={17} /></a>
    </section>

    <section className={styles.nightClosing} aria-labelledby="night-closing-title">
      <div className={styles.nightClosingPhoto}><Image src={restaurantPhotos[0].src} alt={restaurantPhotos[0][lang]} fill sizes="100vw" /></div>
      <div><h2 id="night-closing-title">{t.closingTitle}</h2><p>{t.closingBody}</p><button className={styles.button} onClick={onReserve}>{t.reserve}<ArrowUpRight size={18} /></button></div>
    </section>
  </>;
}
