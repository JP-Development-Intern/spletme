/**
 * Luz ambiental del panel: el fondo cálido sobre el que se apoya el vidrio.
 * Son degradados radiales y no filtros de desenfoque, que costarían en cada
 * repintado; la capa es fija, así que no se mueve al hacer scroll.
 *
 * Posiciones y opacidades tomadas del diseño (grupo «Luz ambiental» en Figma),
 * pasadas a proporciones del viewport.
 */
const LIGHTS: { color: string; left: string; top: string; width: number; height: number }[] = [
  // Brasa: la luz principal, arriba a la izquierda, detrás del saludo.
  { color: "rgba(255, 92, 0, 0.46)", left: "24%", top: "1%", width: 980, height: 880 },
  // Ámbar: lámpara cálida a la derecha.
  { color: "rgba(255, 176, 103, 0.34)", left: "88%", top: "22%", width: 940, height: 840 },
  // Ascua: rojo profundo abajo a la derecha.
  { color: "rgba(138, 42, 14, 0.6)", left: "85%", top: "74%", width: 1060, height: 900 },
  // Rosa humo abajo a la izquierda.
  { color: "rgba(232, 143, 165, 0.2)", left: "38%", top: "80%", width: 900, height: 780 },
  // Reflejo de la lámpara en la esquina.
  { color: "rgba(255, 176, 103, 0.32)", left: "97%", top: "-3%", width: 360, height: 360 },
];

export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#140C08]">
      {LIGHTS.map((light, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: light.left,
            top: light.top,
            width: light.width,
            height: light.height,
            background: `radial-gradient(closest-side, ${light.color}, transparent)`,
          }}
        />
      ))}
    </div>
  );
}
