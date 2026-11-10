import { Link } from "react-router-dom";
import {
  ArrowRight,
  Music as MusicIcon,
  Disc3,
  Loader,
  TriangleAlert,
  Play,
  Crown,
} from "lucide-react";
import {
  formatDuration,
  formatReleaseDate,
  getSongReleaseDate,
  countReleases,
} from "@/utils/music.utils";
import { formatStreams, formatCurrency } from "@/utils/format.utils";
import { collaboratorColor, initialsOf } from "@/utils/collaborators.utils";
import { CopyButton } from "@/components/ui/CopyButton";
import { ModalShell, PrimaryButton, SecondaryButton } from "@/components/ui/ModalShell";
import type { SongItem } from "@/types/music.types";
import { viewerOwnsSong, viewerSplitPercentage } from "@/utils/ownerVisibility";

interface SongDetailsModalProps {
  song: SongItem;
  songDetails: SongItem | null;
  isLoading: boolean;
  error: string;
  onClose: () => void;
  onNavigate: (songId: string) => void;
}

/**
 * Vista rápida de una canción.
 *
 * Además de sus cifras, enseña el reparto en una sola barra y el álbum al que
 * pertenece, que es el salto que antes obligaba a cambiar de página y buscarlo
 * a mano.
 *
 * Quien no es el dueño de la canción ve el reparto sin la parte del owner y sin
 * el ingreso de la canción: ver `utils/ownerVisibility.ts`.
 */
export function SongDetailsModal({
  song,
  songDetails,
  isLoading,
  error,
  onClose,
  onNavigate,
}: SongDetailsModalProps) {
  const source = songDetails ?? song;

  const getField = (...keys: (keyof SongItem)[]): string | number | undefined =>
    keys.map((k) => source?.[k]).find((v) => v !== undefined && v !== null && v !== "") as
      | string
      | number
      | undefined;

  const cover =
    songDetails?.spotifyData?.album?.images?.[0]?.url ?? song?.spotifyData?.album?.images?.[0]?.url;

  const releaseDate = formatReleaseDate(
    getSongReleaseDate(songDetails) ?? getSongReleaseDate(song),
  );

  const duration = formatDuration(
    getField("duration", "durationMs", "duration_ms") ?? source?.spotifyData?.duration_ms,
  );

  const upc = String(getField("upc", "ean") ?? source?.releases?.[0]?.upc ?? "");
  const releasesCount = countReleases(source);
  const streams = source?.totalStreams ?? source?.streams ?? 0;
  const income = source?.totalNetIncome ?? source?.netIncome ?? 0;
  const isOwnerView = viewerOwnsSong(source);
  const ownerShare =
    isOwnerView && typeof source?.percetaje === "number" ? source.percetaje : null;

  const collaborators = (source?.collaborators ?? []).filter(
    (c) => Number(c?.split?.percentage ?? 0) > 0,
  );
  const collaboratorsShare = collaborators.reduce(
    (sum, c) => sum + Number(c?.split?.percentage ?? 0),
    0,
  );
  // Lo que cobra quien mira, venga de su split de owner o del suyo del pool.
  const myShare = viewerSplitPercentage(source);

  const assigned = (ownerShare ?? 0) + collaboratorsShare;
  const unassigned = Math.max(0, 100 - assigned);

  return (
    <ModalShell
      title={source.trackTitle}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          <span>{source.artistName ?? "Sin artista"}</span>
          {source.isrc && (
            <>
              <span className="text-[#A6AAB2]">·</span>
              <span className="font-mono text-[10.5px] text-[#A6AAB2]">{source.isrc}</span>
              <CopyButton value={source.isrc} title="Copiar ISRC" />
            </>
          )}
        </span>
      }
      width="lg"
      onClose={onClose}
      logo={
        <span className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F4F5F7]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <MusicIcon className="h-[21px] w-[21px] text-[#A6AAB2]" />
          )}
        </span>
      }
      footer={
        <>
          <span className="flex-1 text-[11px] font-semibold">
            {isLoading ? (
              <span className="text-[#A6AAB2]">Cargando…</span>
            ) : unassigned > 0 ? (
              <span className="text-[#EA580C]">Queda un {unassigned.toFixed(0)}% sin asignar</span>
            ) : (
              <span className="text-[#2FB37E]">Suma 100% · sin conflictos</span>
            )}
          </span>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
          <PrimaryButton
            onClick={() => onNavigate(source._id)}
            icon={<ArrowRight className="h-[15px] w-[15px]" />}
          >
            Abrir canción
          </PrimaryButton>
        </>
      }
    >
      {error ? (
        <p className="flex items-center gap-2.5 rounded-[14px] bg-[#FDECEC] px-3.5 py-3 text-[12px] text-[#E5484D]">
          <TriangleAlert className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Metric label="STREAMS" value={formatStreams(streams)} />
            {isOwnerView && (
              <Metric label="INGRESO NETO" value={formatCurrency(income)} color="#2FB37E" />
            )}
            <Metric
              label="TU PARTE"
              value={myShare === null ? "—" : `${myShare}%`}
              color={myShare === null ? undefined : "#FF5C00"}
            />
            <Metric label="COLABS" value={String(collaborators.length)} />
          </div>

          {upc && (
            <Link
              to={`/panel/album/upc/${encodeURIComponent(upc)}`}
              className="flex items-center gap-3 rounded-2xl bg-[#F4F5F7] px-3.5 py-3 transition-colors hover:bg-[#E8E8EC]"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-white">
                <Disc3 className="h-[15px] w-[15px] text-[#A6AAB2]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[12px] font-semibold text-[#1C1D22]">
                  Álbum de esta canción
                </span>
                <span className="truncate font-mono text-[10px] text-[#A6AAB2]">
                  UPC {upc}
                  {releasesCount > 1 ? ` · ${releasesCount} releases` : ""}
                </span>
              </span>
              <span className="flex-shrink-0 text-[11.5px] font-semibold text-[#FF5C00]">
                Ver álbum
              </span>
            </Link>
          )}

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#1C1D22]">
                Reparto de esta canción
              </span>
              {isLoading && <Loader className="h-3.5 w-3.5 animate-spin text-[#FF5C00]" />}
            </div>

            {assigned === 0 && !isLoading ? (
              <p className="flex items-center gap-2.5 rounded-[14px] bg-[#FFEADD] px-3.5 py-3 text-[11.5px] text-[#EA580C]">
                <Crown className="h-3.5 w-3.5 flex-shrink-0 text-[#FF5C00]" />
                Esta canción todavía no reparte nada. Asígnale un split para empezar.
              </p>
            ) : (
              <>
                <span className="flex h-4 w-full gap-[2px] overflow-hidden rounded-lg">
                  {ownerShare !== null && ownerShare > 0 && (
                    <span className="h-full bg-[#FF5C00]" style={{ width: `${ownerShare}%` }} />
                  )}
                  {collaborators.map((collaborator, index) => (
                    <span
                      key={collaborator._id ?? index}
                      className="h-full"
                      style={{
                        width: `${Number(collaborator.split?.percentage ?? 0)}%`,
                        backgroundColor: collaboratorColor(index + 1),
                      }}
                    />
                  ))}
                  {unassigned > 0 && (
                    <span className="h-full bg-[#E8E8EC]" style={{ width: `${unassigned}%` }} />
                  )}
                </span>

                <ul className="flex flex-col gap-2">
                  {ownerShare !== null && ownerShare > 0 && (
                    <ShareRow color="#FF5C00" name="Tú (owner)" percentage={ownerShare} />
                  )}
                  {collaborators.map((collaborator, index) => (
                    <ShareRow
                      key={collaborator._id ?? index}
                      color={collaboratorColor(index + 1)}
                      name={collaborator.name ?? "Colaborador"}
                      percentage={Number(collaborator.split?.percentage ?? 0)}
                      initials={initialsOf(collaborator.name ?? "?")}
                    />
                  ))}
                  {unassigned > 0 && (
                    <ShareRow color="#E8E8EC" name="Sin asignar" percentage={unassigned} muted />
                  )}
                </ul>
              </>
            )}
          </div>

          <ul className="flex flex-col gap-2 rounded-[16px] bg-[#F4F5F7] p-3.5">
            <Detail label="Publicada" value={releaseDate} />
            <Detail label="Duración" value={duration} />
            <Detail
              label="Streams"
              value={
                <span className="flex items-center gap-1.5">
                  <Play className="h-3 w-3 text-[#A6AAB2]" />
                  {formatStreams(streams)}
                </span>
              }
            />
          </ul>
        </>
      )}
    </ModalShell>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[16px] bg-[#F4F5F7] px-3.5 py-3">
      <span className="font-mono text-[9.5px] font-medium tracking-[1px] text-[#A6AAB2]">
        {label}
      </span>
      <span
        className="truncate font-mono text-[16px] font-semibold"
        style={{ color: color ?? "#1C1D22" }}
      >
        {value}
      </span>
    </div>
  );
}

function ShareRow({
  color,
  name,
  percentage,
  initials,
  muted = false,
}: {
  color: string;
  name: string;
  percentage: number;
  initials?: string;
  muted?: boolean;
}) {
  return (
    <li className="flex items-center gap-2.5">
      {initials ? (
        <span
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          <span className="text-[9px] font-semibold text-white">{initials}</span>
        </span>
      ) : (
        <span
          className="h-[9px] w-[9px] flex-shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className={`min-w-0 flex-1 truncate text-[12px] ${
          muted ? "text-[#A6AAB2]" : "font-medium text-[#1C1D22]"
        }`}
      >
        {name}
      </span>
      <span
        className={`font-mono text-[12px] font-semibold ${muted ? "text-[#A6AAB2]" : "text-[#1C1D22]"}`}
      >
        {percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%
      </span>
    </li>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-[11.5px] text-[#71757E]">{label}</span>
      <span className="text-[11.5px] font-semibold text-[#1C1D22]">{value}</span>
    </li>
  );
}
