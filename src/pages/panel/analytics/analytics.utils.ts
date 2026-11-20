import { PLATFORM_BRAND, platformColorOnDark } from "@/const/platformBrand";

/**
 * Tonos para las plataformas que no están en `PLATFORM_BRAND`. Son apagados a
 * propósito: no deben parecer el color de ninguna marca, solo separar una
 * barra de la siguiente.
 */
const UNKNOWN_PLATFORM_TONES = ["#C9B8AD", "#8E7F76", "#B98B6E", "#7E8C99", "#A69A8F", "#6F6560"];

/** Color de una plataforma sobre el vidrio; `index` reparte los tonos de las desconocidas. */
export const platformColor = (name: string, index = 0): string =>
  PLATFORM_BRAND[name]
    ? platformColorOnDark(name)
    : UNKNOWN_PLATFORM_TONES[index % UNKNOWN_PLATFORM_TONES.length];

/** Los endpoints devuelven algunos nombres de grupo en inglés. */
export const displayName = (name: string | null | undefined, fallback = "Sin dato"): string => {
  if (!name || name === "Unknown") return fallback;
  if (name === "Others") return "Otras";
  return name;
};

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["es"], { type: "region" });
  } catch {
    return null;
  }
})();

/**
 * País tal como llega del reporte. Si es un código ISO de dos letras se acompaña
 * del nombre en español, porque «AR» o «AT» obligan a adivinar.
 */
export const countryLabel = (raw: string | null | undefined): { code: string | null; name: string } => {
  const value = (raw ?? "").trim();
  if (!value || value === "Unknown") return { code: null, name: "Sin país" };
  if (/^[A-Za-z]{2}$/.test(value)) {
    const code = value.toUpperCase();
    let name = code;
    try {
      name = regionNames?.of(code) ?? code;
    } catch {
      name = code;
    }
    return { code, name };
  }
  return { code: null, name: value };
};

const MONTH_FORMAT = new Intl.DateTimeFormat("es", { month: "short", year: "numeric", timeZone: "UTC" });

/** "2025-10-01" o "2025-10" → "oct 2025". */
export const formatMonth = (value: string | null | undefined): string => {
  if (!value) return "—";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return MONTH_FORMAT.format(new Date(Date.UTC(year, month - 1, 1))).replace(".", "");
};

/**
 * Ingreso por cada 1.000 streams. Es la medida con la que la industria compara
 * plataformas y canciones: los totales premian el volumen, esta el valor.
 */
export const perThousand = (income: number, streams: number): number | null =>
  streams > 0 ? (income / streams) * 1000 : null;

export const formatPerThousand = (value: number | null): string =>
  value === null ? "—" : `$${value.toFixed(value >= 10 ? 2 : 3)}`;
