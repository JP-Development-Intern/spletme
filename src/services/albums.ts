import { apiClient } from "@/infrastructure/http/axiosClient";
import type {
  Album,
  AlbumsResponse,
  AlbumResponse,
  AlbumsError,
  AlbumsListParams,
} from "../models/album";
import type { AlbumBalance } from "../types/accounting.types";

/** Lo que devuelve el servidor tras enviar una invitación de álbum. */
export interface AlbumInvitationResult {
  invitationId: string;
  albumTitle: string;
  collaboratorName: string | null;
  collaboratorEmail: string;
  /** Pistas que cubre la invitación. */
  totalSongs: number;
  /** Pistas que quedaron fuera porque esa persona ya colaboraba en ellas. */
  alreadyCollaborating: number;
  /** Si todavía no tiene cuenta y el enlace la llevará primero a crearla. */
  needsAccount: boolean;
  expiresAt: string;
}

/** Resultado de aceptar una invitación de álbum, pista por pista. */
export interface AlbumAcceptanceResult {
  upc: string;
  albumTitle: string;
  artistName: string;
  collaboratorName: string;
  summary: { total: number; added: number; alreadyExists: number; errors: number };
  songs: string[];
}

class AlbumService {
  private readonly BASE = "/albums";

  /**
   * Una página de los álbumes del usuario, con su búsqueda, sus filtros y su
   * orden.
   *
   * Todo viaja al servidor: es él quien sabe cuántos álbumes hay detrás de la
   * página y en qué orden van.
   */
  async getAlbums(listParams: AlbumsListParams): Promise<AlbumsResponse | AlbumsError> {
    try {
      const params = new URLSearchParams();
      Object.entries(listParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        params.set(key, String(value));
      });
      const response = await apiClient.get(`${this.BASE}/albums?${params.toString()}`);
      return response.data as AlbumsResponse;
    } catch (error: unknown) {
      const axErr = error as {
        response?: { data?: AlbumsError };
        message?: string;
      };
      if (axErr.response?.data) return axErr.response.data;
      return {
        success: false,
        message: "Error retrieving albums",
        error: axErr.message ?? "Unknown error",
      };
    }
  }

  /**
   * Obtiene un álbum específico por UPC.
   */
  async getAlbumByUPC(upc: string): Promise<AlbumResponse | AlbumsError> {
    try {
      if (!upc) return { success: false, message: "UPC parameter is required" };
      const response = await apiClient.get(`${this.BASE}/albums/${encodeURIComponent(upc)}`);
      return response.data as AlbumResponse;
    } catch (error: unknown) {
      const axErr = error as {
        response?: { data?: AlbumsError };
        message?: string;
      };
      if (axErr.response?.data) return axErr.response.data;
      return {
        success: false,
        message: "Error retrieving album",
        error: axErr.message ?? "Unknown error",
      };
    }
  }

  /**
   * Obtiene métricas mensuales de streams e ingresos de un álbum.
   */
  async getAlbumMonthlyMetrics(
    upc: string,
    months = 12,
  ): Promise<{ month: string; streams: number; revenue: number }[]> {
    try {
      if (!upc) return [];
      const response = await apiClient.get(
        `${this.BASE}/albums/${encodeURIComponent(upc)}/monthly-metrics?months=${months}`,
      );
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Devuelve todos los álbumes del usuario (sin paginación).
   */
  async getAllAlbums(): Promise<Album[] | null> {
    try {
      const response = await this.getAlbums({ skip: 0, limit: 1000 });
      return response.success && "data" in response ? response.data : null;
    } catch {
      return null;
    }
  }

  /**
   * Invita a alguien a colaborar en las pistas elegidas del álbum.
   *
   * Manda un solo correo por álbum, no uno por pista: quien recibe acepta una
   * vez y entra en todas. El alcance son las pistas que el álbum tiene ahora,
   * congeladas por el servidor al enviar la invitación.
   */
  async inviteCollaborator(
    upc: string,
    invitee: {
      collaboratorEmail?: string;
      collaboratorId?: string;
      /** Pistas elegidas (al menos una, todas del álbum y del owner). */
      songIds: string[];
    },
  ): Promise<{ success: true; data: AlbumInvitationResult } | { success: false; message: string }> {
    try {
      const response = await apiClient.post(
        `${this.BASE}/albums/${encodeURIComponent(upc)}/add-collaborator`,
        invitee,
      );
      return { success: true, data: response.data?.data as AlbumInvitationResult };
    } catch (error: unknown) {
      const axErr = error as { response?: { data?: { message?: string } }; message?: string };
      return {
        success: false,
        message:
          axErr.response?.data?.message ??
          axErr.message ??
          "No se pudo enviar la invitación. Vuelve a intentarlo.",
      };
    }
  }

  /** Acepta la invitación de álbum que llegó por correo. */
  async acceptCollaboration(
    token: string,
  ): Promise<{ success: true; data: AlbumAcceptanceResult } | { success: false; message: string }> {
    try {
      const response = await apiClient.post(`${this.BASE}/accept-collaboration`, { token });
      return { success: true, data: response.data?.data as AlbumAcceptanceResult };
    } catch (error: unknown) {
      const axErr = error as { response?: { data?: { message?: string } }; message?: string };
      return {
        success: false,
        message:
          axErr.response?.data?.message ??
          axErr.message ??
          "No se pudo aceptar la invitación. Vuelve a intentarlo.",
      };
    }
  }

  async getAlbumBalance(albumId: string): Promise<AlbumBalance | null> {
    try {
      if (!albumId || albumId.length !== 24) return null;
      const response = await apiClient.get(`/accounting/balance/album/${albumId}`);
      return response.data?.data ?? response.data;
    } catch {
      return null;
    }
  }
}

export default new AlbumService();
