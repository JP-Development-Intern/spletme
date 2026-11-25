import { useEffect, useState } from "react";
import { Clock3, Loader2, ShieldCheck } from "lucide-react";
import { PermissionsService } from "@/services/permissions";
import type { PermissionResourceType } from "@/types/permissions.types";

interface RequestEditSplitButtonProps {
  resourceType: PermissionResourceType;
  resourceId: string;
  /** Mensaje opcional enviado al owner junto con la solicitud. */
  message?: string;
  onToast?: (type: "success" | "error", msg: string) => void;
}

/**
 * Botón para usuarios con rol `label` que aún no tienen `canEditSplits: true`.
 * Consulta las solicitudes enviadas para reflejar si ya existe una pendiente.
 */
export function RequestEditSplitButton({
  resourceType,
  resourceId,
  message = "Solicito permiso para editar los splits de este recurso.",
  onToast,
}: RequestEditSplitButtonProps) {
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceId) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);

    PermissionsService.getSentRequests()
      .then(({ requests }) => {
        if (cancelled) return;
        const hasPending = requests.some(
          (req) =>
            req.status === "pending" &&
            req.resourceType === resourceType &&
            req.resourceId === resourceId &&
            Array.isArray(req.requestedGrants) &&
            req.requestedGrants.includes("canEditSplits"),
        );
        setPending(hasPending);
      })
      .catch(() => {
        /* si falla la consulta previa, permitimos intentar solicitar */
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resourceType, resourceId]);

  const handleRequest = async () => {
    if (!resourceId || pending || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await PermissionsService.createRequest({
        resourceType,
        resourceId,
        requestedGrants: ["canEditSplits"],
        message,
      });
      setPending(true);
      const msg = "Solicitud enviada al propietario.";
      if (onToast) onToast("success", msg);
      else setFeedback(msg);
    } catch {
      const msg = "No se pudo enviar la solicitud.";
      if (onToast) onToast("error", msg);
      else setFeedback(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (pending) {
    return (
      <span
        title="Ya enviaste una solicitud pendiente al propietario"
        className="glass-control inline-flex min-h-[44px] items-center gap-2 rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-[#FFB48A]"
      >
        <Clock3 className="h-[15px] w-[15px]" />
        Solicitud enviada
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRequest}
        disabled={checking || submitting || !resourceId}
        className="glass-control inline-flex min-h-[44px] items-center gap-2 rounded-full px-[18px] py-[11px] text-[12.5px] font-semibold text-white transition-colors enabled:hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="h-[15px] w-[15px] animate-spin text-[#FF8A3D]" />
        ) : (
          <ShieldCheck className="h-[15px] w-[15px] text-[#FF8A3D]" />
        )}
        {submitting ? "Enviando…" : "Solicitar permiso para editar"}
      </button>
      {feedback && <span className="text-[11px] text-[#45D39A]">{feedback}</span>}
    </div>
  );
}
