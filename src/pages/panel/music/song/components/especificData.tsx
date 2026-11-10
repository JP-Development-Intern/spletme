import img from "../../../../../assets/images/collaborator2.jpg";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatReleaseDate, getSongReleaseDate } from "@/utils/music.utils";

export default function EspecificData({ song }: { song: any }) {

  const getDurationLabel = () => {
    const rawDuration = song?.duration || song?.durationMs || song?.spotifyData?.duration_ms;
    if (!rawDuration && rawDuration !== 0) return "N/A";

    const value = Number(rawDuration);
    if (Number.isNaN(value)) return String(rawDuration);

    const totalSeconds = value > 10000 ? Math.round(value / 1000) : Math.round(value);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const upc = song?.upc || song?.ean || song?.releases?.[0]?.upc || "N/A";
  const isrc = song?.isrc || "N/A";
  const releaseDate = formatReleaseDate(
    getSongReleaseDate(song) || song?.releases?.[0]?.salesMonth,
  );
  const duration = getDurationLabel();
  const label = song?.artisticLabel || song?.label || "N/A";
  const composer =
    song?.composer ||
    (Array.isArray(song?.composers) ? song.composers.join(", ") : null) ||
    (Array.isArray(song?.songwriters) ? song.songwriters.join(", ") : null) ||
    "N/A";
  const producer =
    song?.producer || (Array.isArray(song?.producers) ? song.producers.join(", ") : null) || "N/A";
  const currentDistributor =
    song?.currentDistributor || song?.distributor || song?.distributorName || "N/A";
  const previousDistributors = Array.isArray(song?.previousDistributors)
    ? song.previousDistributors
    : [];
  const previousDistributorsRows = Array.from(
    { length: 4 },
    (_, index) => previousDistributors[index] || null,
  );
  const copyrightA = song?.copyright || "N/A";
  const copyrightB = song?.phonogramCopyright || song?.masterCopyright || "N/A";

  return (
    <div className="col-span-12 h-full p-6 shadow-lg" id="data-valora">
      <span className="text-title font-bold">Data - Valora</span>
      <div className="flex items-center">
        <div className="mt-3 flex gap-6 pr-10">
          <div className="flex flex-col">
            <span className="font-bold">UPC:</span>
            <span className="font-bold">ISRC:</span>
            <span className="font-bold">Fecha de lanzamiento:</span>
            <span className="font-bold">Duracion:</span>
            <span className="font-bold">Sello:</span>
            <span className="font-bold">Compositor:</span>
            <span className="font-bold">Productor:</span>
          </div>
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1.5">
              {upc}
              {upc !== "N/A" && <CopyButton value={upc} title="Copiar UPC" />}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {isrc}
              {isrc !== "N/A" && <CopyButton value={isrc} title="Copiar ISRC" />}
            </span>
            <span>{releaseDate}</span>
            <span>{duration}</span>
            <span>{label}</span>
            <span>{composer}</span>
            <span>{producer}</span>
          </div>
        </div>
        <div className="flex w-2/3 flex-col justify-between gap-6 border-l px-10">
          <div className="flex w-full gap-3 rounded-2xl p-3 shadow-lg">
            <img src={img} alt="" className="h-16 w-16 rounded-full" />
            <div className="flex flex-col justify-center">
              <span className="text-subtitle font-bold">{currentDistributor}</span>
              <span className="text-normal">Distribuidor actual</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-bold">Distribuiodores anteriores</span>
            <div className="mt-3 flex gap-6 text-normal">
              <div className="flex flex-col">
                {previousDistributorsRows.map((item: any, idx: number) => (
                  <span key={`distributor-name-${idx}`} className="font-bold">
                    {item?.name || item?.distributor || "N/A"}:
                  </span>
                ))}
              </div>
              <div className="flex flex-col">
                {previousDistributorsRows.map((item: any, idx: number) => (
                  <span key={`distributor-date-${idx}`}>
                    {item
                      ? item?.period ||
                        `${formatReleaseDate(item?.from || item?.startDate)} - ${formatReleaseDate(item?.to || item?.endDate)}`
                      : "N/A"}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col font-bold">
            <span>&copy; {copyrightA}</span>
            <span>&copy; {copyrightB}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
