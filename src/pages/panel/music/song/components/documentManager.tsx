import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Eye,
  Download,
  Trash2,
  FileText,
  Folder,
  AlertCircle,
  TriangleAlert,
  Info,
  Loader,
} from "lucide-react";
import {
  ModalShell,
  ModalMark,
  FieldLabel,
  FooterNote,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
} from "@/components/ui/ModalShell";
import documentManagerService from "@/services/documentManager";
import type { Document, DocumentCategory } from "@/types/documentManager.types";

interface DocumentManagerProps {
  songId: string;
}

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "contrato", label: "Contrato" },
  { value: "licencia", label: "Licencia" },
  { value: "factura", label: "Factura" },
  { value: "otro", label: "Otro" },
];

/** Cada categoría con su color, para distinguirlas de un vistazo en la tabla. */
const CATEGORY_STYLE: Record<DocumentCategory, string> = {
  contrato: "bg-white/[0.10] text-white",
  licencia: "bg-[#FF5C00]/[0.16] text-[#FF9A5C]",
  factura: "bg-[#45D39A]/[0.12] text-[#45D39A]",
  otro: "bg-white/[0.06] text-white/65",
};

/** Los mismos papeles en la hoja clara del visor, que sigue sin migrar. */
const CATEGORY_STYLE_LIGHT: Record<DocumentCategory, string> = {
  contrato: "bg-[#F4F5F7] text-[#1C1D22]",
  licencia: "bg-[#FFEADD] text-[#FF5C00]",
  factura: "bg-[#E4F5EC] text-[#2FB37E]",
  otro: "bg-[#F4F5F7] text-[#71757E]",
};

const ALLOWED_TYPES = ["pdf", "doc", "docx", "xlsx", "xls", "jpg", "jpeg", "png"];
const MAX_SIZE_MB = 500;
const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp"];

const docKey = (doc: Document) => (doc._id || doc.id) as string;

const categoryOf = (doc: Document): DocumentCategory =>
  CATEGORIES.some((c) => c.value === doc.category) ? (doc.category as DocumentCategory) : "otro";

const categoryLabel = (doc: Document) =>
  CATEGORIES.find((c) => c.value === categoryOf(doc))?.label ?? "Otro";

const uploaderName = (doc: Document) => {
  if (doc.uploadedBy && typeof doc.uploadedBy === "object") return doc.uploadedBy.name || "—";
  return "—";
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "?";

const formatDate = (value: Date | string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
};

/** Suma los tamaños ya formateados por el backend ("2.4 MB", "860 KB"). */
const totalSize = (documents: Document[]) => {
  const mb = documents.reduce((sum, doc) => {
    const match = /([\d.,]+)\s*(B|KB|MB)/i.exec(doc.size ?? "");
    if (!match) return sum;
    const value = Number(match[1].replace(",", "."));
    if (Number.isNaN(value)) return sum;
    const unit = match[2].toUpperCase();
    return sum + (unit === "MB" ? value : unit === "KB" ? value / 1024 : value / (1024 * 1024));
  }, 0);
  if (mb === 0) return null;
  return mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1).replace(".", ",")} MB`;
};

const DocumentManager: React.FC<DocumentManagerProps> = ({ songId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [docToPreview, setDocToPreview] = useState<Document | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentManagerService.getBySongId(songId);
      if (!response.success) {
        setError(response.message || "No pudimos traer los documentos.");
        return;
      }
      const data = response.data;
      setDocuments(Array.isArray(data) ? data : data ? [data as Document] : []);
    } catch {
      setError("No pudimos traer los documentos.");
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    if (songId) loadDocuments();
  }, [songId, loadDocuments]);

  const handleUpload = async (file: File, category: DocumentCategory) => {
    setUploading(true);
    setError(null);
    try {
      const response = await documentManagerService.upload(songId, file, category);
      if (!response.success) {
        setError(response.message || "No se pudo subir el documento.");
        return false;
      }
      await loadDocuments();
      return true;
    } catch {
      setError("No se pudo subir el documento.");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    const id = docKey(doc);
    if (!id) return;
    const response = await documentManagerService.delete(id);
    if (response.success) {
      setDocuments((prev) => prev.filter((item) => docKey(item) !== id));
      setDocToDelete(null);
    } else {
      setError(response.message || "No se pudo eliminar el documento.");
      setDocToDelete(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    const id = docKey(doc);
    if (!id) return;
    try {
      const response = await documentManagerService.download(id);
      if (!response.success || !response.blob) {
        setError(response.message || "No se pudo descargar el documento.");
        return;
      }
      const blobUrl = URL.createObjectURL(response.blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = response.name || doc.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError("No se pudo descargar el documento.");
    }
  };

  const sizeLabel = useMemo(() => totalSize(documents), [documents]);

  return (
    <>
      <section className="glass overflow-hidden rounded-[28px]">
        <header className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-[18px]">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-display text-[19px] font-medium tracking-[-0.005em] text-white">
              Los papeles de esta canción
            </h3>
            <p className="text-[12.5px] text-white/65">
              Contratos, licencias y facturas que respaldan el reparto
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            disabled={uploading}
            className="inline-flex items-center gap-[7px] rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors enabled:hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none"
          >
            <Upload className="h-3.5 w-3.5" />
            Subir documento
          </button>
        </header>

        <div className="h-px bg-white/[0.09]" />

        {error && (
          <div className="flex items-center gap-2.5 border-b border-[#E5484D]/30 bg-[#E5484D]/[0.14] px-5 py-3">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#FF8F92]" />
            <span className="flex-1 text-[12px] font-medium text-[#FF8F92]">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded text-[11px] font-semibold text-[#FF8F92] underline transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70"
            >
              Descartar
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-2.5 py-16 text-center">
            <Loader className="h-6 w-6 animate-spin text-white/50" />
            <p className="text-sm text-white/65">Trayendo los documentos…</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-16 text-center">
            <span className="grid h-[58px] w-[58px] place-items-center rounded-[20px] bg-[#FF5C00]/15">
              <FileText className="h-6 w-6 text-[#FF8A3D]" />
            </span>
            <p className="font-display text-[17px] font-medium text-white">Aún no hay papeles aquí</p>
            <p className="max-w-[400px] text-[13px] leading-relaxed text-white/65">
              Sube el contrato de reparto o la licencia y quedará junto a la canción, a la vista de
              quienes cobran de ella.
            </p>
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="mt-1 inline-flex items-center gap-[7px] rounded-full bg-[#FF5C00] px-[18px] py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,92,0,0.35)] transition-colors hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Upload className="h-3.5 w-3.5" />
              Subir el primero
            </button>
          </div>
        ) : (
          <>
            <div className="hidden items-center gap-3.5 px-5 py-[13px] lg:flex">
              <span className="flex-1 font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
                DOCUMENTO
              </span>
              <span className="w-[130px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
                TIPO
              </span>
              <span className="w-[96px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
                TAMAÑO
              </span>
              <span className="w-[170px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
                SUBIDO POR
              </span>
              <span className="w-[110px] font-mono text-[9.5px] font-medium tracking-[1.2px] text-white/50">
                FECHA
              </span>
              <span className="w-[110px]" />
            </div>

            <div className="h-px bg-white/[0.09]" />

            <ul>
              {documents.map((doc, index) => {
                const uploader = uploaderName(doc);
                return (
                  <li key={docKey(doc) || index}>
                    {index > 0 && <div className="h-px bg-white/[0.09]" />}
                    <div className="flex flex-wrap items-center gap-3.5 px-5 py-3">
                      <div className="flex min-w-[200px] flex-1 items-center gap-3">
                        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] bg-white/[0.06] font-mono text-[10px] font-semibold tracking-[0.4px] text-white/65">
                          {(doc.type || "?").toUpperCase().slice(0, 4)}
                        </span>
                        <span className="min-w-0 truncate text-[13px] font-semibold text-white">
                          {doc.name}
                        </span>
                      </div>

                      <div className="w-[130px]">
                        <span
                          className={`inline-block rounded-[12px] px-[9px] py-1 text-[10.5px] font-semibold ${CATEGORY_STYLE[categoryOf(doc)]}`}
                        >
                          {categoryLabel(doc)}
                        </span>
                      </div>

                      <div className="w-[96px] font-mono text-[11.5px] font-medium text-white/65">
                        {doc.size || "—"}
                      </div>

                      <div className="flex w-[170px] items-center gap-2">
                        <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-white/25 bg-[#1C1D22] text-[9.5px] font-semibold text-white">
                          {initialsOf(uploader)}
                        </span>
                        <span className="truncate text-[12px] font-medium text-white/65">
                          {uploader}
                        </span>
                      </div>

                      <div className="w-[110px] text-[11.5px] text-white/65">
                        {formatDate(doc.uploadDate)}
                      </div>

                      <div className="flex w-[110px] items-center justify-end gap-1.5">
                        <IconButton label="Ver" onClick={() => setDocToPreview(doc)}>
                          <Eye className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton label="Descargar" onClick={() => handleDownload(doc)}>
                          <Download className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton label="Eliminar" danger onClick={() => setDocToDelete(doc)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="h-px bg-white/[0.09]" />

            <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <span className="flex items-center gap-2.5 text-[12px] text-white/65">
                <Folder className="h-3.5 w-3.5" />
                {documents.length} {documents.length === 1 ? "archivo" : "archivos"}
                {sizeLabel ? ` · ${sizeLabel} en total` : ""}
              </span>
              <span className="text-[11px] text-white/50">
                Solo tú y los colaboradores de la canción pueden abrirlos
              </span>
            </footer>
          </>
        )}
      </section>

      {showUpload && (
        <UploadModal
          uploading={uploading}
          onClose={() => setShowUpload(false)}
          onUpload={async (file, category) => {
            const ok = await handleUpload(file, category);
            if (ok) setShowUpload(false);
          }}
        />
      )}

      {docToDelete && (
        <DeleteModal
          doc={docToDelete}
          onCancel={() => setDocToDelete(null)}
          onConfirm={() => handleDelete(docToDelete)}
        />
      )}

      {docToPreview && (
        <PreviewModal
          doc={docToPreview}
          onClose={() => setDocToPreview(null)}
          onDownload={() => handleDownload(docToPreview)}
        />
      )}
    </>
  );
};

const IconButton = ({
  children,
  label,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`grid h-[30px] w-[30px] place-items-center rounded-full bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00]/70 ${
      danger
        ? "text-[#FF8F92] hover:bg-[#E5484D]/[0.14]"
        : "text-white/70 hover:bg-white/[0.12] hover:text-white"
    }`}
  >
    {children}
  </button>
);

const UploadModal = ({
  uploading,
  onClose,
  onUpload,
}: {
  uploading: boolean;
  onClose: () => void;
  onUpload: (file: File, category: DocumentCategory) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("contrato");
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (candidate: File): string | null => {
    const ext = candidate.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_TYPES.includes(ext)) {
      return `Ese formato no se acepta. Sube ${ALLOWED_TYPES.join(", ").toUpperCase()}.`;
    }
    if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
      return `El archivo pasa de ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const pick = (candidate?: File | null) => {
    if (!candidate) return;
    const problem = validate(candidate);
    if (problem) {
      setLocalError(problem);
      setFile(null);
      return;
    }
    setLocalError(null);
    setFile(candidate);
  };

  return (
    <ModalShell
      title="Subir documento"
      subtitle="Queda junto a la canción, a la vista de quienes cobran de ella"
      logo={
        <ModalMark>
          <Folder className="h-[18px] w-[18px]" />
        </ModalMark>
      }
      locked={uploading}
      onClose={onClose}
      footer={
        <>
          <FooterNote>El tipo sirve para encontrarlo después entre los demás papeles.</FooterNote>
          <SecondaryButton onClick={onClose} disabled={uploading}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            onClick={() => file && onUpload(file, category)}
            disabled={!file || uploading}
            icon={
              uploading ? (
                <Loader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )
            }
          >
            {uploading ? "Subiendo…" : "Subir documento"}
          </PrimaryButton>
        </>
      }
    >
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-[18px] border-[1.5px] px-4 py-6 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00] ${
          dragging ? "border-[#FF5C00] bg-[#FFEADD]" : "border-[#E8E8EC] bg-white"
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#F4F5F7]">
          <Upload className="h-5 w-5 text-[#71757E]" />
        </span>
        <span className="text-[12.5px] font-semibold text-[#1C1D22]">
          {file ? file.name : "Arrastra el archivo o pulsa para elegirlo"}
        </span>
        <span className="text-[11px] text-[#A6AAB2]">
          {file
            ? `${(file.size / (1024 * 1024)).toFixed(1).replace(".", ",")} MB · pulsa para cambiarlo`
            : `${ALLOWED_TYPES.join(", ").toUpperCase()} · hasta ${MAX_SIZE_MB} MB`}
        </span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.map((t) => `.${t}`).join(",")}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {localError && (
        <div className="flex items-center gap-2.5 rounded-[14px] bg-[#FDECEC] px-3 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#E5484D]" />
          <span className="text-[11.5px] font-medium text-[#E5484D]">{localError}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel required>TIPO DE DOCUMENTO</FieldLabel>
        <div className="flex flex-wrap items-center gap-[7px]">
          {CATEGORIES.map((option) => {
            const active = option.value === category;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                aria-pressed={active}
                className={`rounded-[14px] border px-3 py-[7px] text-[11.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00] ${
                  active
                    ? "border-[#FF5C00] bg-[#FFEADD] font-semibold text-[#FF5C00]"
                    : "border-[#E8E8EC] bg-white font-medium text-[#71757E]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
};

const DeleteModal = ({
  doc,
  onCancel,
  onConfirm,
}: {
  doc: Document;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <ModalShell
    title="Eliminar este documento"
    subtitle={doc.name}
    logo={
      <ModalMark tone="danger">
        <Trash2 className="h-[18px] w-[18px]" />
      </ModalMark>
    }
    onClose={onCancel}
    footer={
      <>
        <FooterNote>Comprueba que no lo necesita nadie más antes de borrarlo.</FooterNote>
        <SecondaryButton onClick={onCancel}>Cancelar</SecondaryButton>
        <DangerButton onClick={onConfirm} icon={<Trash2 className="h-3.5 w-3.5" />}>
          Eliminar documento
        </DangerButton>
      </>
    }
  >
    <div className="flex items-center gap-3 rounded-[18px] bg-[#F4F5F7] px-4 py-3.5">
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] bg-white font-mono text-[10px] font-semibold text-[#71757E]">
        {(doc.type || "?").toUpperCase().slice(0, 4)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#1C1D22]">{doc.name}</p>
        <p className="truncate text-[11px] text-[#A6AAB2]">
          {doc.size} · {categoryLabel(doc).toLowerCase()} subido el {formatDate(doc.uploadDate)}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2.5 rounded-[14px] bg-[#FDECEC] px-3 py-2.5">
      <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-[#E5484D]" />
      <span className="text-[11.5px] font-medium leading-[1.4] text-[#E5484D]">
        Se borra para todos los que cobran de esta canción y no se puede recuperar.
      </span>
    </div>

    <div className="flex items-center gap-2.5 rounded-[14px] bg-[#FFEADD] px-3 py-2.5">
      <Info className="h-3.5 w-3.5 shrink-0 text-[#EA580C]" />
      <span className="text-[11.5px] font-medium leading-[1.4] text-[#EA580C]">
        Los costos y los splits no cambian: se va el papel que los justifica, no el dato.
      </span>
    </div>
  </ModalShell>
);

const PreviewModal = ({
  doc,
  onClose,
  onDownload,
}: {
  doc: Document;
  onClose: () => void;
  onDownload: () => void;
}) => {
  const ext = (doc.type || "").toLowerCase();
  const isImage = IMAGE_TYPES.includes(ext);
  const isPdf = ext === "pdf";

  return (
    <ModalShell
      title={doc.name}
      subtitle={`${(doc.type || "").toUpperCase()} · ${doc.size} · subido el ${formatDate(doc.uploadDate)}`}
      logo={
        <ModalMark>
          <FileText className="h-[18px] w-[18px]" />
        </ModalMark>
      }
      width="lg"
      onClose={onClose}
      footer={
        <>
          <FooterNote>El archivo no sale de Splitme mientras lo ves aquí.</FooterNote>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
          <PrimaryButton onClick={onDownload} icon={<Download className="h-3.5 w-3.5" />}>
            Descargar
          </PrimaryButton>
        </>
      }
    >
      <div className="flex h-[340px] items-center justify-center overflow-hidden rounded-[18px] bg-[#F4F5F7]">
        {isImage ? (
          <img src={doc.url} alt={doc.name} className="max-h-full max-w-full object-contain" />
        ) : isPdf ? (
          <iframe src={doc.url} title={doc.name} className="h-full w-full border-0" />
        ) : (
          <div className="flex flex-col items-center gap-2.5 text-center">
            <span className="grid h-[52px] w-[52px] place-items-center rounded-[16px] bg-white">
              <FileText className="h-[22px] w-[22px] text-[#A6AAB2]" />
            </span>
            <p className="text-[12.5px] font-semibold text-[#1C1D22]">
              Este formato no se puede ver aquí
            </p>
            <p className="text-[11px] text-[#A6AAB2]">Descárgalo para abrirlo en tu equipo.</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-[7px]">
        <span
          className={`rounded-[12px] px-[9px] py-1 text-[10.5px] font-semibold ${CATEGORY_STYLE_LIGHT[categoryOf(doc)]}`}
        >
          {categoryLabel(doc)}
        </span>
        <span className="rounded-[12px] bg-[#F4F5F7] px-[9px] py-1 text-[10.5px] font-semibold text-[#71757E]">
          Subido por {uploaderName(doc)}
        </span>
      </div>
    </ModalShell>
  );
};

export default DocumentManager;
