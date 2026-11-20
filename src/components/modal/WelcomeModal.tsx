import { useId } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BarChart2, SplitSquareHorizontal, Wallet, Users, Globe, ShieldCheck, ArrowRight } from "lucide-react";
import { SplitmeLogo } from "@/components/brand/SplitmeLogo";
import { AUTH_SUBMIT_CLASS } from "@/components/auth/authStyles";

interface WelcomeModalProps {
  isOpen: boolean;
  userName?: string;
  onContinue: () => void;
}

/**
 * Lo que se puede hacer en Splitme. Todos los iconos van en brasa: antes cada
 * uno llevaba un color distinto, y en el vidrio el naranja es el único acento.
 */
const BENEFITS = [
  {
    Icon: BarChart2,
    title: "Seguimiento de streams",
    desc: "Monitorea tus reproducciones en Spotify, Apple Music, YouTube y más plataformas desde un solo lugar.",
  },
  {
    Icon: SplitSquareHorizontal,
    title: "División de regalías",
    desc: "Divide automáticamente los pagos entre artistas, productores y colaboradores con porcentajes exactos.",
  },
  {
    Icon: Wallet,
    title: "Billetera digital",
    desc: "Gestiona tus ingresos, solicita retiros y mantén un historial claro de todos tus pagos.",
  },
  {
    Icon: Users,
    title: "Gestión de colaboradores",
    desc: "Agrega productores, compositores y labels a tus proyectos y controla quién tiene acceso a qué.",
  },
  {
    Icon: Globe,
    title: "Análisis por país y plataforma",
    desc: "Visualiza de dónde vienen tus reproducciones e ingresos con gráficas detalladas.",
  },
  {
    Icon: ShieldCheck,
    title: "Historial y trazabilidad",
    desc: "Cada cambio en los splits queda registrado. Transparencia total para ti y tus colaboradores.",
  },
];

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Bienvenida tras crear la cuenta, en el vidrio de las pantallas de acceso.
 *
 * El telón y el panel son hermanos, no padre e hijo: el telón hace su fundido
 * por su cuenta y la entrada se anima sobre el propio panel. Si el panel
 * estuviera dentro de un contenedor animando su opacidad, ese contenedor se
 * volvería «backdrop root» y el desenfoque del vidrio aparecería de golpe al
 * final de la animación.
 */
export function WelcomeModal({ isOpen, userName, onContinue }: WelcomeModalProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const firstName = userName?.trim().split(" ")[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="welcome"
          className="fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 py-8"
          initial={{ visibility: "visible" }}
          exit={{ visibility: "visible" }}
        >
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 bg-[#0B0604]/[0.62] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="glass-menu relative my-auto flex w-full max-w-[560px] flex-col gap-6 rounded-[32px] px-6 py-8 sm:px-9 sm:py-9"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <SplitmeLogo variant="wordmark" className="h-6 text-white" />
              <div className="flex flex-col gap-1.5">
                <h2
                  id={titleId}
                  className="font-display text-[30px] font-light leading-[1.1] tracking-[-0.015em] text-white"
                >
                  ¡Bienvenido{firstName ? `, ${firstName}` : ""}!
                </h2>
                <p className="text-[13px] leading-relaxed text-white/65">
                  Tu cuenta fue creada. Esto es lo que puedes hacer en Splitme:
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {BENEFITS.map(({ Icon, title, desc }, i) => (
                <motion.li
                  key={title}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.05, ease: EASE_OUT }}
                  // Sin desenfoque propio: dentro del vidrio solo vería el panel.
                  className="flex items-start gap-3 rounded-[18px] border border-white/[0.1] bg-white/[0.05] p-3.5"
                >
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-[#FF5C00]/[0.16]">
                    <Icon className="h-[17px] w-[17px] text-[#FF8A3D]" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold leading-snug text-white">{title}</span>
                    <span className="text-[11.5px] leading-relaxed text-white/60">{desc}</span>
                  </span>
                </motion.li>
              ))}
            </ul>

            <button type="button" autoFocus onClick={onContinue} className={AUTH_SUBMIT_CLASS}>
              Ir a iniciar sesión
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
