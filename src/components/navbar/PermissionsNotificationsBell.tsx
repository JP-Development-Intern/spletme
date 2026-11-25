import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, Check, Clock3, ShieldCheck, X } from "lucide-react";
import LocalStorageService from "@/services/localstorage";
import { PermissionsService } from "@/services/permissions";
import type { PermissionGrantKey, PermissionRequest } from "@/types/permissions.types";

const GRANT_LABELS: Record<PermissionGrantKey, string> = {
  viewIncome: "Ver ingresos",
  viewStreams: "Ver streams",
  viewCollaborators: "Ver colaboradores",
  viewDocuments: "Ver documentos",
  canEditSplits: "Editar splits",
  canInviteCollaborators: "Invitar colaboradores",
  canViewOwnerData: "Ver datos del owner",
};

const RESOURCE_LABELS: Record<string, string> = {
  song: "Canción",
  album: "Álbum",
  label: "Sello",
  customLabel: "Sello personalizado",
  all: "Catálogo",
};

const POLL_INTERVAL_MS = 30_000;

function requesterDisplay(req: PermissionRequest): string {
  if (req.requesterName) return req.requesterName;
  if (req.requesterId && typeof req.requesterId === "object") {
    return req.requesterId.name || req.requesterId.email || "Usuario";
  }
  return req.requesterEmail || "Sello";
}

function statusBadge(status: PermissionRequest["status"]) {
  if (status === "approved") {
    return (
      <span className="rounded-full bg-[#45D39A]/[0.14] px-2 py-0.5 text-[10.5px] font-semibold text-[#45D39A]">
        Aprobada
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="rounded-full bg-[#E5484D]/[0.14] px-2 py-0.5 text-[10.5px] font-semibold text-[#FF8F92]">
        Rechazada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00]/[0.16] px-2 py-0.5 text-[10.5px] font-semibold text-[#FF9A5C]">
      <Clock3 className="h-2.5 w-2.5" />
      Pendiente
    </span>
  );
}

/**
 * Campana de notificaciones de permisos en el navbar:
 * - Para el Owner: muestra solicitudes recibidas pendientes con Aceptar / Rechazar.
 * - Para el Label: muestra el estado de sus solicitudes enviadas.
 */
export function PermissionsNotificationsBell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actingId, setActingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stored = LocalStorageService.getItem("user");
  const userRole = String(stored?.role ?? "").toLowerCase();
  const isLabel = userRole === "label";
  const isOwner = !stored?.parentUserId && userRole !== "label" && userRole !== "collaborator";

  const fetchNotifications = useCallback(async () => {
    if (!isOwner && !isLabel) return;
    try {
      const data = isOwner
        ? await PermissionsService.getReceivedRequests("pending")
        : await PermissionsService.getSentRequests();
      setRequests(data.requests);
      setUnreadCount(data.unreadCount);
    } catch {
      /* silencioso en polling de fondo */
    }
  }, [isOwner, isLabel]);

  useEffect(() => {
    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [fetchNotifications, location.pathname]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleToggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      try {
        await PermissionsService.markAllRequestsRead();
      } catch {
        /* no bloquea la apertura del panel */
      }
    }
  };

  const handleItemClick = async (req: PermissionRequest) => {
    const id = req._id || req.id;
    if (!id) return;
    try {
      await PermissionsService.markRequestRead(id);
    } catch {
      /* silencioso */
    }
  };

  const handleDecision = async (req: PermissionRequest, action: "approve" | "reject") => {
    const id = req._id || req.id;
    if (!id || actingId) return;
    setActingId(id);
    try {
      if (action === "approve") await PermissionsService.approveRequest(id);
      else await PermissionsService.rejectRequest(id);
      setRequests((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch {
      /* mantener el item si falló */
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label="Notificaciones"
        aria-expanded={open}
        className="glass-control relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/[0.12]"
      >
        <Bell className="h-[18px] w-[18px] text-white" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF5C00] px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-menu absolute right-0 top-[calc(100%+10px)] z-30 w-[340px] max-w-[90vw] rounded-[22px] p-3">
          <div className="flex items-center justify-between gap-2 px-1.5 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#FF8A3D]" />
              <span className="text-[13px] font-semibold text-white">Notificaciones</span>
            </div>
            {requests.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setUnreadCount(0);
                  PermissionsService.markAllRequestsRead().catch(() => {});
                }}
                className="text-[11px] font-medium text-[#FF8A3D] hover:underline"
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="h-px bg-white/10" />

          {requests.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-[12.5px] font-medium text-white/70">No tienes notificaciones</p>
              <p className="mt-1 text-[11px] text-white/45">
                {isOwner
                  ? "Aquí aparecerán las solicitudes de permisos de tus sellos."
                  : "Aquí verás cuando respondan a tus solicitudes de permisos."}
              </p>
            </div>
          ) : (
            <ul className="mt-2 flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-0.5">
              {requests.map((req) => {
                const id = req._id || req.id || `${req.resourceType}-${req.resourceId}`;
                const grantsText = (req.requestedGrants ?? [])
                  .map((g) => GRANT_LABELS[g] ?? g)
                  .join(", ");
                const resourceLabel = RESOURCE_LABELS[req.resourceType] ?? req.resourceType;
                const busy = actingId === id;

                return (
                  <li
                    key={id}
                    onClick={() => handleItemClick(req)}
                    className="flex flex-col gap-2 rounded-[16px] border border-white/[0.08] bg-white/[0.05] p-3 transition-colors hover:bg-white/[0.08]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-white">
                          {isOwner ? requesterDisplay(req) : req.resourceTitle || req.resourceId}
                        </p>
                        <p className="truncate text-[11px] text-white/60">
                          {resourceLabel}
                          {req.resourceTitle && isOwner ? ` · ${req.resourceTitle}` : ""}
                        </p>
                      </div>
                      {!isOwner && statusBadge(req.status)}
                    </div>

                    {grantsText && (
                      <p className="text-[11px] text-[#FFB48A]">Solicita: {grantsText}</p>
                    )}

                    {req.message && (
                      <p className="line-clamp-2 text-[11px] text-white/55">{req.message}</p>
                    )}

                    {isOwner && req.status === "pending" && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecision(req, "approve");
                          }}
                          className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#FF5C00] px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#EA580C] disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Aceptar
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecision(req, "reject");
                          }}
                          className="glass-control flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-white/85 transition-colors hover:bg-white/[0.14] disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Rechazar
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
