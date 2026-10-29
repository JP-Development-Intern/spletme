import { useEffect, useState } from "react";
import AlbumService from "@/services/albums";
import { useSongsKpis } from "./useSongsKpis";
import CollaboratorService from "@/services/collaborator";
import { viewerIsAccountOwner } from "@/utils/ownerVisibility";

export interface MusicSummary {
  totalSongs: number;
  totalAlbums: number;
  totalIncome: number;
  totalStreams: number;
  withoutSplits: number;
  /** Pendiente de pago a colaboradores. `undefined` si quien mira no es el owner. */
  totalToPay?: number;
  loading: boolean;
}

/**
 * Cifras del catálogo completo, con canciones y álbumes en la misma lectura.
 *
 * Los KPIs de canciones ya existían; el total de álbumes se obtiene pidiendo una
 * página de tamaño 1, porque la respuesta trae el total en `pagination` y así no
 * hay que descargar el catálogo entero solo para contarlo.
 */
export function useMusicSummary(): MusicSummary {
  const songs = useSongsKpis();
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [totalToPay, setTotalToPay] = useState<number>();

  useEffect(() => {
    let active = true;

    AlbumService.getAlbums({ skip: 0, limit: 1 })
      .then((response) => {
        if (!active) return;
        const total =
          response.success && "pagination" in response ? (response.pagination?.total ?? 0) : 0;
        setTotalAlbums(total);
      })
      .catch(() => active && setTotalAlbums(0))
      .finally(() => active && setAlbumsLoading(false));

    return () => {
      active = false;
    };
  }, []);

  // El total a pagar es una cuenta del owner: a los demás ni se les pide.
  useEffect(() => {
    if (!viewerIsAccountOwner()) return;
    let active = true;

    CollaboratorService.getMetrics()
      .then((response) => {
        const pending = response?.data?.summary?.totalPending;
        if (active) setTotalToPay(typeof pending === "number" ? pending : 0);
      })
      .catch(() => active && setTotalToPay(0));

    return () => {
      active = false;
    };
  }, []);

  return {
    totalSongs: songs.totalSongs,
    totalAlbums,
    totalIncome: songs.totalIncome,
    totalStreams: songs.totalStreams,
    withoutSplits: songs.withoutSplits,
    totalToPay,
    loading: songs.loading || albumsLoading,
  };
}
