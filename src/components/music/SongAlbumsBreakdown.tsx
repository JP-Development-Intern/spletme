import { ChevronRight } from "lucide-react";
import { formatCurrency, formatStreams } from "@/utils/format.utils";
import { albumHref } from "@/utils/music.utils";
import type { SongAlbum } from "@/types/music.types";

interface SongAlbumsBreakdownProps {
  albums: SongAlbum[];
  loading?: boolean;
  /** Sobre el vidrio oscuro del listado; la cabecera del detalle sigue en claro. */
  onGlass?: boolean;
}

/** Escala monocroma: el reparto del split ya usa un color por persona. */
const SHADES = ["#FF5C00", "#FF9257", "#FFC3A3"];
/** El gris está reservado a lo que no se sabe atribuir. */
const UNKNOWN = "#A6AAB2";

/** Los mismos papeles de color en la hoja clara y sobre el vidrio. */
const TONES = {
  light: {
    skeletonDot: "bg-[#E8E8EC]",
    skeleton: "bg-[#F4F5F7]",
    empty: "text-[#A6AAB2]",
    hover: "hover:bg-[#F4F5F7]",
    title: "text-[#1C1D22]",
    meta: "text-[#71757E]",
    money: "text-[12.5px] font-semibold text-[#1C1D22]",
    muted: "text-[#71757E]",
    faint: "text-[#A6AAB2]",
    unknownRow: "",
  },
  glass: {
    skeletonDot: "bg-white/20",
    skeleton: "bg-white/[0.08]",
    empty: "text-white/50",
    hover: "hover:bg-white/[0.06]",
    title: "text-white",
    meta: "text-white/50",
    money: "font-mono text-[13.5px] text-[#45D39A]",
    muted: "text-white/65",
    faint: "text-white/50",
    unknownRow: "bg-white/[0.03]",
  },
};

/**
 * En qué álbumes vive una canción y cuánto aporta cada uno.
 *
 * Es el contenido del desplegable, compartido por la cabecera del detalle y la
 * tabla de canciones: si el desglose cambia, cambia en los dos sitios a la vez.
 */
export function SongAlbumsBreakdown({ albums, loading, onGlass = false }: SongAlbumsBreakdownProps) {
  const t = onGlass ? TONES.glass : TONES.light;
  const identified = albums.filter((album) => Boolean(album.albumId));
  const unknown = albums.find((album) => !album.albumId);
  const total = albums.reduce((sum, album) => sum + (album.netIncome ?? 0), 0);

  if (loading && albums.length === 0) {
    return (
      <ul className="flex flex-col gap-[2px] p-2">
        {[0, 1].map((i) => (
          <li key={i} className="flex items-center gap-2.5 px-2.5 py-[9px]">
            <span className={`h-2 w-2 flex-shrink-0 rounded-[3px] ${t.skeletonDot}`} />
            <span className={`h-3 flex-1 animate-pulse rounded ${t.skeleton}`} />
            <span className={`h-3 w-14 animate-pulse rounded ${t.skeleton}`} />
          </li>
        ))}
      </ul>
    );
  }

  if (identified.length === 0 && !unknown) {
    return (
      <p className={`px-4 py-3.5 text-[11.5px] ${t.empty}`}>
        Todavía no hay ventas atribuidas a ningún álbum.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-[2px] p-2">
      {identified.map((album, index) => (
        <li key={album.albumId}>
          <a
            href={albumHref(album.upc)}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-[9px] transition-colors ${t.hover}`}
          >
            <span
              className="h-2 w-2 flex-shrink-0 rounded-[3px]"
              style={{ backgroundColor: SHADES[index % SHADES.length] }}
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={`truncate text-[12.5px] font-medium ${t.title}`}>
                {album.albumTitle ?? "Álbum sin título"}
              </span>
              <span className={`truncate font-mono text-[10px] ${t.meta}`}>
                {album.upc ?? "—"}
              </span>
            </span>
            <span className="flex flex-shrink-0 flex-col items-end gap-0.5">
              <span className={t.money}>
                {formatCurrency(album.netIncome ?? 0)}
              </span>
              <span className={`text-[10px] ${t.meta}`}>
                {total > 0 ? Math.round(((album.netIncome ?? 0) / total) * 100) : 0}%
              </span>
            </span>
            <ChevronRight className={`h-[13px] w-[13px] flex-shrink-0 ${t.meta}`} />
          </a>
        </li>
      ))}

      {unknown && (unknown.netIncome > 0 || unknown.streams > 0) && (
        <li className={`flex items-center gap-2.5 rounded-xl px-2.5 py-[9px] ${t.unknownRow}`}>
          <span
            className="h-2 w-2 flex-shrink-0 rounded-[3px]"
            style={{ backgroundColor: UNKNOWN }}
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className={`truncate text-[12.5px] font-medium ${t.muted}`}>
              Sin identificar
            </span>
            <span className={`truncate text-[10px] ${t.faint}`}>
              {formatStreams(unknown.streams ?? 0)} streams de antes de registrar el álbum
            </span>
          </span>
          <span className="flex flex-shrink-0 flex-col items-end gap-0.5">
            <span className={`text-[12.5px] font-semibold ${t.muted}`}>
              {formatCurrency(unknown.netIncome ?? 0)}
            </span>
            <span className={`text-[10px] ${t.faint}`}>
              {total > 0 ? Math.round(((unknown.netIncome ?? 0) / total) * 100) : 0}%
            </span>
          </span>
        </li>
      )}
    </ul>
  );
}
