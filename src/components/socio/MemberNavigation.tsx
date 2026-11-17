"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, Gift, House, Trophy } from "lucide-react";
import styles from "./member.module.css";

const items: Array<{ href: string; label: string; description?: string; icon: typeof House }> = [
  { href: "/socio/dashboard", label: "Inicio", icon: House },
  { href: "/socio/premios", label: "Canjes", description: "Canjeá tus puntos", icon: Gift },
  { href: "/socio/historial", label: "Visitas", icon: Clock3 },
  { href: "/socio/ranking", label: "Ranking", icon: Trophy },
];

export default function MemberNavigation({ preview = false }: { preview?: boolean }) {
  const pathname = usePathname();
  return <nav className={styles.memberNav} aria-label="Secciones del club de socios"><div className={styles.memberNavInner}>
    {items.map(({ href, label, description, icon: Icon }) => <Link key={href} href={preview ? (href === "/socio/dashboard" ? "/propuestas/socios" : "/socio/login") : href} aria-label={description || label} aria-current={pathname === href || (preview && href === "/socio/dashboard") ? "page" : undefined}><Icon size={20} aria-hidden="true" /><span>{label}</span></Link>)}
  </div></nav>;
}
