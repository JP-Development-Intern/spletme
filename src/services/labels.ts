import { apiClient } from "@/infrastructure/http/axiosClient";
import axios from "axios";

export interface Label {
  /** Id del sello en `artistic_labels`: es lo que lo identifica en URLs y peticiones. */
  _id: string;
  /** Nombre del sello, para mostrarlo. `null` en el de las canciones sin sello. */
  label: string;
  count: number;
  totalStreams: number;
  totalGrossIncome: number;
  totalNetIncome: number;
  ownerEarnings: number;
  /** Pendiente de pago a colaboradores según los splits activos. */
  totalToPay?: number;
  topSongs: Array<{
    _id: string;
    trackTitle: string;
    artistName: string;
    isrc: string;
  }>;
  splitProgress: {
    total: number;
    withSplits: number;
    percentage: number;
    hasAllSplits: boolean;
  };
  isCustom?: boolean;
  /** Colaboradores con split en las canciones del sello, sin repetir. */
  collaborators?: LabelCollaborator[];
}

export interface LabelCollaborator {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
}

/** Un sello artístico referenciado desde otro (un personalizado): id y nombre. */
export interface ArtisticLabelRef {
  _id: string;
  name: string;
}

export interface CustomLabel {
  _id: string;
  name: string;
  /** Ids de los sellos artísticos que agrupa: lo que decide sus canciones. */
  artisticLabelIds: string[];
  /** Los mismos sellos, con su nombre para mostrarlos. */
  artisticLabels: ArtisticLabelRef[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalSongs: number;
    totalStreams: number;
    totalGrossIncome: number;
    totalNetIncome: number;
    ownerEarnings: number;
    totalToPay?: number;
  };
}

/** Un sello artístico tal como lo guarda `artistic_labels`: id, nombre y totales. */
export interface ArtisticLabelSummary {
  _id: string;
  name: string;
  totalTracks: number;
  totalStreams: number;
  totalGrossIncome: number;
  totalNetIncome: number;
}

export interface LabelSong {
  _id: string;
  isrc: string;
  upc: string;
  trackTitle: string;
  artistName: string;
  artisticLabel: string;
  releaseTitle: string;
  totalStreams: number;
  totalGrossIncome: number;
  totalNetIncome: number;
  ownerSplit: {
    _id: string;
    percentage: number;
    averagePercentage: number;
    countriesType?: "all" | "except" | "only";
    selectedCountries?: string[];
    platformsType?: "all" | "except" | "only";
    selectedPlatforms?: string[];
  } | null;
  ownerEarnings: number;
  /** Lo que queda por pagar a los colaboradores, cuando el backend lo calcula. */
  collaboratorsPending?: number;
  collaboratorsEarnings?: number;
  ownerId: { _id: string; name: string; email: string };
  /**
   * Colaboradores de la canción. `id` es el identificador generado del usuario,
   * que es el que espera el endpoint de splits para identificar al participante.
   */
  collaborators: { _id?: string; id?: string; name?: string; username?: string; email?: string }[];
  releases: unknown[];
  spotifyData?: {
    album?: {
      images?: Array<{ url: string; width?: number; height?: number }>;
    };
  };
  paymentInfo?: {
    totalIncome: number;
    totalPaid: number;
    pendingAmount: number;
    paymentCount: number;
    lastPaymentDate?: string;
    lastPaymentAmount?: number;
  };
}

export interface LabelSplitPayload {
  percentage: number;
  countriesType: "all" | "except" | "only";
  selectedCountries: string[];
  platformsType: "all" | "except" | "only";
  selectedPlatforms: string[];
}

const errMsg = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? fallback;
  return fallback;
};

class LabelsService {
  private readonly BASE = "/labels";

  /** Obtiene todos los labels del usuario */
  async getLabels(): Promise<{
    error: boolean;
    data?: Label[];
    message?: string;
  }> {
    try {
      const response = await apiClient.get(`${this.BASE}?t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      });
      return response.data;
    } catch {
      return { error: true, message: "Error getting labels" };
    }
  }

  /** Obtiene las canciones de un label específico */
  async getSongsByLabel(
    label: string,
  ): Promise<{
    error: boolean;
    data?: LabelSong[];
    label?: ArtisticLabelSummary;
    message?: string;
    /** El sello no está en `artistic_labels` (o se quedó sin canciones). */
    notFound?: boolean;
  }> {
    try {
      // `label` es el id del sello; un nombre (enlaces antiguos) también se acepta.
      const response = await apiClient.get(`${this.BASE}/${encodeURIComponent(label)}`);
      return response.data;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      return { error: true, notFound: status === 404, message: "Error getting songs by label" };
    }
  }

  /** Crea un nuevo label personalizado */
  async createLabel(data: { name: string; artisticLabelIds: string[] }): Promise<{
    error: boolean;
    data?: {
      label: {
        _id: string;
        name: string;
        artisticLabelIds: string[];
        artisticLabels: ArtisticLabelRef[];
        ownerId: string;
        createdAt: string;
        updatedAt: string;
      };
      stats: {
        totalSongs: number;
        totalStreams: number;
        totalGrossIncome: number;
        totalNetIncome: number;
      };
      warnings?: { message: string; excludedLabels: string[] };
    };
    message?: string;
  }> {
    try {
      const response = await apiClient.post(`${this.BASE}/create-label`, data);
      return response.data;
    } catch (error) {
      return { error: true, message: errMsg(error, "Error creating label") };
    }
  }

  /** Obtiene los labels personalizados del usuario */
  async getCustomLabels(): Promise<{
    error: boolean;
    data?: CustomLabel[];
    message?: string;
  }> {
    try {
      const response = await apiClient.get(`${this.BASE}/custom`);
      return response.data;
    } catch {
      return { error: true, message: "Error getting custom labels", data: [] };
    }
  }

  /** Obtiene las canciones de un label personalizado */
  async getSongsByCustomLabel(labelName: string): Promise<{
    error: boolean;
    data?: {
      customLabel: {
        _id: string;
        name: string;
        artisticLabelIds: string[];
        artisticLabels: ArtisticLabelRef[];
        createdAt: string;
      };
      songs: LabelSong[];
    };
    message?: string;
  }> {
    try {
      const response = await apiClient.get(`${this.BASE}/custom/${encodeURIComponent(labelName)}`);
      return response.data;
    } catch {
      return { error: true, message: "Error getting songs by custom label" };
    }
  }

  /** Crea/actualiza el owner split de todas las canciones de un sello artístico, por su id */
  async createSplitByLabel(
    data: LabelSplitPayload & { labelId: string },
  ): Promise<{ error: boolean; data?: unknown; message?: string }> {
    try {
      const response = await apiClient.post(`${this.BASE}/create-split-by-label`, data);
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error creating split by label"),
      };
    }
  }

  /** Crea/actualiza el owner split de todas las canciones de un label personalizado */
  async createSplitByCustomLabel(
    data: LabelSplitPayload & { labelName: string },
  ): Promise<{ error: boolean; data?: unknown; message?: string }> {
    try {
      const response = await apiClient.post(`${this.BASE}/create-split-by-custom-label`, data);
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error creating split by custom label"),
      };
    }
  }

  /** Actualiza un label personalizado */
  async updateLabel(
    labelId: string,
    data: { name?: string; artisticLabelIds?: string[] },
  ): Promise<{
    error: boolean;
    data?: {
      label: {
        _id: string;
        name: string;
        artisticLabelIds: string[];
        artisticLabels: ArtisticLabelRef[];
        ownerId: string;
        createdAt: string;
        updatedAt: string;
      };
      stats: {
        totalSongs: number;
        totalStreams: number;
        totalGrossIncome: number;
        totalNetIncome: number;
      };
      warnings?: { message: string; excludedLabels: string[] } | null;
    };
    message?: string;
  }> {
    try {
      const response = await apiClient.put(`${this.BASE}/custom/${labelId}`, data);
      return response.data;
    } catch (error) {
      return { error: true, message: errMsg(error, "Error updating label") };
    }
  }

  /** Elimina un label personalizado */
  async deleteLabel(labelId: string): Promise<{ error: boolean; message?: string }> {
    try {
      const response = await apiClient.delete(`${this.BASE}/custom/${labelId}`);
      return response.data;
    } catch (error) {
      return { error: true, message: errMsg(error, "Error deleting label") };
    }
  }

  /** Invita a un colaborador a un label */
  async inviteCollaboratorToLabel(data: {
    labelType: "artistic" | "custom";
    /** Id del sello: el de `artistic_labels` o el del personalizado. */
    labelIdentifier: string;
    collaboratorEmail: string;
  }): Promise<{
    error: boolean;
    data?: {
      _id: string;
      labelType: string;
      labelName: string;
      collaboratorId: string | null;
      /** Null cuando esa persona todavía no tiene cuenta. */
      collaboratorName: string | null;
      collaboratorEmail: string;
      /** Si el enlace la llevará primero a crear su cuenta. */
      needsAccount?: boolean;
      status: string;
      totalSongs: number;
      expiresAt: string;
    };
    message?: string;
  }> {
    try {
      const response = await apiClient.post(`${this.BASE}/invite-collaborator`, data);
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error inviting collaborator"),
      };
    }
  }

  /** Acepta una invitación a un label */
  async acceptLabelInvitation(token: string): Promise<{
    error: boolean;
    data?: {
      labelName: string;
      labelType: string;
      results: {
        successful: Array<{
          songId: string;
          trackTitle: string;
          artistName: string;
          artisticLabel: string;
        }>;
        alreadyCollaborator: Array<{
          songId: string;
          trackTitle: string;
          artistName: string;
          artisticLabel: string;
        }>;
        failed: Array<{
          songId: string;
          trackTitle: string;
          artisticLabel: string;
          reason: string;
        }>;
        summary: {
          total: number;
          added: number;
          alreadyExists: number;
          errors: number;
        };
      };
    };
    message?: string;
  }> {
    try {
      const response = await apiClient.post(`${this.BASE}/accept-invitation`, {
        token,
      });
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error accepting invitation"),
      };
    }
  }

  /** Rechaza una invitación a un label */
  async rejectLabelInvitation(token: string): Promise<{ error: boolean; message?: string }> {
    try {
      const response = await apiClient.post(`${this.BASE}/reject-invitation`, {
        token,
      });
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error rejecting invitation"),
      };
    }
  }

  /** Obtiene las invitaciones pendientes (como colaborador) */
  async getPendingInvitations(): Promise<{
    error: boolean;
    data?: unknown[];
    message?: string;
  }> {
    try {
      const response = await apiClient.get(`${this.BASE}/invitations/pending`);
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error getting invitations"),
        data: [],
      };
    }
  }

  /** Obtiene las invitaciones enviadas (como owner) */
  async getSentInvitations(): Promise<{
    error: boolean;
    data?: unknown[];
    message?: string;
  }> {
    try {
      const response = await apiClient.get(`${this.BASE}/invitations/sent`);
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error getting invitations"),
        data: [],
      };
    }
  }

  /** Cancela una invitación enviada */
  async cancelInvitation(invitationId: string): Promise<{ error: boolean; message?: string }> {
    try {
      const response = await apiClient.delete(`${this.BASE}/invitations/${invitationId}/cancel`);
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error canceling invitation"),
      };
    }
  }

  /** Rechaza una invitación recibida */
  async rejectInvitation(invitationId: string): Promise<{ error: boolean; message?: string }> {
    try {
      const response = await apiClient.post(`${this.BASE}/invitations/${invitationId}/reject`, {});
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: errMsg(error, "Error rejecting invitation"),
      };
    }
  }
}

export default new LabelsService();
