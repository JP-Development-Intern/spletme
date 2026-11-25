import { useState, useEffect } from "react";
import { songSplitsService } from "@/services/songSplits";
import { useReleaseFilters } from "@/hooks/useReleaseFilters";
import {
  validatePeriods,
  toPayloadPeriods,
  reconcilePeriods,
} from "@/utils/splitPeriods.utils";
import type {
  CollaboratorFormData,
  CollaboratorWithSplit,
  SelectOption,
  SplitPeriodFormData,
} from "@/types";

interface UseSplitsModalParams {
  isOpen: boolean;
  collaborators: CollaboratorWithSplit[];
  songId: string;
  /**
   * Mes (`YYYY-MM`) en que sale la canción, que es donde arranca la línea de
   * tiempo de los tramos. `null` cuando no se sabe: entonces el primer tramo se
   * enseña como "desde su lanzamiento" sin fecha, y sigue cubriendo todo lo
   * anterior porque va abierto por la izquierda.
   */
  releaseMonth?: string | null;
  onSaved?: () => void | Promise<void>;
}

/** Convierte strings crudos de la BD en opciones para react-select. */
const toSelectOptions = (values: string[]): SelectOption[] =>
  (values ?? []).map((value) => ({ value, label: value }));

const defaultFormData = (): CollaboratorFormData => ({
  percentage: "",
  countriesType: "all",
  selectedCountries: [],
  platformsType: "all",
  selectedPlatforms: [],
  periods: [],
  ownerRate: "",
});

/** Contador de claves de React para los tramos recién añadidos. */
let periodKey = 0;

const emptyPeriod = (): SplitPeriodFormData => {
  periodKey += 1;
  return {
    id: `period-${periodKey}`,
    from: "",
    to: "",
    percentage: "",
    countriesType: "all",
    selectedCountries: [],
    platformsType: "all",
    selectedPlatforms: [],
  };
};

/**
 * Gestiona el estado y la lógica del modal de configuración de splits de
 * colaborador. Cada colaborador tiene un porcentaje obligatorio, filtros
 * opcionales de país y plataforma y, si su parte cambia con el tiempo, tramos
 * de vigencia con su propio porcentaje y sus propios filtros.
 *
 * Con tramos, el porcentaje de arriba deja de ser lo que cobra siempre y pasa
 * a ser el del tramo final: rige desde que acaba el último tramo y ya no
 * termina. Los meses que no cubre ningún tramo no le pagan nada.
 *
 * El dueño de la canción puede además fijar por colaborador la retención que
 * le cobra sobre su parte (`ownerRate`). Dejarla vacía mantiene la de siempre:
 * la del split del owner, igual para todos.
 */
export function useSplitsModal({
  isOpen,
  collaborators,
  songId,
  releaseMonth = null,
  onSaved,
}: UseSplitsModalParams) {
  const [collaboratorForms, setCollaboratorForms] = useState<Record<string, CollaboratorFormData>>(
    {},
  );
  const [expandedCollaborators, setExpandedCollaborators] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { countryOptions, platformOptions, isLoadingFilters } = useReleaseFilters(songId, isOpen);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const initialForms: Record<string, CollaboratorFormData> = {};

    for (const collaborator of collaborators) {
      const split = collaborator.split;
      if (!split) continue;

      initialForms[collaborator.id] = {
        // Vacío cuando no hay retención propia: el input queda en blanco y el
        // colaborador sigue heredando la del owner.
        ownerRate: split.ownerRate === null || split.ownerRate === undefined
          ? ""
          : String(split.ownerRate),
        percentage: String(split.percentage ?? ""),
        countriesType: split.countriesType ?? "all",
        selectedCountries: toSelectOptions(split.selectedCountries ?? []),
        platformsType: split.platformsType ?? "all",
        selectedPlatforms: toSelectOptions(split.selectedPlatforms ?? []),
        // Se reconcilian al cargar, no solo al editar: los splits guardados
        // antes de que la cobertura fuese continua tienen huecos, y verlos ya
        // tapados al 0% es exactamente lo que el reparto lleva pagando por
        // ellos desde siempre.
        periods: reconcilePeriods(
          (split.periods ?? []).map((period) => {
            periodKey += 1;
            return {
              id: period.autoFilled
                ? `gap-${period.from}-${period.to}`
                : `period-${periodKey}`,
              from: period.from ?? "",
              to: period.to ?? "",
              percentage: String(period.percentage ?? ""),
              countriesType: period.countriesType ?? "all",
              selectedCountries: toSelectOptions(period.selectedCountries ?? []),
              platformsType: period.platformsType ?? "all",
              selectedPlatforms: toSelectOptions(period.selectedPlatforms ?? []),
              autoFilled: Boolean(period.autoFilled),
              openStart: Boolean(period.openStart),
            };
          }),
          releaseMonth,
        ),
      };
    }

    setCollaboratorForms(initialForms);
    // `releaseMonth` NO está en las dependencias a propósito: llega de una
    // petición aparte y puede aterrizar con el modal ya abierto. Reinicializar
    // aquí borraría lo que se estuviera escribiendo; el efecto de abajo se
    // encarga de recolocar los tramos cuando por fin se sabe la fecha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, collaborators]);

  /**
   * Recoloca los tramos cuando la fecha de lanzamiento llega después de abrir
   * el modal: el hueco inicial pasa a arrancar en el mes real en lugar de en el
   * mes de antes del primer tramo. Solo toca `periods`, así que no se pierde
   * nada de lo que se estuviera escribiendo.
   */
  useEffect(() => {
    if (!isOpen || !releaseMonth) return;

    setCollaboratorForms((prev) => {
      const next: Record<string, CollaboratorFormData> = {};
      let changed = false;

      for (const [id, form] of Object.entries(prev)) {
        const periods = reconcilePeriods(form.periods, releaseMonth);
        // Comparar por contenido y no por identidad: reconcilePeriods devuelve
        // objetos nuevos siempre, y guardarlos sin más dejaría este efecto
        // reprogramándose a sí mismo en bucle.
        const same =
          periods.length === form.periods.length &&
          periods.every((period, i) => {
            const before = form.periods[i];
            return (
              before &&
              period.id === before.id &&
              period.from === before.from &&
              period.to === before.to &&
              period.openStart === before.openStart
            );
          });

        next[id] = same ? form : { ...form, periods };
        if (!same) changed = true;
      }

      return changed ? next : prev;
    });
  }, [isOpen, releaseMonth]);

  const getForm = (collaboratorId: string): CollaboratorFormData =>
    collaboratorForms[collaboratorId] ?? defaultFormData();

  const toggleExpanded = (collaboratorId: string) => {
    setExpandedCollaborators((prev) => ({
      ...prev,
      [collaboratorId]: !prev[collaboratorId],
    }));
  };

  const updateForm = (
    collaboratorId: string,
    field: keyof CollaboratorFormData,
    value: string | readonly SelectOption[],
  ) => {
    setCollaboratorForms((prev) => ({
      ...prev,
      [collaboratorId]: { ...getForm(collaboratorId), [field]: value },
    }));
  };

  const addPeriod = (collaboratorId: string) => {
    const form = getForm(collaboratorId);
    setCollaboratorForms((prev) => ({
      ...prev,
      [collaboratorId]: { ...form, periods: [...form.periods, emptyPeriod()] },
    }));
  };

  /**
   * Quita un tramo sin romper la línea de tiempo, que tiene que seguir cubriendo
   * desde el lanzamiento hasta el tramo final.
   *
   * Un tramo escrito a mano no desaparece del calendario: se borra de la lista y
   * la reconciliación vuelve a cubrir sus meses con un hueco al 0%. Se deja de
   * cobrar en ellos, que es lo que se ha pedido, pero se ve.
   *
   * Un hueco sí desaparece: sus meses se los queda el tramo de al lado —el
   * anterior, o el siguiente si era el primero—. Si no tenía vecinos era lo
   * único que quedaba, y la lista se vacía: el tramo final vuelve a cubrirlo
   * todo desde el lanzamiento. Sin esto, borrar un tramo dejaría un hueco
   * imposible de quitar.
   */
  const removePeriod = (collaboratorId: string, periodId: string) => {
    const form = getForm(collaboratorId);
    const index = form.periods.findIndex((period) => period.id === periodId);
    if (index === -1) return;

    const target = form.periods[index];
    const before = target.autoFilled ? form.periods[index - 1] : undefined;
    const after = target.autoFilled ? form.periods[index + 1] : undefined;

    const periods = form.periods
      .map((period) => {
        if (before && period.id === before.id) return { ...period, to: target.to };
        if (!before && after && period.id === after.id) return { ...period, from: target.from };
        return period;
      })
      .filter((period) => period.id !== periodId);

    setCollaboratorForms((prev) => ({
      ...prev,
      [collaboratorId]: { ...form, periods: reconcilePeriods(periods, releaseMonth) },
    }));
  };

  const updatePeriod = (
    collaboratorId: string,
    periodId: string,
    field: keyof SplitPeriodFormData,
    value: string | readonly SelectOption[],
  ) => {
    const form = getForm(collaboratorId);
    setCollaboratorForms((prev) => ({
      ...prev,
      [collaboratorId]: {
        ...form,
        // Reconciliar en cada cambio es lo que hace que el hueco aparezca en el
        // mismo momento en que se crea, y no al guardar: escribir "desde enero"
        // cuando la canción salió en noviembre deja dos meses sin regla, y el
        // sitio donde eso se entiende es la propia lista de tramos.
        periods: reconcilePeriods(
          form.periods.map((period) =>
            period.id === periodId ? { ...period, [field]: value } : period,
          ),
          releaseMonth,
        ),
      },
    }));
  };

  const saveSplit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // Con tramos, un porcentaje base de 0 es una configuración legítima
      // ("cuando acabe su tramo, deja de cobrar"), así que también se guarda.
      const pending = Object.entries(collaboratorForms).filter(
        ([, form]) =>
          form.percentage !== "" &&
          (parseFloat(form.percentage) > 0 || form.periods.length > 0),
      );

      if (pending.length === 0) {
        setErrorMessage("Configura al menos un colaborador con un porcentaje válido.");
        return;
      }

      // Los tramos se comprueban antes de mandar nada: si el segundo colaborador
      // los tiene mal, el primero ya se habría guardado y el reparto quedaría a
      // medias sin que nadie lo haya pedido.
      for (const [, form] of pending) {
        const problem = validatePeriods(form.periods);
        if (problem) {
          setErrorMessage(problem);
          return;
        }

        // Se comprueba aquí y no al teclear porque el input admite estados
        // intermedios ("0.", "-") mientras se escribe; lo que no puede es
        // llegar así al backend y guardarse como una retención sin sentido.
        if (form.ownerRate.trim() !== "") {
          const rate = parseFloat(form.ownerRate);
          if (Number.isNaN(rate) || rate < 0 || rate > 100) {
            setErrorMessage("La retención del owner tiene que estar entre 0 y 100.");
            return;
          }
        }
      }

      for (const [collaboratorId, form] of pending) {
        await songSplitsService.createCollaboratorSplit({
          songId,
          collaboratorId,
          percentage: parseFloat(form.percentage),
          countriesType: form.countriesType,
          selectedCountries: form.selectedCountries.map((c) => c.value),
          platformsType: form.platformsType,
          selectedPlatforms: form.selectedPlatforms.map((p) => p.value),
          periods: toPayloadPeriods(form.periods),
          // Input vacío = sin retención propia: el backend le aplica la del
          // split del owner, igual que antes de que esto fuera configurable.
          ownerRate: form.ownerRate.trim() === "" ? null : parseFloat(form.ownerRate),
        });
      }

      await onSaved?.();
      setSuccessMessage("Splits guardados correctamente.");
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status: number;
          data?: { message?: string; error?: string };
        };
        message?: string;
      };
      if (err.response?.data) {
        const msg = err.response.data.message ?? err.response.data.error ?? "Error del servidor.";
        setErrorMessage(`Error ${err.response.status}: ${msg}`);
      } else {
        setErrorMessage(err.message ?? "Error inesperado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const configuredCount = Object.values(collaboratorForms).filter(
    (f) => f.percentage && parseFloat(f.percentage) > 0,
  ).length;

  /** Suma de todos los porcentajes que se están asignando a colaboradores. */
  const totalAssignedPercentage = Object.values(collaboratorForms).reduce(
    (sum, f) => sum + (parseFloat(f.percentage) || 0),
    0,
  );

  const hasAnySavedSplit = collaborators.some((c) => Boolean(c.split));

  /**
   * Con tramos, sumar los porcentajes de todos deja de significar nada: dos
   * personas al 80% no se pisan si cobran en meses distintos. La cabecera lo
   * usa para dejar de anunciar un total que no se cumple en ningún mes.
   */
  const hasAnyPeriod = Object.values(collaboratorForms).some((f) => f.periods.length > 0);

  return {
    mounted,
    isLoading,
    isLoadingFilters,
    countryOptions,
    platformOptions,
    errorMessage,
    successMessage,
    collaboratorForms,
    expandedCollaborators,
    configuredCount,
    totalAssignedPercentage,
    hasAnySavedSplit,
    hasAnyPeriod,
    getForm,
    toggleExpanded,
    updateForm,
    addPeriod,
    removePeriod,
    updatePeriod,
    saveSplit,
  };
}
