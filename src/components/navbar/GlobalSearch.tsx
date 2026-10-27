import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Music, Disc3, Users, Tag, Loader2, X } from "lucide-react";
import useGlobalSearch from "../../hooks/useGlobalSearch";
import type {
  SearchAlbumResult,
  SearchCollaboratorResult,
  SearchLabelResult,
  SearchSongResult,
} from "../../services/search";

/** Nombre completo del colaborador con fallback a username/email */
const collaboratorName = (c: SearchCollaboratorResult) =>
  [c.name, c.lastName].filter(Boolean).join(" ") || c.username || c.email || "Colaborador";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

/** Sección del dropdown con encabezado de categoría */
const Section = ({ title, children }: SectionProps) => (
  <div className="py-1">
    <span className="block px-4 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-white/50">
      {title}
    </span>
    {children}
  </div>
);

interface ResultItemProps {
  icon: React.ReactNode;
  primary: string;
  secondary?: string;
  onClick: () => void;
}

/** Fila de resultado: ícono + texto principal + texto secundario */
const ResultItem = ({ icon, primary, secondary, onClick }: ResultItemProps) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-white/[0.08]"
  >
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C00]/20 text-[#FF8A4C]">
      {icon}
    </span>
    <span className="flex min-w-0 flex-col leading-tight">
      <span className="truncate text-[13px] font-medium text-white">{primary}</span>
      {secondary && <span className="truncate text-[11px] text-white/50">{secondary}</span>}
    </span>
  </button>
);

/**
 * Buscador global del header: busca canciones (nombre/ISRC), álbumes
 * (nombre/UPC), colaboradores (nombre/email) y sellos (nombre), y muestra
 * los resultados agrupados en un dropdown navegable.
 */
export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, loading, hasResults, isActive } = useGlobalSearch(query);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const goTo = (path: string) => {
    close();
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = open && isActive;

  return (
    <div ref={containerRef} className="relative hidden md:block md:w-[220px] xl:w-[300px]">
      <div className="glass-control flex h-11 items-center gap-2.5 rounded-full px-4 focus-within:ring-2 focus-within:ring-[#FF5C00]/60">
        <Search className="h-4 w-4 flex-shrink-0 text-white/70" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar canciones, álbumes, colaboradores…"
          className="w-full truncate border-none bg-transparent p-0 text-[12.5px] text-white outline-none placeholder:text-white/50 focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none"
        />
        {loading && isActive ? (
          <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-[#FF5C00]" />
        ) : (
          query.length > 0 && (
            <button onClick={close} className="flex-shrink-0 text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {showDropdown && (
        <div className="glass-menu absolute left-0 top-[calc(100%+10px)] z-30 max-h-[70vh] w-[360px] max-w-[90vw] overflow-y-auto rounded-[22px] py-2">
          {!hasResults && !loading && (
            <div className="px-4 py-6 text-center text-[13px] text-white/50">
              Sin resultados para «{query.trim()}»
            </div>
          )}

          {!hasResults && loading && (
            <div className="px-4 py-6 text-center text-[13px] text-white/50">Buscando…</div>
          )}

          {results.songs.length > 0 && (
            <Section title="Canciones">
              {results.songs.map((song: SearchSongResult) => (
                <ResultItem
                  key={song._id}
                  icon={<Music className="h-4 w-4" />}
                  primary={song.trackTitle}
                  secondary={[song.artistName, song.isrc && `ISRC ${song.isrc}`]
                    .filter(Boolean)
                    .join(" · ")}
                  onClick={() => goTo(`/panel/song/${song._id}`)}
                />
              ))}
            </Section>
          )}

          {results.albums.length > 0 && (
            <Section title="Álbumes">
              {results.albums.map((album: SearchAlbumResult) => (
                <ResultItem
                  key={album._id}
                  icon={<Disc3 className="h-4 w-4" />}
                  primary={album.albumTitle}
                  secondary={[album.artistName, album.upc && `UPC ${album.upc}`]
                    .filter(Boolean)
                    .join(" · ")}
                  onClick={() =>
                    goTo(album.upc ? `/panel/album/upc/${album.upc}` : `/panel/album/${album._id}`)
                  }
                />
              ))}
            </Section>
          )}

          {results.collaborators.length > 0 && (
            <Section title="Colaboradores">
              {results.collaborators.map((collab: SearchCollaboratorResult) => (
                <ResultItem
                  key={collab._id}
                  icon={<Users className="h-4 w-4" />}
                  primary={collaboratorName(collab)}
                  secondary={collab.email}
                  onClick={() => goTo(`/panel/collaborators/${collab._id}`)}
                />
              ))}
            </Section>
          )}

          {results.labels.length > 0 && (
            <Section title="Sellos">
              {results.labels.map((label: SearchLabelResult) => (
                <ResultItem
                  key={`${label.type}-${label._id ?? label.name}`}
                  icon={<Tag className="h-4 w-4" />}
                  primary={label.name}
                  secondary={label.type === "custom" ? "Sello personalizado" : "Sello artístico"}
                  onClick={() =>
                    goTo(
                      label.type === "custom"
                        ? `/panel/labels/custom/${encodeURIComponent(label.name)}`
                        : `/panel/labels/${encodeURIComponent(label.name)}`,
                    )
                  }
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
