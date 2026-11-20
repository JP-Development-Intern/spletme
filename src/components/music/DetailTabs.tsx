export interface DetailTab<K extends string = string> {
  key: K;
  label: string;
  icon: React.ReactNode;
  /** Contador que acompaña al rótulo, si aporta algo. */
  count?: number;
}

interface DetailTabsProps<K extends string> {
  tabs: DetailTab<K>[];
  active: K;
  onChange: (key: K) => void;
}

/**
 * Pestañas de las páginas de detalle. La activa va en crema sólida en vez de un
 * subrayado: destaca sin depender del color, que es lo que se pierde cuando hay
 * cinco seguidas. Es el mismo crema que marca lo elegido en el resto del vidrio.
 */
export function DetailTabs<K extends string>({ tabs, active, onChange }: DetailTabsProps<K>) {
  return (
    <div role="tablist" aria-label="Secciones" className="flex flex-wrap items-center gap-1.5">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`flex min-h-[40px] items-center gap-2 rounded-full px-[15px] py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
              isActive ? "glass-cream" : "glass-control hover:bg-white/[0.12]"
            }`}
          >
            <span className={isActive ? "text-[#1C1D22]" : "text-white/70"}>{tab.icon}</span>
            <span
              className={`text-[12.5px] ${
                isActive ? "font-semibold text-[#1C1D22]" : "font-medium text-white/80"
              }`}
            >
              {tab.label}
            </span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`rounded-[10px] px-[7px] py-[2px] font-mono text-[10px] font-semibold ${
                  isActive ? "bg-[#1C1D22]/10 text-[#1C1D22]" : "bg-white/[0.10] text-white/70"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
