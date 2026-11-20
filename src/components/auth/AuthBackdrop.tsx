import AmbientBackground from "@/components/layout/AmbientBackground";

/**
 * Las formas salen del símbolo de Splitme: la «E» son tres barras con el
 * extremo derecho cortado en diagonal. En el vector del logo cada barra mide
 * 24,15 × 6,89 y el corte retrocede 3,34 en ese alto, así que el corte avanza
 * 0,485 por cada unidad de alto y la barra es unas 3,5 veces más larga que alta.
 */
const CUT = 0.485;
const RATIO = 3.5;

const TONES = {
  // Luz desde arriba: brillo crema en el canto superior, cuerpo de la paleta y
  // el canto inferior cayendo a la noche. Es lo que les da volumen de pieza
  // biselada y no de recorte plano.
  ember: "linear-gradient(180deg, #FFE3C2 0%, #FFB067 16%, #FF7A1F 48%, #C2410C 82%, #4A1504 100%)",
  amber: "linear-gradient(180deg, #FFF1D6 0%, #FFD08A 18%, #FFB067 48%, #D9772A 82%, #5A2A0A 100%)",
  ash: "linear-gradient(180deg, #FFC9A8 0%, #E86A3A 26%, #8A2A0E 72%, #2A0C04 100%)",
};

type Shape = {
  left: string;
  top: string;
  /** Largo de la barra en un escritorio de 1440 px. */
  length: number;
  /** Giro en grados. */
  angle: number;
  tone: keyof typeof TONES;
  /** Tres barras paralelas: el símbolo entero. */
  mark?: boolean;
  far?: boolean;
  drift: number;
  duration: number;
  delay: number;
  /** Solo desde md: en móvil saturarían la pantalla. */
  desktopOnly?: boolean;
};

const SHAPES: Shape[] = [
  // El símbolo grande, asomando por detrás del panel a la derecha: es lo que más
  // se ve a través del vidrio.
  { left: "70%", top: "60%", length: 460, angle: -18, tone: "ember", mark: true, drift: 16, duration: 20, delay: -6 },
  // Barras sueltas, cada una con su giro
  { left: "27%", top: "22%", length: 340, angle: 24, tone: "amber", drift: 14, duration: 16, delay: 0 },
  { left: "22%", top: "86%", length: 380, angle: -32, tone: "ash", drift: 12, duration: 18, delay: -3 },
  { left: "55%", top: "8%", length: 170, angle: -12, tone: "amber", drift: 10, duration: 13, delay: -2 },
  { left: "13%", top: "58%", length: 150, angle: 58, tone: "ember", drift: 10, duration: 15, delay: -8, desktopOnly: true },
  { left: "88%", top: "26%", length: 110, angle: 36, tone: "amber", drift: 8, duration: 12, delay: -4, desktopOnly: true },
  // Lejanas y desenfocadas: fondo sin competir con el formulario
  { left: "90%", top: "86%", length: 300, angle: 70, tone: "ash", far: true, drift: 8, duration: 22, delay: -10, desktopOnly: true },
  { left: "6%", top: "10%", length: 260, angle: -40, tone: "ember", far: true, drift: 8, duration: 24, delay: -5, desktopOnly: true },
];

/** Una barra con el extremo derecho cortado como las de la «E». */
function Bar({ length, tone }: { length: string; tone: keyof typeof TONES }) {
  return (
    <span
      className="block"
      style={{
        width: length,
        aspectRatio: `${RATIO}`,
        backgroundImage: TONES[tone],
        // El corte: arriba llega al final, abajo se queda un `CUT` del alto antes.
        clipPath: `polygon(0 0, 100% 0, calc(100% - ${(CUT / RATIO) * 100}%) 100%, 0 100%)`,
      }}
    />
  );
}

/**
 * Fondo de las pantallas de acceso: la luz ambiental del panel y las barras del
 * símbolo de Splitme flotando detrás del vidrio, que las desenfoca al pasar.
 *
 * Son degradados recortados, no imágenes: pesan nada y escalan sin pixelarse.
 * Flotan con una animación de `transform` (no repinta) y se quedan quietas con
 * «reducir movimiento».
 */
export function AuthBackdrop() {
  return (
    <>
      <AmbientBackground />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {SHAPES.map((shape, i) => {
          // A tamaño completo en 1440 px y a poco más de la mitad en móvil.
          const length = `clamp(${Math.round(shape.length * 0.55)}px, ${(shape.length / 14.4).toFixed(2)}vw, ${shape.length}px)`;
          return (
            <span
              key={i}
              className={`float-shape absolute ${shape.desktopOnly ? "hidden md:block" : ""}`}
              style={
                {
                  left: shape.left,
                  top: shape.top,
                  "--float-drift": `${shape.drift}px`,
                  "--float-duration": `${shape.duration}s`,
                  "--float-delay": `${shape.delay}s`,
                } as React.CSSProperties
              }
            >
              {/* La sombra va en un envoltorio: en la barra la recortaría su propio clip-path */}
              <span
                className="flex flex-col"
                style={{
                  transform: `rotate(${shape.angle}deg)`,
                  // Mismo hueco que entre las barras del logo: casi su propio alto.
                  gap: shape.mark ? `calc(${length} / ${RATIO} * 1.1)` : undefined,
                  filter: shape.far
                    ? "blur(18px)"
                    : "drop-shadow(0 30px 40px rgba(10, 4, 0, 0.6))",
                  opacity: shape.far ? 0.5 : 1,
                }}
              >
                {(shape.mark ? [0, 1, 2] : [0]).map((n) => (
                  <Bar key={n} length={length} tone={shape.tone} />
                ))}
              </span>
            </span>
          );
        })}
      </div>
    </>
  );
}
