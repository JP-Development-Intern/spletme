import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface KpiTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  link: { to: string; label: string };
}

/** Cifra secundaria del panel con el acceso a la sección que la detalla. */
export function KpiTile({ icon: Icon, label, value, link }: KpiTileProps) {
  return (
    <section className="glass flex min-h-[150px] flex-1 flex-col justify-between gap-4 rounded-[28px] px-6 py-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.12]">
          <Icon className="h-[15px] w-[15px] text-white" />
        </span>
        <h2 className="text-[12.5px] font-medium text-white/70">{label}</h2>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="font-mono text-[38px] font-light leading-[42px] tracking-[-0.015em] text-white">{value}</p>
        <Link
          to={link.to}
          className="flex items-center gap-1 pb-1 text-[12.5px] font-medium text-white/70 transition-colors hover:text-white"
        >
          {link.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
