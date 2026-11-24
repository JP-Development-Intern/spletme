/** Para qué sirve el papel, no en qué formato está. */
export type DocumentCategory = "contrato" | "licencia" | "factura" | "otro";

export interface Document {
  _id?: string;
  id?: string;
  songId: string;
  uploadedBy: string | { _id?: string; name?: string; email?: string };
  name: string;
  /** Extensión del archivo: pdf, jpg, png… */
  type: string;
  category?: DocumentCategory;
  size: string;
  uploadDate: Date | string;
  url: string;
  firebasePath: string;
}

export interface DocumentResponse {
  success: boolean;
  status?: number;
  data?: Document[] | Document | null;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    skip: number;
    limit: number;
  };
}

export interface DownloadResponse {
  success: boolean;
  status?: number;
  blob?: Blob;
  name?: string;
  contentType?: string;
  message?: string;
  error?: string;
}

export interface DeleteResponse {
  success: boolean;
  deleted?: boolean;
  message?: string;
  error?: string;
}
