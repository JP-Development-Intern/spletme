/** Texto de los campos de acceso sobre el vidrio. `auth-input` neutraliza el autocompletado (index.css). */
export const AUTH_INPUT_CLASS =
  "auth-input w-full border-0 bg-transparent p-0 text-[13.5px] text-white placeholder:text-white/40 focus:border-0 focus:outline-none focus:ring-0 disabled:text-white/50";

/** Enlace de texto sobre el vidrio de acceso (Regístrate, ¿Olvidaste tu contraseña?…). */
export const AUTH_LINK_CLASS =
  "font-semibold text-[#FF8A3D] transition-colors hover:text-[#FFB48A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70";

/** Botón principal de las pantallas de acceso. */
export const AUTH_SUBMIT_CLASS =
  "mt-1 flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#FF5C00] text-[14.5px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(255,92,0,0.6)] transition-colors hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-75 disabled:shadow-none";

/** Botón principal cuando aún no se puede pulsar (falta elegir o completar algo). */
export const AUTH_SUBMIT_IDLE_CLASS =
  "mt-1 flex h-[50px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/[0.08] text-[14.5px] font-semibold text-white/40";

/** Botón secundario (Atrás) dentro de la tarjeta. Sin desenfoque: dentro del vidrio solo vería el panel. */
export const AUTH_SECONDARY_CLASS =
  "mt-1 flex h-[50px] flex-shrink-0 items-center justify-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.06] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:text-white/40";

/** Opción elegible (tarjeta o pastilla) dentro de la tarjeta de acceso. */
export const authChoiceClass = (selected: boolean) =>
  `border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
    selected
      ? "border-[#FF8A3D]/70 bg-[#FF5C00]/[0.16]"
      : "border-white/[0.14] bg-white/[0.05] hover:border-white/[0.24] hover:bg-white/[0.09]"
  }`;
