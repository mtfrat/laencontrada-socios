import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, MessageSquare, UtensilsCrossed } from "lucide-react";
import StaffLogoutButton from "./StaffLogoutButton";

type HeaderAction = {
  href: string;
  label: string;
  icon: "chat" | "panel" | "terminal";
};

const actionIcons = {
  chat: MessageSquare,
  panel: LayoutDashboard,
  terminal: UtensilsCrossed,
};

export default function StaffHeader({
  title,
  name,
  role,
  backHref,
  actions = [],
}: {
  title: string;
  name: string;
  role: "Administrador" | "Equipo";
  backHref?: string;
  actions?: HeaderAction[];
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#d7c9bb] bg-[#f5f0e7] text-[#352b2b]">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {backHref && (
            <Link href={backHref} aria-label="Volver al panel" title="Volver al panel" className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#d7c9bb] bg-[#fffaf3] text-[#54262d] hover:bg-[#e9dfd1]">
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
          )}
          <Image src="/logo.png" alt="La Encontrada" width={34} height={34} className="size-8 shrink-0 object-contain sm:size-9" />
          <div className="min-w-0">
            <p className="truncate font-serif text-lg leading-tight text-[#54262d] sm:text-xl">{title}</p>
            <p className="truncate text-[11px] leading-tight text-[#725f55] sm:text-xs">{role} · {name}</p>
          </div>
        </div>

        <nav aria-label="Acciones del equipo" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {actions.map(({ href, label, icon }) => {
            const Icon = actionIcons[icon];
            return (
              <Link key={href} href={href} title={label} aria-label={label} className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-md border border-[#d7c9bb] bg-[#fffaf3] px-2 text-[#54262d] transition hover:bg-[#e9dfd1] sm:px-3">
                <Icon size={17} aria-hidden="true" />
                <span className="hidden text-xs font-medium sm:inline">{label}</span>
              </Link>
            );
          })}
          <StaffLogoutButton />
        </nav>
      </div>
    </header>
  );
}
