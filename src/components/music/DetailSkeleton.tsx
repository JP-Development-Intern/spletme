/**
 * Esqueleto de las páginas de detalle mientras llega la obra.
 *
 * Sustituye al `Loading` de pantalla completa, que tapaba el shell con una hoja
 * blanca: aquí el vidrio y la luz ambiental siguen en su sitio y solo falta el
 * contenido, con la misma anatomía que tendrá al cargar.
 */
export function DetailSkeleton({ label = "Cargando" }: { label?: string }) {
  return (
    <div
      className="flex flex-col gap-5 px-4 lg:pl-4 lg:pr-8"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex items-center gap-4">
        <span className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
        <span className="h-[72px] w-[72px] flex-shrink-0 animate-pulse rounded-[20px] bg-white/[0.08] sm:h-[88px] sm:w-[88px] sm:rounded-[22px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <span className="h-8 w-full max-w-[320px] animate-pulse rounded-full bg-white/[0.08]" />
          <span className="h-4 w-full max-w-[220px] animate-pulse rounded-full bg-white/[0.08]" />
        </div>
      </div>
      <div className="glass h-[220px] animate-pulse rounded-[28px] lg:h-[118px]" />
      <div className="flex gap-1.5">
        {[96, 128, 84, 84, 112].map((width, i) => (
          <span
            key={i}
            className="h-10 animate-pulse rounded-full bg-white/[0.08]"
            style={{ width }}
          />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-5">
        <div className="glass col-span-12 h-[420px] animate-pulse rounded-[28px] xl:col-span-8" />
        <div className="glass col-span-12 h-[420px] animate-pulse rounded-[28px] xl:col-span-4" />
      </div>
    </div>
  );
}
