import { useCallback, useEffect, useMemo, useState } from "react";
import CollaboratorService from "@/services/collaborator";

/* ── Contrato del API ──────────────────────────────────────────────────────── */

interface ApiDetailSong {
  songId: string;
  trackTitle: string;
  artistName: string;
  coverUrl?: string | null;
  totalStreams: number;
  totalNetIncome: number;
  split: { splitId: string; percentage: number } | null;
}

interface ApiMetricsSong {
  songId: string;
  split: {
    percentage: number;
    totalOwed: number;
    totalPaid: number;
    pendingAmount: number;
  } | null;
}

interface ApiMetricsTotals {
  totalStreams: number;
  totalNetIncome: number;
  totalOwed: number;
  totalPaid: number;
  pendingAmount: number;
}

/** Una canción que el owner comparte con el colaborador, con lo que le toca de ella. */
export interface SharedSong {
  songId: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  streams: number;
  netIncome: number;
  /** Porcentaje de split del colaborador en esta canción. */
  splitPercentage: number | null;
  owed: number;
  paid: number;
  pending: number;
}

/**
 * Canciones que el owner comparte con un colaborador y los totales de ese
 * reparto. Junta el detalle (portada, streams, ingreso) con las métricas (lo
 * que le corresponde y lo que se le ha pagado por canción), igual que el perfil.
 */
export function useCollaboratorSongs(collaboratorId: string | null) {
  const [songs, setSongs] = useState<SharedSong[]>([]);
  const [totals, setTotals] = useState<ApiMetricsTotals | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!collaboratorId) {
      setSongs([]);
      setTotals(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setFailed(false);
    setSongs([]);
    setTotals(null);

    Promise.all([
      CollaboratorService.getById(collaboratorId),
      CollaboratorService.getSongMetrics(collaboratorId),
    ])
      .then(([detailRes, metricsRes]) => {
        if (!alive) return;
        const detailSongs: ApiDetailSong[] | undefined = detailRes?.data?.songs;
        if (!detailSongs) {
          setFailed(true);
          return;
        }
        const metricsSongs: ApiMetricsSong[] = metricsRes?.data?.songs ?? [];
        const splitBySong = new Map(metricsSongs.map((s) => [s.songId, s.split]));

        setSongs(
          detailSongs.map((song) => {
            const split = splitBySong.get(song.songId) ?? null;
            return {
              songId: song.songId,
              title: song.trackTitle || "Canción",
              artist: song.artistName ?? "",
              coverUrl: song.coverUrl ?? null,
              streams: song.totalStreams ?? 0,
              netIncome: song.totalNetIncome ?? 0,
              splitPercentage: split?.percentage ?? song.split?.percentage ?? null,
              owed: split?.totalOwed ?? 0,
              paid: split?.totalPaid ?? 0,
              pending: split?.pendingAmount ?? 0,
            };
          }),
        );
        setTotals(metricsRes?.data?.totals ?? null);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [collaboratorId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  /** Primero lo que se viene a mirar: el saldo pendiente o, en Ingresos, lo que más genera. */
  const byPending = useMemo(() => [...songs].sort((a, b) => b.pending - a.pending), [songs]);
  const byIncome = useMemo(() => [...songs].sort((a, b) => b.netIncome - a.netIncome), [songs]);

  return { songs, byPending, byIncome, totals, loading, failed, retry };
}
