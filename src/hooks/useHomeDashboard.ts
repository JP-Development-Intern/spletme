import { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useSplitPayments } from "@/hooks/useSplitPayments";
import SongService from "@/services/songs";
import type { TopSong } from "@/types";

export interface DataPoint {
  date: string;
  streams: number;
  income: number;
}

/**
 * Centraliza el estado y la lógica de datos del dashboard principal.
 * Expone datos listos para consumir por los componentes de presentación.
 */
export function useHomeDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("90d");
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [apiSummary, setApiSummary] = useState({ totalStreams: 0, totalNetIncome: 0, matchingReleases: 0, songsWithMatches: 0 });
  /** Mientras llega la serie del periodo; sin esto, el gráfico decía «Sin datos» al abrir. */
  const [loading, setLoading] = useState(true);

  const { totalAmount } = useSplitPayments();
  const { user } = useAuth0();

  useEffect(() => {
    SongService.getTopByIncome().then((res: { data?: TopSong[] } | null) => {
      if (res?.data) setTopSongs(res.data);
    });
  }, []);

  // Auto-reload una sola vez por sesión para asegurar datos frescos
  useEffect(() => {
    const key = "panel-home-auto-reloaded";
    if (sessionStorage.getItem(key) === "true") return;
    sessionStorage.setItem(key, "true");
    window.location.reload();
  }, []);

  const fetchData = useCallback(async (timeframe: string) => {
    setLoading(true);
    const res = await SongService.getSongsByParams(timeframe);
    // La carga termina junto con los datos, en el mismo render: si se apagara
    // antes, el gráfico pintaría «Sin datos» un fotograma.
    if (res?.summary) setApiSummary(res.summary);
    if (res) {
      setDataPoints((res.data ?? []).map((row) => ({
        date:    row.date,
        streams: row.totalStreams,
        income:  row.totalNetIncome,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(selectedTimeframe);
  }, [selectedTimeframe, fetchData]);

  const netBalance = apiSummary.totalNetIncome - totalAmount;

  return {
    user,
    selectedTimeframe,
    setSelectedTimeframe,
    topSongs,
    summary: apiSummary,
    totalAmount,
    netBalance,
    points: dataPoints,
    loading,
  };
}
