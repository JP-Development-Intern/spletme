import { useEffect, useRef, useState } from "react";
import { Disc3, ChevronDown } from "lucide-react";
import { SongAlbumsBreakdown } from "./SongAlbumsBreakdown";
import { albumHref } from "@/utils/music.utils";
import type { SongAlbum } from "@/types/music.types";

interface SongAlbumsChipProps {
  albums: SongAlbum[];
  loading?: boolean;
  /** UPC guardado en la canción; sirve de enlace mientras no hay hechos con álbum. */
  fallbackUpc?: string | null;
}

/**
 * Dónde vive la canción, en la línea de identidad de la cabecera.
 *
 * El nombre de un álbum sólo es fiable cuando hay uno. En cuanto la canción sale
 * bajo varios UPC, enseñar el primero es mentir por omisión, así que el nombre
 * deja paso a un contador que se despliega.
 */
export function SongAlbumsChip({ albums, loading, fallbackUpc }: SongAlbumsChipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const identified = albums.filter((album) => Boolean(album.albumId));

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (loading && albums.length === 0) {
    return <span className="h-[26px] w-[104px] animate-pulse rounded-full bg-white/[0.08]" />;
  }

  // Un solo álbum: se puede nombrar, así que se nombra.
  if (identified.length === 1) {
    const album = identified[0];
    return (
      <a
        href={albumHref(album.upc)}
        className="flex items-center gap-1.5 font-medium text-[#FF8A3D] transition-colors hover:text-[#FFB48A]"
      >
        <Disc3 className="h-3.5 w-3.5" />
        <span className="max-w-[220px] truncate">{album.albumTitle ?? "Ver álbum"}</span>
      </a>
    );
  }

  // Sin hechos atribuidos todavía: queda el UPC de la canción, si lo hay.
  if (identified.length === 0) {
    if (fallbackUpc) {
      return (
        <a
          href={albumHref(fallbackUpc)}
          className="flex items-center gap-1.5 font-medium text-[#FF8A3D] transition-colors hover:text-[#FFB48A]"
        >
          <Disc3 className="h-3.5 w-3.5" />
          Ver álbum
        </a>
      );
    }
    return <span className="text-white/50">Sin lanzamiento asignado</span>;
  }

  return (
    <span ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-[5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
          open ? "bg-[#F7EDE6]/[0.92]" : "bg-white/[0.08] hover:bg-white/[0.14]"
        }`}
      >
        <Disc3 className={`h-3 w-3 ${open ? "text-[#1C1D22]" : "text-white/70"}`} />
        <span className={`text-[12.5px] font-semibold ${open ? "text-[#1C1D22]" : "text-white"}`}>
          En {identified.length} álbumes
        </span>
        <ChevronDown
          className={`h-[11px] w-[11px] transition-transform ${
            open ? "rotate-180 text-[#1C1D22]" : "text-white/70"
          }`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Álbumes de esta canción"
          className="glass-menu absolute left-0 top-[calc(100%+8px)] z-30 w-[340px] overflow-hidden rounded-[20px] sm:w-[380px]"
        >
          <div className="flex flex-col gap-[3px] px-4 py-3.5">
            <p className="text-[13.5px] font-semibold text-white">
              Esta canción está en {identified.length} álbumes
            </p>
            <p className="text-[11px] text-white/50">Ordenados por lo que aportan al total</p>
          </div>
          <div className="h-px bg-white/[0.09]" />

          <SongAlbumsBreakdown albums={albums} />
        </div>
      )}
    </span>
  );
}
