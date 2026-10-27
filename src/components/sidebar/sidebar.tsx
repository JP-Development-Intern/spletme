import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  AudioWaveform,
  House,
  LibraryBig,
  Handshake,
  Users,
  Tag,
  BarChart2,
  Wallet,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof House;
  /** Marca activo también en las rutas hijas, no solo en la exacta. */
  matchNested?: boolean;
}

interface NavGroup {
  /** Rótulo de la sección. Sin él, el grupo va suelto arriba o al pie. */
  title?: string;
  items: NavItem[];
}

/**
 * La navegación va agrupada por para qué sirve cada cosa: primero el catálogo,
 * después lo que se gestiona alrededor de él. Los rótulos hacen de separador y
 * evitan una lista plana de ocho destinos sin jerarquía.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ to: "/panel/home", label: "Inicio", icon: House }],
  },
  {
    title: "MÚSICA",
    items: [
      { to: "/panel/music", label: "Música", icon: LibraryBig, matchNested: true },
    ],
  },
  {
    title: "GESTIÓN",
    items: [
      { to: "/panel/dealers", label: "Distribuidores", icon: Handshake, matchNested: true },
      { to: "/panel/collaborators", label: "Colaboradores", icon: Users, matchNested: true },
      { to: "/panel/labels", label: "Sellos", icon: Tag, matchNested: true },
      { to: "/panel/analytics", label: "Analíticas", icon: BarChart2 },
      { to: "/panel/wallet", label: "Banco", icon: Wallet },
    ],
  },
  {
    items: [{ to: "/panel/profile", label: "Ajustes", icon: Settings }],
  },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const close = () => setIsMobileMenuOpen(false);
  const [mainGroups, settingsGroup] = [NAV_GROUPS.slice(0, -1), NAV_GROUPS[NAV_GROUPS.length - 1]];

  return (
    <>
      {/* Acceso al menú en móvil, donde el panel va oculto */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Abrir menú"
        className="glass-control fixed left-4 top-[34px] z-50 rounded-2xl p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 lg:hidden"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#140C08]/60 lg:hidden" onClick={close} />
      )}

      {/* Panel de vidrio flotante, separado 16px de los bordes de la ventana */}
      <aside
        className={`glass fixed bottom-4 left-4 top-4 z-40 flex w-[240px] flex-col gap-[26px] overflow-y-auto rounded-[30px] px-4 pb-[18px] pt-[22px] transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-[calc(100%+16px)] lg:translate-x-0"
        }`}
      >
        {/* Marca */}
        <div className="flex flex-shrink-0 items-center justify-between">
          <NavLink to="/panel/home" onClick={close} className="flex items-center gap-2.5 px-1.5">
            <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[11px] bg-[#FF5C00]">
              <AudioWaveform className="h-[18px] w-[18px] text-white" />
            </span>
            <span className="font-display text-[21px] font-semibold tracking-[-0.01em] text-white">
              splitme
            </span>
          </NavLink>

          <button
            onClick={close}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegación: Ajustes queda al pie, separado de los destinos de trabajo */}
        <nav className="flex flex-1 flex-col gap-[26px]">
          {mainGroups.map((group, index) => (
            <NavSection key={group.title ?? `group-${index}`} group={group} onNavigate={close} />
          ))}
          <div className="mt-auto">
            <NavSection group={settingsGroup} onNavigate={close} />
          </div>
        </nav>
      </aside>
    </>
  );
}

/** Grupo de destinos con su rótulo opcional. */
function NavSection({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      {group.title && (
        <span className="px-3.5 pb-1.5 pt-1 text-[10.5px] font-medium tracking-[1.4px] text-white/50">
          {group.title}
        </span>
      )}
      {group.items.map((item) => (
        <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

/**
 * Enlace del sidebar. El destino activo va en crema, como lo destacado en el
 * resto del panel: se reconoce de un vistazo sin recorrer la lista.
 */
function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const { to, label, icon: Icon, matchNested } = item;

  return (
    <NavLink
      to={to}
      end={!matchNested}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
          isActive ? "bg-[#F7EDE6]/[0.92]" : "hover:bg-white/[0.07]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? "text-[#FF5C00]" : "text-white/70"}`}
          />
          <span
            className={`text-[13.5px] ${
              isActive ? "font-semibold text-[#1C1D22]" : "font-medium text-white/80"
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
