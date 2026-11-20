import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionProps,
} from "framer-motion";

/**
 * Entrada del Inicio.
 *
 * El Inicio es la pantalla que más se abre, y una coreografía que encanta la
 * primera vez estorba a la décima. Por eso hay dos intensidades: la completa,
 * la primera vez de la sesión (paneles que suben escalonados, cifras que
 * cuentan desde cero, el arco y el gráfico que se dibujan), y una corta para
 * las vueltas siguientes, que solo funde y deja contar las cifras un instante.
 * Ninguna bloquea: el contenido es clicable desde el primer fotograma.
 *
 * Con «reducir movimiento» no hay desplazamientos ni cuentas: los paneles solo
 * se funden y las cifras aparecen ya en su valor.
 */

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Clave de sesión: la coreografía completa ya se vio en esta pestaña. */
const SEEN_KEY = "splitme-home-intro-seen";
/** Lo que dura la coreografía completa; pasado esto se da por vista. */
const FULL_INTRO_MS = 1600;

interface IntroState {
  /** Coreografía completa (primera vez en la sesión) o corta. */
  full: boolean;
  reduced: boolean;
  /** Momento del montaje, para que lo que llega tarde no repita los retrasos. */
  startedAt: number;
}

const IntroContext = createContext<IntroState>({ full: false, reduced: false, startedAt: 0 });

function readSeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function DashboardIntro({ children }: { children: React.ReactNode }) {
  const reduced = Boolean(useReducedMotion());
  // Se decide una vez por montaje: cambiar de intensidad a mitad sería peor.
  const [full] = useState(() => !readSeen());
  const [startedAt] = useState(() => performance.now());

  // Se marca como vista al terminar, no al empezar: si la página se recarga
  // antes (el Inicio fuerza una recarga en la primera visita), la siguiente
  // carga vuelve a tener la entrada completa.
  useEffect(() => {
    if (!full) return;
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "true");
      } catch {
        /* sin almacenamiento, cada visita tendrá la entrada completa */
      }
    }, FULL_INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [full]);

  const value = useMemo(() => ({ full, reduced, startedAt }), [full, reduced, startedAt]);

  return (
    <IntroContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </IntroContext.Provider>
  );
}

export function useDashboardIntro() {
  return useContext(IntroContext);
}

/**
 * Retraso que le queda a algo que debía empezar `at` segundos después del
 * montaje. Lo que llega tarde (datos de la API) empieza ya, sin esperar otra vez.
 */
export function remainingDelay(startedAt: number, at: number): number {
  const elapsed = (performance.now() - startedAt) / 1000;
  return Math.max(0, at - elapsed);
}

/**
 * Props de entrada para un panel. Van sobre el propio panel de vidrio y no en
 * un envoltorio: una opacidad intermedia en un antepasado aísla el
 * `backdrop-filter`, y el desenfoque aparecería de golpe al acabar el fundido.
 */
export function useReveal(at: number): MotionProps {
  const { full, reduced, startedAt } = useDashboardIntro();
  // Se calcula al montar: si el panel se vuelve a pintar, no cambia el plan.
  const delay = useRef(full ? remainingDelay(startedAt, at) : 0).current;

  if (reduced || !full) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2, ease: "easeOut" },
    };
  }
  return {
    initial: { opacity: 0, y: 18, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.55, delay, ease: EASE_OUT },
  };
}

interface CountUpProps {
  value: number;
  format: (value: number) => string;
  /** Segundos desde el montaje en los que arranca la cuenta en la entrada completa. */
  at?: number;
  /** Cuentas enteras (canciones, streams): sin decimales en los pasos intermedios. */
  integer?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Cifra que cuenta hasta su valor.
 *
 * La primera vez sube desde cero; después, cuando el valor cambia (otro
 * periodo), viaja desde el anterior, más rápido, para que se lea el cambio y no
 * otra entrada. Para el lector de pantalla solo existe el valor final.
 */
export function CountUp({ value, format, at = 0, integer = false, className, style }: CountUpProps) {
  const { full, reduced, startedAt } = useDashboardIntro();
  const motionValue = useMotionValue(reduced ? value : 0);
  const display = useTransform(motionValue, (latest) => format(integer ? Math.round(latest) : latest));
  const counted = useRef(false);

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    // Mientras no llegan los datos el valor es 0: se espera al de verdad para
    // que la cuenta de entrada no se gaste en vacío.
    if (!counted.current && value === 0) return;

    const first = !counted.current;
    counted.current = true;
    const controls = animate(motionValue, value, {
      duration: first ? (full ? 1.2 : 0.5) : 0.6,
      delay: first && full ? remainingDelay(startedAt, at) : 0,
      ease: EASE_OUT,
    });
    return () => controls.stop();
  }, [value, reduced, full, startedAt, at, motionValue]);

  return (
    <span className={className} style={style}>
      <motion.span aria-hidden="true">{display}</motion.span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
