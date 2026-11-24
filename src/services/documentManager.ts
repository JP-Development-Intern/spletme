import { apiClient } from "@/infrastructure/http/axiosClient";
import type {
  Document,
  DocumentCategory,
  DocumentResponse,
  DownloadResponse,
  DeleteResponse,
} from "@/types/documentManager.types";

class DocumentManagerService {
  private readonly BASE = "/documents";

  async getBySongId(songId: string): Promise<DocumentResponse> {
    if (!songId) return { success: false, message: "Song ID is required" };
    try {
      const { data } = await apiClient.get(`${this.BASE}/song/${songId}`);
      const docs: Document[] = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
      return {
        success: true,
        data: docs,
        message: data.message,
        pagination: data.pagination,
      };
    } catch (error: unknown) {
      const axErr = error as {
        response?: { status?: number; data?: { message?: string; error?: string } };
        message?: string;
      };
      return {
        success: false,
        status: axErr.response?.status,
        message: axErr.response?.data?.message ?? "Error retrieving documents",
        error: axErr.response?.data?.error ?? axErr.message,
      };
    }
  }

  async getById(documentId: string): Promise<DocumentResponse> {
    if (!documentId) return { success: false, message: "Document ID is required" };
    try {
      const { data } = await apiClient.get(`${this.BASE}/${documentId}`);
      return { success: true, data: data.data, message: data.message };
    } catch (error: unknown) {
      const axErr = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      return {
        success: false,
        message: axErr.response?.data?.message ?? "Error retrieving document",
        error: axErr.response?.data?.error ?? axErr.message,
      };
    }
  }

  async download(documentId: string): Promise<DownloadResponse> {
    if (!documentId) return { success: false, message: "Document ID is required" };
    try {
      const response = await apiClient.get(`${this.BASE}/${documentId}/download`, {
        responseType: "blob",
      });

      const disposition: string = response.headers["content-disposition"] ?? "";
      const nameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i);
      const name = nameMatch ? decodeURIComponent(nameMatch[1]) : documentId;

      return {
        success: true,
        blob: response.data as Blob,
        name,
        contentType: response.headers["content-type"] ?? "application/octet-stream",
      };
    } catch (error: unknown) {
      const axErr = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      return {
        success: false,
        status: axErr.response?.status,
        message: axErr.response?.data?.message ?? "Error downloading document",
        error: axErr.message,
      };
    }
  }

  async upload(
    songId: string,
    file: File,
    category: DocumentCategory = "otro",
  ): Promise<DocumentResponse> {
    if (!songId || !file) return { success: false, message: "Song ID and file are required" };
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const { data } = await apiClient.post(`${this.BASE}/song/${songId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const docs: Document[] = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
      return { success: true, data: docs, message: data.message };
    } catch (error: unknown) {
      const axErr = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      return {
        success: false,
        message: axErr.response?.data?.message ?? "Error uploading document",
        error: axErr.response?.data?.error ?? axErr.message,
      };
    }
  }

  async delete(documentId: string): Promise<DeleteResponse> {
    if (!documentId) return { success: false, message: "Document ID is required" };
    try {
      const { data } = await apiClient.delete(`${this.BASE}/${documentId}`);
      return {
        success: true,
        deleted: data.deleted ?? true,
        message: data.message,
      };
    } catch (error: unknown) {
      const axErr = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      return {
        success: false,
        message: axErr.response?.data?.message ?? "Error deleting document",
        error: axErr.response?.data?.error ?? axErr.message,
      };
    }
  }
}

export default new DocumentManagerService();
