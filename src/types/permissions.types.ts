export type PermissionResourceType = "song" | "album";

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
}
