"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { Message } from "primereact/message";
import {
  getNotice,
  getNoticesConfig,
  deleteNotice,
  uploadNoticeFile,
  getNoticeFile,
} from "@/lib/services/absence-notices.service";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDateTime(value: string | null | undefined, withSeconds = false): string {
  if (!value) return "";
  const normalized = value.includes("T") || value.includes(" ") ? value.replace(" ", "T") : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  if (!withSeconds) return `${d}/${m}/${y} ${hh}:${mm}`;
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
}

function countDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function daysRangeLabel(from: string | null | undefined, to: string | null | undefined): string | null {
  if (!from || !to) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;
  const totalDays = countDays(start, end);
  const businessDays = countBusinessDays(start, end);
  const totalLabel = `${totalDays} ${totalDays === 1 ? "día total" : "días totales"}`;
  if (businessDays === totalDays) return totalLabel;
  return `${totalLabel} (${businessDays} ${businessDays === 1 ? "día hábil" : "días hábiles"})`;
}

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

// Misma paleta de estado usada en el listado de "Mis avisos".
const STATUS_BADGE_COLORS: Record<string, string> = {
  "creado": "#22c55e",
  "recibido": "#d946ef",
  "pendiente de documentacion": "#6366f1",
  "documentacion adjuntada": "#0ea5e9",
  "documentacion aprobada": "#14b8a6",
  "documentacion rechazada": "#ef4444",
  "aprobado": "#14b8a6",
  "rechazado": "#ef4444",
};

function getStatusColor(label: string | null | undefined): string {
  const key = String(label ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "");
  return STATUS_BADGE_COLORS[key] ?? "#94a3b8";
}

// Misma paleta categórica usada en el listado (Tipo/Razón).
const CATEGORY_PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const REASON_PALETTE = ["#eb6834", "#eda100", "#e87ba4", "#4a3aa7", "#e34948"];

function colorForCategory(key: string, palette: string[]): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function colorByIndex(id: string | number, list: any[], palette: string[]): string {
  const idx = list.findIndex((item) => item.id === id);
  return palette[(idx >= 0 ? idx : 0) % palette.length];
}

function CategoryBadge({ label, id, palette = CATEGORY_PALETTE, list }: { label?: string | null; id?: string | number | null; palette?: string[]; list?: any[] }) {
  if (!label || !id) return <small>-</small>;
  const normalizedLabel = label.toLowerCase();
  const color = normalizedLabel.includes("llegada tarde")
    ? "#2a78d6"
    : normalizedLabel.includes("ausencia")
      ? "#10b981"
      : normalizedLabel === "otro"
        ? "#64748b"
        : list
          ? colorByIndex(id, list, palette)
          : colorForCategory(String(id), palette);
  return (
    <span
      className="badge rounded-pill"
      style={{ background: `${color}1a`, color, border: "none", fontWeight: 600, padding: "4px 10px" }}
    >
      {label}
    </span>
  );
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  return (
    <span
      style={{ display: "inline-flex" }}
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ top: r.top, left: r.left + r.width / 2 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div style={{ position: "fixed", top: pos.top - 10, left: pos.left, transform: "translateX(-50%) translateY(-100%)", background: "#1e293b", color: "#fff", padding: "5px 11px", borderRadius: "7px", fontSize: "0.71rem", fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", letterSpacing: "0.01em" }}>
          {label}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "5px", borderStyle: "solid", borderColor: "#1e293b transparent transparent transparent" }} />
        </div>
      )}
    </span>
  );
}

function isTimeExpired(notice: any): boolean {
  if (!notice?.created_at) return false;
  const createdDate = new Date(notice.created_at).getTime();
  const diffInHours = Math.abs(Date.now() - createdDate) / (1000 * 60 * 60);
  return diffInHours > 48;
}

function isInvalidStatus(notice: any): boolean {
  const code = notice?.status?.code;
  return code === "aprobado" || code === "rechazado" || code === "documentacion_adjuntada" || code === "creado";
}

function AttachmentItem({ attachment, highlighted, isDownloading, onOpen }: { attachment: any; highlighted?: boolean; isDownloading?: boolean; onOpen: () => void }) {
  return (
    <div style={{ border: `1.5px solid ${highlighted ? "#dbeafe" : "#e2e8f0"}`, background: highlighted ? "#eff6ff" : "#fff", borderRadius: "10px", padding: "12px 14px" }}>
      <div className="d-flex align-items-center justify-content-between" style={{ gap: "8px" }}>
        <div className="d-flex align-items-center" style={{ gap: "8px", minWidth: 0 }}>
          <i className="fa-solid fa-file" style={{ color: "#4a6cf7", fontSize: "1rem", flexShrink: 0 }} />
          <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {attachment.name}
          </span>
        </div>
        <Tooltip label="Ver documento">
          <button type="button" onClick={onOpen} disabled={isDownloading} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6", fontSize: "0.78rem", fontWeight: 600, gap: "6px", flexShrink: 0 }}>
            <i className={isDownloading ? "pi pi-spin pi-spinner" : "pi pi-eye"} style={{ fontSize: "0.78rem" }} />
            Ver
          </button>
        </Tooltip>
      </div>
      <small style={{ color: "#94a3b8", fontSize: "0.72rem", display: "block", marginTop: "4px", marginLeft: "24px" }}>
        Subido el {formatDateTime(attachment.created_at)}
      </small>

      {attachment.rejection_reasons && attachment.rejection_reasons.length > 0 && (
        <Message
          severity="error"
          className="mt-2 w-100"
          style={{ justifyContent: "flex-start" }}
          text={
            <div>
              {attachment.rejection_reasons.map((reason: any, idx: number) => (
                <div key={idx} className={idx > 0 ? "mt-2" : ""}>
                  <small style={{ fontWeight: 700, display: "block" }}>Rechazado el {formatDateTime(reason.created_at, true)}</small>
                  <small style={{ display: "block" }}>{reason.reason}</small>
                </div>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
}

interface AbsenceNoticeDetailProps {
  id: string | number | null | undefined;
  onClose: () => void;
  onChanged?: () => void;
}

export default function AbsenceNoticeDetail({ id, onClose, onChanged }: AbsenceNoticeDetailProps) {
  const toast = useRef<Toast>(null);
  const noticeId = id !== null && id !== undefined ? String(id) : undefined;

  const [notice, setNotice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);

  const [displayDeleteDialog, setDisplayDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [displayUploadDialog, setDisplayUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDrag, setUploadDrag] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [previewFile, setPreviewFile] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(null);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (noticeId) loadNotice(noticeId);
    getNoticesConfig()
      .then((resp) => {
        setTypes(resp.types ?? []);
        setReasons(resp.reasons ?? []);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noticeId]);

  async function loadNotice(id: string) {
    setIsLoading(true);
    try {
      const resp = await getNotice(id);
      setNotice(resp);
    } catch {
      setNotice(null);
    } finally {
      setIsLoading(false);
    }
  }

  function getLatestAttachment() {
    if (!notice?.attachments?.length) return null;
    return [...notice.attachments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }

  function getHistoryAttachments() {
    if (!notice?.attachments?.length) return [];
    return [...notice.attachments]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(1);
  }

  async function abrirArchivo(attachment: any) {
    if (!attachment?.id) return;
    setIsDownloadingFile(true);
    setDownloadingId(attachment.id);
    try {
      const blob = await getNoticeFile(attachment.id);
      const mimeType = blob.type || "application/octet-stream";
      const finalBlob = new Blob([blob], { type: mimeType });
      const url = URL.createObjectURL(finalBlob);
      const isPDF = mimeType === "application/pdf" || attachment.name?.toLowerCase().endsWith(".pdf");
      setPreviewFile({ url, type: isPDF ? "pdf" : "image", name: attachment.name ?? "archivo" });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo abrir el archivo" });
    } finally {
      setIsDownloadingFile(false);
      setDownloadingId(null);
    }
  }

  function closePreview() {
    if (previewFile) URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  }

  function canUserCancelNotice(): boolean {
    return notice?.status?.code === "creado";
  }

  function checkCanUpload(): boolean {
    if (!notice || notice.type?.code !== "ausencia") return false;
    return !isTimeExpired(notice) && !isInvalidStatus(notice);
  }

  function openDeleteDialog() {
    if (!canUserCancelNotice()) return;
    setDisplayDeleteDialog(true);
  }

  async function confirmDeleteNotice() {
    if (!noticeId || isDeleting || !canUserCancelNotice()) return;
    setIsDeleting(true);
    try {
      await deleteNotice(noticeId);
      setDisplayDeleteDialog(false);
      toast.current?.show({ severity: "success", summary: "Aviso cancelado/eliminado" });
      onChanged?.();
      onClose();
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cancelar/eliminar el aviso" });
    } finally {
      setIsDeleting(false);
    }
  }

  function openUploadDialog() {
    setUploadFile(null);
    setDisplayUploadDialog(true);
  }

  function closeUploadDialog() {
    setDisplayUploadDialog(false);
    setUploadFile(null);
  }

  function handleFileSelected(file: File) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.current?.show({ severity: "error", summary: "Archivo no válido", detail: "El archivo debe ser JPG, PNG o PDF y pesar menos de 2MB." });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.current?.show({ severity: "error", summary: "Archivo no válido", detail: "El archivo debe ser JPG, PNG o PDF y pesar menos de 2MB." });
      return;
    }
    setUploadFile(file);
  }

  async function subirArchivo() {
    if (!uploadFile || !noticeId) return;
    setIsUploading(true);
    try {
      await uploadNoticeFile(noticeId, uploadFile);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Documentación subida correctamente" });
      closeUploadDialog();
      loadNotice(noticeId);
      onChanged?.();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message || "Hubo un problema al subir el archivo" });
    } finally {
      setIsUploading(false);
    }
  }

  const statusColor = getStatusColor(notice?.status?.name);
  const latestAttachment = getLatestAttachment();
  const historyAttachments = getHistoryAttachments();

  const previewNameParts = previewFile?.name.split(".") ?? [];
  const previewExt = previewNameParts.length > 1 ? previewNameParts.pop() : null;
  const previewNameNoExt = previewNameParts.join(".");
  const previewSidebarHeader = (
    <div className="d-flex align-items-center" style={{ gap: "8px", minWidth: 0 }}>
      <span style={{ fontWeight: 700, fontSize: "0.93rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewNameNoExt}</span>
      {previewExt && (
        <span style={{ background: "#eff6ff", color: "#3b82f6", borderRadius: "20px", padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
          {previewExt.toUpperCase()}
        </span>
      )}
    </div>
  );

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-exclamation-triangle" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Cancelar / Eliminar aviso</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="fadeIn animated d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 400, color: "#94a3b8" }}>
        <div className="spinner-border" role="status">
          <span className="sr-only">Cargando...</span>
        </div>
        <p className="mt-3">Cargando aviso...</p>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="fadeIn animated">
        <AppToast ref={toast} position="bottom-center" />
        <div className="card profile-card">
          <div className="card-body text-center" style={{ padding: "60px 20px" }}>
            <i className="pi pi-inbox" style={{ fontSize: "2.5rem", color: "#cbd5e1", display: "block", marginBottom: "12px" }} />
            <h5 style={{ color: "#1e293b" }}>No se encontró el aviso</h5>
            <p style={{ color: "#94a3b8" }}>El aviso que busca no existe.</p>
            <button type="button" onClick={onClose} className="btn btn-primary d-inline-flex align-items-center mt-2" style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header */}
        <div className="card profile-card">
          <div className="d-flex align-items-center flex-wrap px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(74,108,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-file-edit" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Detalle del aviso</h5>
            </div>
            <span className="badge rounded-pill" style={{ background: `${statusColor}1a`, color: statusColor, border: "none", fontWeight: 600, padding: "5px 12px" }}>
              {notice.status?.name}
            </span>
            {checkCanUpload() && (
              <button type="button" onClick={openUploadDialog} className="btn btn-primary d-flex align-items-center" style={{ borderRadius: "8px", fontWeight: 600, fontSize: "0.72rem", padding: "4px 10px" }}>
                Subir documentación
              </button>
            )}
            {canUserCancelNotice() && (
              <Button label="Cancelar aviso" severity="danger" size="small" onClick={openDeleteDialog} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "0.72rem", padding: "4px 10px" }} />
            )}
          </div>

          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
          <div className="card-body">
            <div className="row">
              <div className="col-12 mb-3">
                <label className="profile-field-label">Creado el</label>
                <p className="mb-0" style={{ fontSize: "0.88rem", color: "#374151" }}>{formatDateTime(notice.created_at, true)}</p>
              </div>
              {notice.reason?.name && (
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Motivo</label>
                  <div><CategoryBadge label={notice.reason?.name} id={notice.reason?.id} palette={REASON_PALETTE} list={reasons} /></div>
                </div>
              )}
              <div className="col-12 col-md-6 mb-3">
                <label className="profile-field-label">Tipo</label>
                <div><CategoryBadge label={notice.type?.name} id={notice.type?.id} list={types} /></div>
              </div>
              {notice.notice_to && (
                <div className="col-12 mb-3">
                  <label className="profile-field-label">Desde - Hasta</label>
                  <div className="d-flex align-items-center flex-wrap" style={{ gap: "8px" }}>
                    <p className="mb-0" style={{ fontSize: "0.88rem", color: "#374151" }}>
                      {formatDateDisplay(notice.notice_date)} - {formatDateDisplay(notice.notice_to)}
                    </p>
                    {daysRangeLabel(notice.notice_date, notice.notice_to) && (
                      <span
                        className="badge rounded-pill"
                        style={{ background: "rgba(100,116,139,0.10)", color: "#64748b", border: "none", fontWeight: 600, padding: "4px 10px" }}
                      >
                        {daysRangeLabel(notice.notice_date, notice.notice_to)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {notice.type?.name?.toLowerCase().includes("llegada tarde") && (
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Para el</label>
                  <p className="mb-0" style={{ fontSize: "0.88rem", color: "#374151" }}>{formatDateDisplay(notice.notice_date)}</p>
                </div>
              )}
              <div className="col-12">
                <label className="profile-field-label">Descripción</label>
                <p className="mb-0" style={{ fontSize: "0.88rem", color: "#374151" }}>{notice.description || "Sin descripción"}</p>
              </div>
            </div>
          </div>
        </div>

        {notice.status?.code === "creado" && isTimeExpired(notice) && !notice.attachments?.length && (
          <Message
            severity="warn"
            className="mt-3 w-100"
            style={{ justifyContent: "flex-start" }}
            text={<small>Ya pasaron 48hs desde la creación del aviso, por lo que no se puede subir documentación adjunta.</small>}
          />
        )}

        {/* Observaciones */}
        {notice.status?.code === "aprobado" && notice.observation && (
          <div className="card profile-card mt-4">
            <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="pi pi-comments" style={{ color: "#059669", fontSize: "1rem" }} />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Observaciones</h5>
              </div>
            </div>
            <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
            <div className="card-body">
              <p className="mb-0" style={{ fontSize: "0.88rem", color: "#374151" }}>{notice.observation}</p>
            </div>
          </div>
        )}

        {/* Motivo de rechazo */}
        {notice.rejection_reasons && notice.rejection_reasons.length > 0 && (
          <div className="card profile-card mt-4">
            <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="pi pi-exclamation-triangle" style={{ color: "#dc3545", fontSize: "1rem" }} />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Motivo de rechazo</h5>
              </div>
            </div>
            <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
            <div className="card-body">
              {notice.rejection_reasons.map((reason: any, idx: number) => (
                <div key={idx} className={idx > 0 ? "mt-3" : ""}>
                  <p className="mb-1 font-weight-bold" style={{ fontSize: "0.86rem", color: "#1e293b" }}>{reason.reason}</p>
                  <small style={{ color: "#94a3b8" }}>Creado: {formatDateTime(reason.created_at, true)}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adjuntos */}
        {notice.attachments && notice.attachments.length > 0 && (
          <div className="card profile-card mt-4">
            <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eef1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="pi pi-paperclip" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Adjuntos</h5>
              </div>
            </div>
            <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
            <div className="card-body">
              {latestAttachment && (
                <div className="mb-3">
                  <p className="profile-section-sub" style={{ padding: 0, marginBottom: "8px" }}>Último adjunto</p>
                  <AttachmentItem
                    attachment={latestAttachment}
                    highlighted
                    isDownloading={isDownloadingFile && downloadingId === latestAttachment.id}
                    onOpen={() => abrirArchivo(latestAttachment)}
                  />
                </div>
              )}

              {historyAttachments.length > 0 && (
                <div>
                  <p className="profile-section-sub" style={{ padding: 0, marginBottom: "8px" }}>Historial</p>
                  <div className="d-flex flex-column" style={{ gap: "10px" }}>
                    {historyAttachments.map((attachment: any) => (
                      <AttachmentItem
                        key={attachment.id}
                        attachment={attachment}
                        isDownloading={isDownloadingFile && downloadingId === attachment.id}
                        onOpen={() => abrirArchivo(attachment)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview sidebar */}
      <Sidebar
        visible={!!previewFile}
        position="right"
        showCloseIcon
        onHide={closePreview}
        baseZIndex={3000}
        style={{ width: "min(560px, 92vw)" }}
        header={previewSidebarHeader}
      >
        {previewFile?.type === "image" && (
          <>
            <a
              href={previewFile.url}
              download={previewFile.name}
              className="btn btn-light d-inline-flex align-items-center mb-3"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#4a6cf7", textDecoration: "none" }}
            >
              <i className="pi pi-download" style={{ fontSize: "0.78rem" }} />
              Descargar imagen
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewFile.url} alt={previewFile.name} style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }} />
          </>
        )}
        {previewFile?.type === "pdf" && (
          <iframe src={previewFile.url} title={previewFile.name} style={{ width: "100%", height: "calc(100vh - 120px)", border: "none" }} />
        )}
      </Sidebar>

      {/* Upload dialog */}
      <Dialog
        header="Subir documentación"
        visible={displayUploadDialog}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(480px, 92vw)" }}
        onHide={closeUploadDialog}
        footer={
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <button type="button" className="btn btn-outline-secondary" disabled={isUploading} onClick={closeUploadDialog}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" disabled={!uploadFile || isUploading} onClick={subirArchivo}>
              {isUploading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" /> Subiendo...
                </>
              ) : (
                "Subir Documento"
              )}
            </button>
          </div>
        }
      >
        <Message severity="info" className="mb-3 w-100" style={{ justifyContent: "flex-start" }} text="Solo se admiten formatos PNG, JPG, JPEG y PDF. Tamaño máximo: 2MB." />

        <div
          className={`dropzone-area${uploadDrag ? " drag-over" : ""} text-center`}
          onDragOver={(e) => { e.preventDefault(); setUploadDrag(true); }}
          onDragLeave={() => setUploadDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setUploadDrag(false);
            if (!uploadFile && e.dataTransfer.files[0]) handleFileSelected(e.dataTransfer.files[0]);
          }}
          onClick={() => !uploadFile && uploadInputRef.current?.click()}
        >
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); }}
          />

          {!uploadFile && (
            <div>
              <i className="fa-solid fa-cloud-arrow-up mb-2 text-primary" style={{ fontSize: "1.5rem" }} /><br />
              Arrastra tu archivo aquí o haz clic para seleccionar
            </div>
          )}

          {uploadFile && (
            <div className="d-flex flex-column align-items-center" style={{ width: "100%" }}>
              {uploadFile.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={URL.createObjectURL(uploadFile)} alt={uploadFile.name} style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 6, objectFit: "contain" }} />
              ) : (
                <i className="fa-solid fa-file-pdf text-danger mb-2" style={{ fontSize: "1.5rem" }} />
              )}
              <small className="d-block mt-2" style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadFile.name}</small>
              <button
                type="button"
                className="btn btn-sm btn-link text-danger p-0 mt-1"
                onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
              >
                Quitar
              </button>
            </div>
          )}
        </div>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        header={deleteDialogHeader}
        visible={displayDeleteDialog}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setDisplayDeleteDialog(false)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={isDeleting}
                onClick={confirmDeleteNotice}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={isDeleting ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {isDeleting ? "Procesando..." : "Confirmar"}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => setDisplayDeleteDialog(false)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {isDeleting && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      />
    </>
  );
}