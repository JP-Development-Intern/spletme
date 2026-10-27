import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Globe, Bell, ChevronDown, User, Users, UserPlus, LogOut } from "lucide-react";
import LocalStorageService from "../../services/localstorage";
import { AuthService } from "@/services/auth";
import GlobalSearch from "./GlobalSearch";

interface NavbarProps {
  onSwitchUser?: () => void;
  /** Recibe el nodo donde las páginas colocan su encabezado (ver `PageHeader`). */
  headerSlotRef?: (node: HTMLDivElement | null) => void;
}

/**
 * Barra superior del panel: el encabezado de la página a la izquierda y, a la
 * derecha, buscador, idioma, notificaciones y menú de usuario (perfil, cambiar
 * usuario y cerrar sesión). No es fija: deja de verse al bajar por la página.
 */
export default function Navbar({ onSwitchUser, headerSlotRef }: NavbarProps) {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const stored = LocalStorageService.getItem("user");
  const displayName = stored?.name || user?.name || "Usuario";
  const displayEmail = stored?.email || user?.email || "";
  const initials =
    (displayName.charAt(0) || "U").toUpperCase() +
    (stored?.lastName?.charAt(0) || displayName.split(" ")[1]?.charAt(0) || "").toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await AuthService.logout();
  };

  const menuItem =
    "flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.08]";

  return (
    // En móvil los controles ocupan su propia fila (junto al botón del menú) y el
    // encabezado de la página pasa debajo, a todo el ancho.
    <header className="relative z-20 flex flex-wrap items-center gap-x-4 gap-y-6 px-4 py-8 md:flex-nowrap md:pl-16 lg:pl-4 lg:pr-8">
      <div ref={headerSlotRef} className="order-2 w-full min-w-0 md:order-none md:w-auto md:flex-1" />

      <div className="order-1 ml-auto flex flex-shrink-0 items-center gap-2.5 md:order-none">
        <GlobalSearch />

        <button className="glass-control flex h-11 items-center gap-2 rounded-full pl-3.5 pr-3 transition-colors hover:bg-white/[0.12]">
          <Globe className="h-4 w-4 text-white/70" />
          <span className="text-[12.5px] font-medium text-white">ES</span>
          <ChevronDown className="h-[13px] w-[13px] text-white/50" />
        </button>

        <button
          aria-label="Notificaciones"
          className="glass-control relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/[0.12]"
        >
          <Bell className="h-[18px] w-[18px] text-white" />
          <span className="absolute right-[9px] top-[11px] h-[9px] w-[9px] rounded-full bg-[#FF5C00]" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú de usuario"
            className="glass-control flex items-center gap-2.5 rounded-full py-[5px] pl-[5px] pr-3.5 transition-colors hover:bg-white/[0.12]"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#FF5C00] text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="hidden flex-col items-start leading-tight xl:flex">
              <span className="text-[12.5px] font-semibold text-white">{displayName}</span>
              <span className="text-[10.5px] text-white/65">Artista</span>
            </span>
            <ChevronDown className="h-[13px] w-[13px] text-white/50" />
          </button>

          {open && (
            <div className="glass-menu absolute right-0 top-[calc(100%+10px)] w-60 rounded-[22px] p-2">
              <div className="flex items-center gap-2.5 px-2.5 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5C00] text-[13px] font-semibold text-white">
                  {initials}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[12.5px] font-semibold text-white">{displayName}</span>
                  <span className="truncate text-[10.5px] text-white/50">{displayEmail}</span>
                </div>
              </div>
              <div className="my-1 h-px bg-white/10" />
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/panel/profile");
                }}
                className={menuItem}
              >
                <User className="h-[17px] w-[17px] text-white/70" />
                Mi perfil
              </button>
              {/* FUNCIONALIDAD TEMPORAL — perfiles sin cuenta. */}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/panel/placeholder-profiles");
                }}
                className={menuItem}
              >
                <UserPlus className="h-[17px] w-[17px] text-white/70" />
                Personas sin cuenta
              </button>
              {onSwitchUser && (
                <button
                  onClick={() => {
                    setOpen(false);
                    onSwitchUser();
                  }}
                  className={menuItem}
                >
                  <Users className="h-[17px] w-[17px] text-white/70" />
                  Cambiar usuario
                </button>
              )}
              <div className="my-1 h-px bg-white/10" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-[16px] bg-[#FF8A8A]/10 px-2.5 py-2.5 text-[13px] font-semibold text-[#FF8A8A] transition-colors hover:bg-[#FF8A8A]/[0.16]"
              >
                <LogOut className="h-[17px] w-[17px]" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
