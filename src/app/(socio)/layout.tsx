import MemberNavigation from "@/components/socio/MemberNavigation";
import "@/components/socio/member-legacy.css";

export default function SocioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<MemberNavigation /></>;
}
