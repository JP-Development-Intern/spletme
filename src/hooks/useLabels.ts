import { useState, useCallback, useEffect } from "react";
import LabelsService, {
  Label,
  LabelSong,
  CustomLabel,
  ArtisticLabelSummary,
  ArtisticLabelRef,
} from "../services/labels";

export const useLabels = () => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [customLabels, setCustomLabels] = useState<CustomLabel[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadLabels = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Cargar ambos tipos de labels en paralelo
      const [artisticResponse, customResponse] = await Promise.all([
        LabelsService.getLabels(),
        LabelsService.getCustomLabels(),
      ]);

      const artisticLabels: Label[] = artisticResponse.error ? [] : artisticResponse.data || [];
      const customLabelsList: CustomLabel[] = customResponse.error ? [] : customResponse.data || [];

      // Marcar los labels artísticos como no personalizados
      const artisticLabelsWithFlag = artisticLabels.map((label) => ({
        ...label,
        isCustom: false,
      }));

      // Convertir los labels personalizados al formato de Label para mostrarlos en la tabla
      const customLabelsAsLabel: Label[] = customLabelsList.map(
        (custom) =>
          ({
            label: custom.name,
            count: custom.stats?.totalSongs || 0,
            totalStreams: custom.stats?.totalStreams || 0,
            totalGrossIncome: custom.stats?.totalGrossIncome || 0,
            totalNetIncome: custom.stats?.totalNetIncome || 0,
            ownerEarnings: custom.stats?.ownerEarnings || 0,
            topSongs: [],
            splitProgress: {
              total: 0,
              withSplits: 0,
              percentage: 0,
              hasAllSplits: false,
            },
            isCustom: true,
            // Campos adicionales para labels personalizados
            _id: custom._id,
            artisticLabels: custom.artisticLabels,
            artisticLabelIds: custom.artisticLabelIds,
            createdAt: custom.createdAt,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any,
      );

      setLabels(artisticLabelsWithFlag);
      setCustomLabels(customLabelsList);

      // Combinar ambos: primero los personalizados, luego los artísticos
      setAllLabels([...customLabelsAsLabel, ...artisticLabelsWithFlag]);
    } catch (err) {
      console.error("Error loading labels:", err);
      setError("Error al conectar con el servidor");
      setLabels([]);
      setCustomLabels([]);
      setAllLabels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  return {
    labels, // Labels artísticos originales
    customLabels, // Labels personalizados
    allLabels, // Todos combinados para mostrar en tabla
    loading,
    error,
    loadLabels,
    refreshLabels: loadLabels,
  };
};

export const useLabelSongs = (label: string) => {
  const [songs, setSongs] = useState<LabelSong[]>([]);
  // El sello con sus totales, de `artistic_labels`: lo que pinta la cabecera.
  const [artisticLabel, setArtisticLabel] = useState<ArtisticLabelSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadSongs = useCallback(async () => {
    if (!label) return;

    try {
      setLoading(true);
      setError("");

      const response = await LabelsService.getSongsByLabel(label);

      if (response.error) {
        setError(
          response.notFound
            ? "Este sello no existe o ya no tiene canciones."
            : "No pudimos cargar las canciones del sello.",
        );
        setSongs([]);
        setArtisticLabel(null);
      } else {
        setSongs(response.data || []);
        setArtisticLabel(response.label ?? null);
      }
    } catch (err) {
      console.error("Error loading songs by label:", err);
      setError("Error al conectar con el servidor");
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [label]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  return {
    songs,
    artisticLabel,
    loading,
    error,
    loadSongs,
  };
};

export const useCustomLabelSongs = (labelName: string) => {
  const [songs, setSongs] = useState<LabelSong[]>([]);
  const [customLabel, setCustomLabel] = useState<{
    _id: string;
    name: string;
    artisticLabelIds: string[];
    artisticLabels: ArtisticLabelRef[];
    createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadSongs = useCallback(async () => {
    if (!labelName) return;

    try {
      setLoading(true);
      setError("");

      const response = await LabelsService.getSongsByCustomLabel(labelName);

      if (response.error) {
        setError(response.message || "Error al cargar las canciones");
        setSongs([]);
        setCustomLabel(null);
      } else {
        setSongs(response.data?.songs || []);
        setCustomLabel(response.data?.customLabel || null);
      }
    } catch (err) {
      console.error("Error loading songs by custom label:", err);
      setError("Error al conectar con el servidor");
      setSongs([]);
      setCustomLabel(null);
    } finally {
      setLoading(false);
    }
  }, [labelName]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  return {
    songs,
    customLabel,
    loading,
    error,
    loadSongs,
  };
};
