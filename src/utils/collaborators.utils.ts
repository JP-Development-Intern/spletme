import type { Collaborator, CollaboratorStatus, CollaboratorPayment } from "@/types";
export { formatCurrency, formatCompactCurrency } from "@/utils/format.utils";

interface BadgeStyle {
  bg: string;
  text: string;
  dot: string;
  label: string;
}

/** Devuelve las clases Tailwind y la etiqueta para un estado de colaborador */
export const getStatusBadge = (status: CollaboratorStatus): BadgeStyle => {
  switch (status) {
    case "active":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        dot: "bg-green-500",
        label: "Activo",
      };
    case "pending":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
        label: "Pendiente",
      };
    case "no_wallet":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
        label: "Sin wallet",
      };
  }
};

interface PaymentBadgeStyle {
  bg: string;
  text: string;
  label: string;
}

/** Devuelve las clases Tailwind y la etiqueta para un estado de pago */
export const getPaymentStatusBadge = (status: CollaboratorPayment["status"]): PaymentBadgeStyle => {
  switch (status) {
    case "completed":
      return { bg: "bg-green-50", text: "text-green-700", label: "Completado" };
    case "processing":
      return { bg: "bg-amber-50", text: "text-amber-700", label: "Procesando" };
    case "failed":
      return { bg: "bg-red-50", text: "text-red-700", label: "Fallido" };
  }
};

/* ── Estado de cuenta ──────────────────────────────────────────────────────── */

/**
 * Situación de cobro de un colaborador, dicha desde lo que puedes hacer con él.
 *
 * El API entrega tres estados (`active`, `pending`, `no_wallet`) que mezclan dos
 * cosas distintas: si la persona puede recibir dinero y si le debes algo. Aquí se
 * separan, porque son dos preguntas con respuestas distintas.
 */
export type CollaboratorState = "can_pay" | "no_payout_data" | "settled" | "no_activity";

export function resolveCollaboratorState(collaborator: Collaborator): CollaboratorState {
  if (collaborator.status === "no_wallet") return "no_payout_data";
  if (collaborator.amountPending > 0) return "can_pay";
  if (collaborator.paid > 0) return "settled";
  return "no_activity";
}

export interface StateMeta {
  label: string;
  /** Color del texto y del icono. */
  fg: string;
  bg: string;
}

export const STATE_META: Record<CollaboratorState, StateMeta> = {
  can_pay: { label: "Puede cobrar", fg: "#2FB37E", bg: "#E4F5EC" },
  no_payout_data: { label: "Sin datos de cobro", fg: "#E5484D", bg: "#FDECEC" },
  settled: { label: "Al día", fg: "#71757E", bg: "#F4F5F7" },
  no_activity: { label: "Sin movimientos", fg: "#A6AAB2", bg: "#F4F5F7" },
};

/** Los mismos estados sobre el vidrio oscuro del panel: tonos claros que pasan contraste. */
export const STATE_META_ON_GLASS: Record<CollaboratorState, StateMeta> = {
  can_pay: { label: "Puede cobrar", fg: "#45D39A", bg: "rgba(69, 211, 154, 0.12)" },
  no_payout_data: { label: "Sin datos de cobro", fg: "#FF8F92", bg: "rgba(229, 72, 77, 0.16)" },
  settled: { label: "Al día", fg: "rgba(255, 255, 255, 0.7)", bg: "rgba(255, 255, 255, 0.08)" },
  no_activity: { label: "Sin movimientos", fg: "rgba(255, 255, 255, 0.5)", bg: "rgba(255, 255, 255, 0.05)" },
};

/**
 * Color de las iniciales sobre el color de identidad. Los tonos claros de la
 * paleta (naranja, verde, ámbar, rojo, verde azulado) llevan tinta: en blanco
 * no llegan al contraste mínimo.
 */
export function avatarTextColor(background: string): string {
  return ["#1C1D22", "#7C5CFF", "#0B7DDA"].includes(background.toUpperCase()) ? "#FFFFFF" : "#1C1D22";
}

/** Porcentaje del total que ya está pagado, 0-100. */
export function settledPercentage(paid: number, pending: number): number {
  const total = (paid ?? 0) + (pending ?? 0);
  if (total <= 0) return 0;
  return ((paid ?? 0) / total) * 100;
}

/**
 * Paleta de identidad de los colaboradores. El mismo color acompaña a la persona
 * en su avatar de la tabla, del perfil y de la lista de pagos.
 */
export const COLLABORATOR_COLORS = [
  "#FF5C00",
  "#1C1D22",
  "#2FB37E",
  "#F0A202",
  "#7C5CFF",
  "#0B7DDA",
  "#E5484D",
  "#0E9594",
];

export function collaboratorColor(index: number): string {
  return COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length];
}

/** Iniciales a partir del nombre, máximo dos letras. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Cómo se lee un rol de membresía en pantalla.
 *
 * El sello y el colaborador se reparten igual; la diferencia es que un sello
 * además puede configurar splits, así que distinguirlos de un vistazo importa a
 * la hora de dar acceso. El backend los manda en crudo (`collaborator`,
 * `label`), que no es algo que se pueda enseñar tal cual.
 */
export const describeRole = (role: string): { role: string; isLabel: boolean; short: string; long: string } => {
  const normalized = role.toLowerCase();
  const isLabel = normalized.includes("label") || normalized.includes("sello");
  return {
    role,
    isLabel,
    short: isLabel ? "Sello" : "Colab.",
    long: isLabel ? "Sello" : "Colaborador",
  };
};

/** Los roles de un colaborador, ya traducidos y sin repetir. */
export const describeRoles = (roles: string[] = []) => roles.map(describeRole);
