/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Music2, Disc3, Clock, Users, AlertCircle } from "lucide-react";
import { SpotifyService } from "../../../../services/spotify";
import Loading from "../../../../components/loading/loading";
import { SongLabelsBadge } from "@/components/music/SongLabelsBadge";
import { getSongLabels, songLabelCount } from "@/utils/music.utils";

const Album = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAlbum();
  }, []);

  const getAlbum = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await SpotifyService.getAlbum(id || "");
      setAlbum(response);
    } catch {
      setError("No se pudo cargar el álbum. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const totalDurationMs =
    album?.tracks?.items?.reduce((sum: number, t: any) => sum + (t.duration_ms || 0), 0) ?? 0;

  if (loading) return <Loading />;

  if (error || !album) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] px-6 py-8 lg:px-10">
        <div className="flex max-w-lg items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <div>
            <p className="mb-1 text-sm font-semibold text-red-700">Error al cargar el álbum</p>
            <p className="text-xs text-red-600">{error || "Álbum no encontrado"}</p>
          </div>
        </div>
      </div>
    );
  }

  const artistNames = album.artists?.map((a: any) => a.name).join(", ") || "—";

  return (
    <div className="min-h-screen space-y-6 bg-[#F7F8FA] px-6 py-8 lg:px-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle del Álbum</h1>
            <p className="mt-0.5 text-sm text-gray-500">Información y pistas del álbum</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="hidden items-center gap-2 text-sm sm:flex">
          <Link to="/panel/music?view=albums" className="text-gray-400 hover:text-gray-600">
            Música
          </Link>
          <span className="text-gray-300">/</span>
          <span className="max-w-[180px] truncate font-medium text-gray-900">{album.name}</span>
        </div>
      </div>

      {/* Hero Card */}
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 sm:flex-row">
        {/* Cover */}
        <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center self-center overflow-hidden rounded-xl bg-orange-50 sm:self-start">
          {album.images?.[0]?.url ? (
            <img
              src={album.images[0].url}
              alt={album.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Disc3 className="h-12 w-12 text-[#F97316]" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#F97316]">
              Álbum
            </span>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{album.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {artistNames}
            </p>
          </div>

          {/* Stats row */}
          <div
            className={`grid ${album?.ownerEarnings ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"} gap-4`}
          >
            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                  <Music2 className="h-3.5 w-3.5 text-[#F97316]" />
                </div>
                <span className="text-xs font-medium text-gray-500">Pistas</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{album.total_tracks}</p>
            </div>

            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Duración</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatDuration(totalDurationMs)}</p>
            </div>

            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50">
                  <Users className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Artistas</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{album.artists?.length ?? 1}</p>
            </div>

            {album?.ownerEarnings && (
              <div className="rounded-xl bg-green-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                    <span className="text-xs font-bold text-green-600">$</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500">Ganancias</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  $
                  {(Array.isArray(album.ownerEarnings) &&
                  album.ownerEarnings[0]?.calculation?.amountToPay
                    ? album.ownerEarnings[0].calculation.amountToPay
                    : 0
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracks Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
          <Music2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Pistas</span>
          <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
            {album.tracks?.items?.length ?? 0}
          </span>
        </div>

        {album.tracks?.items?.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-12 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Título
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">
                  Artistas
                </th>
                <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                  Tipo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Sellos
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Duración
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {album.tracks.items.map((track: any, index: number) => (
                <tr key={track.id || index} className="transition-colors hover:bg-gray-50">
                  {/* # */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <Music2 className="h-4 w-4 text-[#F97316]" />
                      </div>
                      <p className="max-w-[200px] truncate text-sm font-semibold text-gray-900">
                        {track.name}
                      </p>
                    </div>
                  </td>

                  {/* Artists */}
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <p className="max-w-[180px] truncate text-xs text-gray-500">
                      {track.artists?.map((a: any) => a.name).join(", ") || "—"}
                    </p>
                  </td>

                  {/* Type */}
                  <td className="hidden px-4 py-4 text-center md:table-cell">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
                      {track.type || "track"}
                    </span>
                  </td>

                  {/* Labels */}
                  <td className="px-4 py-4 text-center">
                    <SongLabelsBadge labels={getSongLabels(track)} count={songLabelCount(track)} />
                  </td>

                  {/* Duration */}
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm font-medium text-gray-600">
                      {formatDuration(track.duration_ms || 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <Music2 className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-700">Sin pistas</p>
            <p className="text-xs text-gray-400">Este álbum no tiene pistas disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Album;
