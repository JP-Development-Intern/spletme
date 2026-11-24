import { apiClient } from "@/infrastructure/http/axiosClient";
import type {
  GranteeRole,
  PermissionGrantee,
  PermissionGrants,
  PermissionResourceType,
} from "@/types/permissions.types";

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
}
