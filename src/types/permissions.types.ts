export type PermissionResourceType = "song" | "album" | "label" | "customLabel" | "all";

export type GranteeRole = "collaborator" | "label";

/** Lo que el owner concede sobre un recurso. Los tres últimos solo aplican a labels. */
export interface PermissionGrants {
  viewIncome: boolean;
  viewStreams: boolean;
  viewCollaborators: boolean;
  viewDocuments: boolean;
  canEditSplits: boolean;
  canInviteCollaborators: boolean;
  canViewOwnerData: boolean;
}

export type PermissionGrantKey = keyof PermissionGrants;

export interface PermissionGrantee {
  userId: string;
  name: string;
  email: string;
  role: GranteeRole;
  grants: PermissionGrants;
  /** Claves fijadas explícitamente en este nivel; las omitidas son heredadas. */
  explicit?: Partial<PermissionGrants>;
}

export type PermissionRequestStatus = "pending" | "approved" | "rejected";

export interface PermissionRequest {
  _id: string;
  id?: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  resourceTitle?: string;
  requesterId?: string | { _id?: string; name?: string; email?: string };
  requesterName?: string;
  requesterEmail?: string;
  ownerId?: string | { _id?: string; name?: string; email?: string };
  requestedGrants: PermissionGrantKey[];
  message?: string;
  status: PermissionRequestStatus;
  read?: boolean;
  ownerRead?: boolean;
  requesterRead?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePermissionRequestPayload {
  resourceType: PermissionResourceType;
  resourceId: string;
  requestedGrants: PermissionGrantKey[];
  message?: string;
}

export interface PermissionRequestsListResponse {
  requests: PermissionRequest[];
  unreadCount: number;
}
