import { useEffect, useState } from "react";
import SongService from "@/services/songs";
import { platformColorOnDark } from "@/const/platformBrand";

interface PlatformStat {
  _id: string;
  totalStreams: number;
  totalNetIncome: number;
  releasesCount: number;
}

export interface PlatformShare {
  name: string;
  /** Color de marca, ya ajustado para leerse sobre el vidrio oscuro. */
  color: string;
  income: number;
  streams: number;
  /** Parte del ingreso total, de 0 a 1. */
  share: number;
}

/** El resto de plataformas, agrupadas, va en un tono neutro: no es una marca. */
const OTHERS_COLOR = "rgba(255, 255, 255, 0.45)";

/**
 * Reparto histórico de los ingresos por plataforma, ordenado por ingreso.
 * Devuelve las `limit` primeras y suma el resto en «Otras».
 *
 * Es histórico porque el endpoint no admite periodo: no cambia con el
 * selector de 7 días / 30 días / 90 días / 1 año.
 */
export function usePlatformBreakdown(limit = 4) {
  const [platforms, setPlatforms] = useState<PlatformShare[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SongService.getStadisticsByPlatformAll()
      .then((response) => {
        const stats: PlatformStat[] = response?.data ?? [];
        const total = stats.reduce((sum, item) => sum + (item.totalNetIncome ?? 0), 0);
        const byIncome = [...stats]
          .filter((item) => (item.totalNetIncome ?? 0) > 0)
          .sort((a, b) => b.totalNetIncome - a.totalNetIncome);

        const toShare = (name: string, color: string, income: number, streams: number) => ({
          name,
          color,
          income,
          streams,
          share: total > 0 ? income / total : 0,
        });

        const top = byIncome
          .slice(0, limit)
          .map((item) =>
            toShare(item._id || "Otros", platformColorOnDark(item._id || "Otros"), item.totalNetIncome, item.totalStreams),
          );
        const rest = byIncome.slice(limit);
        if (rest.length > 0) {
          top.push(
            toShare(
              "Otras",
              OTHERS_COLOR,
              rest.reduce((sum, item) => sum + item.totalNetIncome, 0),
              rest.reduce((sum, item) => sum + item.totalStreams, 0),
            ),
          );
        }

        setTotalIncome(total);
        setPlatforms(top);
      })
      .catch(() => setPlatforms([]))
      .finally(() => setLoading(false));
  }, [limit]);

  return { platforms, totalIncome, loading };
}
