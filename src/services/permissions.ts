import { apiClient } from "@/infrastructure/http/axiosClient";
import type {
  PermissionGrantee,
  PermissionGrants,
  PermissionResourceType,
} from "@/types/permissions.types";

/** Permisos que el owner concede a colaboradores y labels, por canción o álbum. */
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
}
