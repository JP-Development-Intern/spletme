import { apiClient } from "@/infrastructure/http/axiosClient";
import type {
  CreatePermissionRequestPayload,
  GranteeRole,
  PermissionGrantee,
  PermissionGrants,
  PermissionRequest,
  PermissionRequestsListResponse,
  PermissionRequestStatus,
  PermissionResourceType,
} from "@/types/permissions.types";

function normalizeRequestsList(payload: unknown): PermissionRequestsListResponse {
  const root = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray(root)) {
    return { requests: root as PermissionRequest[], unreadCount: 0 };
  }
  const obj = (root ?? {}) as {
    requests?: PermissionRequest[];
    items?: PermissionRequest[];
    unreadCount?: number;
  };
  const requests = Array.isArray(obj.requests)
    ? obj.requests
    : Array.isArray(obj.items)
      ? obj.items
      : [];
  return {
    requests,
    unreadCount: typeof obj.unreadCount === "number" ? obj.unreadCount : 0,
  };
}

/** Permisos que el owner concede a colaboradores y labels, por recurso o globalmente. */
export class PermissionsService {
  private static readonly BASE = "/permissions";

  /** Colaboradores y labels con acceso al recurso, con lo que se les ha concedido. */
  static async list(
    resourceType: PermissionResourceType,
    resourceId: string,
  ): Promise<PermissionGrantee[]> {
    const response = await apiClient.get(
      `${this.BASE}/${resourceType}/${encodeURIComponent(resourceId)}`,
    );
    return response.data?.data ?? [];
  }

  /** Cambia solo los permisos indicados de una persona sobre el recurso. */
  static async set(
    resourceType: PermissionResourceType,
    resourceId: string,
    granteeUserId: string,
    grants: Partial<PermissionGrants>,
  ): Promise<PermissionGrantee> {
    const response = await apiClient.put(
      `${this.BASE}/${resourceType}/${encodeURIComponent(resourceId)}/${granteeUserId}`,
      grants,
    );
    return response.data?.data;
  }

  /** Plantilla general por defecto del owner para un rol (`collaborator` | `label`). */
  static async getDefaults(role: GranteeRole): Promise<PermissionGrants> {
    const response = await apiClient.get(`${this.BASE}/defaults/${role}`);
    return response.data?.data ?? response.data;
  }

  /** Guarda la plantilla general por defecto del owner para ese rol. */
  static async setDefaults(
    role: GranteeRole,
    grants: Partial<PermissionGrants>,
  ): Promise<PermissionGrants> {
    const response = await apiClient.put(`${this.BASE}/defaults/${role}`, grants);
    return response.data?.data ?? response.data;
  }

  /** Propaga la plantilla por defecto al nivel global de todos los usuarios de ese rol. */
  static async applyDefaults(role: GranteeRole): Promise<{ updated?: number }> {
    const response = await apiClient.post(`${this.BASE}/defaults/${role}/apply`);
    return response.data?.data ?? response.data ?? {};
  }

  /** Solicita permisos sobre un recurso al propietario (p. ej. `canEditSplits`). */
  static async createRequest(
    payload: CreatePermissionRequestPayload,
  ): Promise<PermissionRequest> {
    const response = await apiClient.post(`${this.BASE}/requests`, payload);
    return response.data?.data ?? response.data;
  }

  /** Solicitudes enviadas por el usuario actual (para rol label). */
  static async getSentRequests(): Promise<PermissionRequestsListResponse> {
    const response = await apiClient.get(`${this.BASE}/requests/sent`);
    return normalizeRequestsList(response.data);
  }

  /** Solicitudes recibidas por el owner (filtrables por estado). */
  static async getReceivedRequests(
    status?: PermissionRequestStatus,
  ): Promise<PermissionRequestsListResponse> {
    const response = await apiClient.get(`${this.BASE}/requests/received`, {
      params: status ? { status } : undefined,
    });
    return normalizeRequestsList(response.data);
  }

  /** Aprueba una solicitud de permiso (owner). */
  static async approveRequest(id: string): Promise<PermissionRequest> {
    const response = await apiClient.post(`${this.BASE}/requests/${id}/approve`);
    return response.data?.data ?? response.data;
  }

  /** Rechaza una solicitud de permiso (owner). */
  static async rejectRequest(id: string): Promise<PermissionRequest> {
    const response = await apiClient.post(`${this.BASE}/requests/${id}/reject`);
    return response.data?.data ?? response.data;
  }

  /** Marca una solicitud como leída. */
  static async markRequestRead(id: string): Promise<void> {
    await apiClient.patch(`${this.BASE}/requests/${id}/read`);
  }

  /** Marca todas las solicitudes como leídas. */
  static async markAllRequestsRead(): Promise<void> {
    await apiClient.patch(`${this.BASE}/requests/read-all`);
  }
}
