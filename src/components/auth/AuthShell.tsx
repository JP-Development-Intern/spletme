import { CircleAlert, CreditCard, Eye, EyeOff, Send, ShieldCheck } from "lucide-react";
import { SplitmeLogo } from "@/components/brand/SplitmeLogo";
import { AuthBackdrop } from "./AuthBackdrop";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Conexión segura" },
  { icon: CreditCard, label: "Stripe" },
  { icon: Send, label: "Wise" },
];

interface AuthShellProps {
  /** Sin título, la página pone el suyo (el onboarding lo cambia en cada paso). */
  title?: string;
  subtitle?: string;
  /** Tarjeta más ancha, para formularios a dos columnas. */
  wide?: boolean;
  /** Lo que va justo debajo de la tarjeta, antes del pie (p. ej. cerrar sesión). */
  belowCard?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Armazón de las pantallas de acceso: el fondo con las barras del símbolo, la
 * tarjeta de vidrio con el logo y el título, y el pie con las insignias de
 * confianza y el crédito. Login y registro son páginas distintas que lo
 * comparten, así que se ven idénticas sin duplicar el diseño.
 */
export function AuthShell({ title, subtitle, wide = false, belowCard, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <AuthBackdrop />

      {/*
        El formulario en una tarjeta de vidrio que desenfoca las barras que
        pasan por detrás. La entrada se anima sobre el propio vidrio: una
        opacidad en un antepasado anularía el desenfoque.
      */}
      <main
        className={`glass flex w-full flex-col items-center gap-6 rounded-[32px] bg-white/[0.08] px-6 py-9 transition-[max-width] duration-300 motion-safe:duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 sm:rounded-[36px] sm:px-10 sm:py-11 ${
          wide ? "max-w-[420px] sm:max-w-[600px]" : "max-w-[420px] sm:max-w-[440px]"
        }`}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <SplitmeLogo variant="wordmark" className="h-7 text-white" />
          {title && <AuthHeading title={title} subtitle={subtitle} />}
        </div>

        {children}
      </main>

      {belowCard}

      <footer className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="glass-control flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-white/70"
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>
        <p className="text-[11.5px] text-white/50">
          Desarrollado por{" "}
          <a
            href="https://jpdev.com.co"
            target="_blank"
            rel="noopener"
            className="font-semibold text-white/75 transition-colors hover:text-white"
          >
            JP Development
          </a>
        </p>
      </footer>
    </div>
  );
}

/** Título de una pantalla de acceso: el del armazón, o el de cada paso del onboarding. */
export function AuthHeading({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <h1 className="font-display text-[30px] font-light leading-[1.1] tracking-[-0.015em] text-white">{title}</h1>
      {subtitle && <p className="text-[13px] leading-relaxed text-white/65">{subtitle}</p>}
    </div>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Campo con etiqueta visible, icono y mensaje de error anclado debajo, sobre vidrio. */
export function AuthField({ id, label, icon, error, action, children }: AuthFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="pl-1 text-[12px] font-semibold text-white/80">
        {label}
      </label>
      <div
        className={`flex h-[48px] items-center gap-3 rounded-2xl border pl-4 pr-1.5 transition-colors ${
          error
            ? "border-[#FF8F92]/80 bg-black/[0.22] ring-[3px] ring-[#E5484D]/20"
            : "border-white/[0.16] bg-black/[0.22] focus-within:border-[#FF8A3D] focus-within:ring-[3px] focus-within:ring-[#FF5C00]/25"
        }`}
      >
        {icon && <span className={`flex-shrink-0 ${error ? "text-[#FF8F92]" : "text-white/50"}`}>{icon}</span>}
        {children}
        {action}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-2 rounded-[13px] bg-[#E5484D]/[0.16] px-3 py-2 text-[11.5px] leading-snug text-[#FFB3B5]"
        >
          <CircleAlert className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Botón de mostrar u ocultar una contraseña, dentro de su campo. */
export function PasswordToggle({
  visible,
  onToggle,
  disabled,
}: {
  visible: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
    >
      {visible ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
    </button>
  );
}
