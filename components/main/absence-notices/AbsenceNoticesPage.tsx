"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Paginator } from "primereact/paginator";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Sidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Message } from "primereact/message";
import { addLocale } from "primereact/api";
import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";
import { ClockAlert } from "lucide-react";
import {
  getNoticesConfig,
  getMyNotices,
  createNotice,
  modificateNotice,
  deleteNotice,
  getRecipients,
  uploadNoticeFile,
  getNoticeFile,
} from "@/lib/services/absence-notices.service";
import AbsenceNoticeDetail from "./AbsenceNoticeDetail";

addLocale("es-avisos", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Quitar fechas",
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

interface NoticeForm {
  type: string;
  reason: string;
  description: string;
}

interface FilterForm {
  notice_type_id: string;
  notice_reason_id: string;
  description: string;
  notice_status_id: string;
  date_from: string;
  date_to: string;
}

function addBusinessDays(from: Date, days: number): Date {
  let workingDays = 0;
  const result = new Date(from);
  while (workingDays < days) {
    result.setDate(result.getDate() + 1);
    const d = result.getDay();
    if (d !== 0 && d !== 6) workingDays++;
  }
  return result;
}

function getWeekRange(): { min: Date; max: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const startDate = new Date(today);
  if (day === 6) startDate.setDate(today.getDate() + 2);
  else if (day === 0) startDate.setDate(today.getDate() + 1);
  return { min: startDate, max: addBusinessDays(startDate, 20) };
}

function formatDateForApi(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = value.includes("T") || value.includes(" ") ? value.replace(" ", "T") : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${hh}:${mm}`;
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

function hasAttachment(item: any): boolean {
  return Array.isArray(item.attachments) && item.attachments.length > 0;
}

function isTimeExpired(item: any): boolean {
  const createdDate = new Date(item.created_at).getTime();
  const diffInHours = Math.abs(Date.now() - createdDate) / (1000 * 60 * 60);
  return diffInHours > 48;
}

function isInvalidStatus(item: any): boolean {
  const code = item.status?.code;
  return code === "aprobado" || code === "rechazado" || code === "documentacion_adjuntada" || code === "creado";
}

function checkCanUpload(item: any): boolean {
  return !isTimeExpired(item) && !isInvalidStatus(item);
}

function getUltimoAdjunto(item: any) {
  if (!item?.attachments?.length) return null;
  return [...item.attachments].sort((a: any, b: any) => b.id - a.id)[0];
}

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

// Colores fijos por estado (se matchea por el texto visible, no por id/code).
const STATUS_BADGE_COLORS: Record<string, string> = {
  "creado": "#22c55e",                      // green
  "recibido": "#d946ef",                    // fuchsia
  "pendiente de documentacion": "#6366f1",  // indigo
  "documentacion adjuntada": "#0ea5e9",     // sky
  "documentacion aprobada": "#14b8a6",      // teal
  "documentacion rechazada": "#ef4444",     // red
};

function getStatusColor(label: string): string {
  const key = String(label ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "");
  return STATUS_BADGE_COLORS[key] ?? "#94a3b8";
}

// Paleta categórica fija (orden validado para daltonismo) — cada tipo/razón
// obtiene siempre el mismo color, calculado a partir de su id.
const CATEGORY_PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

// Paleta para "Razón": sin azul ni verde/aqua, para no confundirse con los badges de "Tipo".
const REASON_PALETTE = ["#eb6834", "#eda100", "#e87ba4", "#4a3aa7", "#e34948"];

function colorForCategory(key: string, palette: string[] = CATEGORY_PALETTE): string {
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

export default function AbsenceNoticesPage({ initialNoticeId }: { initialNoticeId?: string } = {}) {
  const toast = useRef<Toast>(null);

  const [types, setTypes] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);

  const [recipients, setRecipients] = useState<any[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);

  const [notices, setNotices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [form, setForm] = useState<NoticeForm>({ type: "", reason: "", description: "" });
  const [noticeDate, setNoticeDate] = useState<Date | null>(null);
  const [noticeTo, setNoticeTo] = useState<Date | null>(null);
  const [touched, setTouched] = useState(false);
  const [noticeParaModificar, setNoticeParaModificar] = useState<any>(null);

  const [weekRange] = useState(() => getWeekRange());
  const weekMinDate = weekRange.min;
  const weekMaxDate = weekRange.max;

  const [filterForm, setFilterForm] = useState<FilterForm>({ notice_type_id: "", notice_reason_id: "", description: "", notice_status_id: "", date_from: "", date_to: "" });
  const [descInput, setDescInput] = useState("");

  const [noticeToDelete, setNoticeToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [noticeParaUpload, setNoticeParaUpload] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [compressedSizeMB, setCompressedSizeMB] = useState<string | null>(null);
  const [uploadDrag, setUploadDrag] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);


  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(null);

  const [selectedNoticeId, setSelectedNoticeId] = useState<string | number | null>(initialNoticeId ?? null);

  useEffect(() => {
    loadConfig();
    loadNotices();
    loadRecipients();
  }, []);

  // Mantiene la URL sincronizada con el drawer de detalle sin navegar de pagina.
  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      setSelectedNoticeId(e.state?.absenceNoticeId ?? null);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function openNoticeDetail(id: string | number) {
    const url = `/main/absence-notices/${id}`;
    if (selectedNoticeId) window.history.replaceState({ absenceNoticeId: id }, "", url);
    else window.history.pushState({ absenceNoticeId: id }, "", url);
    setSelectedNoticeId(id);
  }

  function closeNoticeDetail() {
    if (window.history.state?.absenceNoticeId) {
      window.history.back();
    } else {
      setSelectedNoticeId(null);
      window.history.replaceState({}, "", "/main/absence-notices");
    }
  }

  // Debounce del filtro de descripción
  useEffect(() => {
    const t = setTimeout(() => {
      if (descInput !== filterForm.description) updateFilter({ description: descInput });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descInput]);

  async function loadConfig() {
    try {
      const resp = await getNoticesConfig();
      setTypes(resp.types ?? []);
      setReasons(resp.reasons ?? []);
      setStatuses(resp.statuses ?? []);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar la configuración", detail: err.message });
    }
  }

  async function loadRecipients() {
    setIsLoadingRecipients(true);
    try {
      const resp = await getRecipients();
      setRecipients(resp ?? []);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar el listado de jefes", detail: err.message });
    } finally {
      setIsLoadingRecipients(false);
    }
  }

  async function loadNotices(p = 1, f: FilterForm = filterForm, rows: number = perPage) {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await getMyNotices(p, rows, f);
      setNotices(resp.data ?? []);
      setTotal(resp.meta?.total ?? 0);
      setPage(p);
      setPerPage(rows);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(patch: Partial<FilterForm>) {
    setFilterForm((prev) => {
      const next = { ...prev, ...patch };
      loadNotices(1, next);
      return next;
    });
  }

  function clearFilters() {
    const empty: FilterForm = { notice_type_id: "", notice_reason_id: "", description: "", notice_status_id: "", date_from: "", date_to: "" };
    setFilterForm(empty);
    setDescInput("");
    loadNotices(1, empty);
  }

  const isAusencia = types.find((t) => t.id == form.type)?.code === "ausencia";
  const isFilterLlegadaTarde = types.find((t) => t.id == filterForm.notice_type_id)?.name?.toLowerCase().includes("llegada tarde");

  function isRecipientSelected(id: number): boolean {
    return selectedRecipientIds.includes(id);
  }

  function toggleRecipient(id: number, checked: boolean) {
    setSelectedRecipientIds((prev) => (checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((r) => r !== id)));
  }

  function isFormValid(): boolean {
    if (!form.type || !form.description) return false;
    if (isAusencia) {
      if (!form.reason || !noticeDate || !noticeTo) return false;
      if (noticeTo < noticeDate) return false;
    } else if (!noticeDate) {
      return false;
    }
    if (noticeDate && (noticeDate < weekMinDate || noticeDate > weekMaxDate)) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isFormValid()) return;
    setLoadingAction(true);
    try {
      const payload: any = {
        notice_type_id: form.type,
        description: form.description,
        notice_date: formatDateForApi(noticeDate),
        notified_people_ids: selectedRecipientIds.length ? selectedRecipientIds : null,
      };
      if (isAusencia) {
        payload.notice_reason_id = form.reason;
        payload.notice_to = formatDateForApi(noticeTo);
      }

      if (noticeParaModificar) {
        const resp = await modificateNotice(payload, noticeParaModificar.id);
        setNotices((prev) => prev.map((n) => n.id === noticeParaModificar.id ? (resp.absenceNotice ?? resp) : n));
        toast.current?.show({ severity: "success", summary: "Aviso modificado" });
      } else {
        const resp = await createNotice(payload);
        setNotices((prev) => [resp, ...prev]);
        setTotal((t) => t + 1);
        toast.current?.show({ severity: "success", summary: "Aviso creado" });
      }
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function limpiar() {
    setForm({ type: "", reason: "", description: "" });
    setNoticeDate(null);
    setNoticeTo(null);
    setSelectedRecipientIds([]);
    setNoticeParaModificar(null);
    setTouched(false);
  }

  function llenarFormulario(notice: any) {
    setNoticeParaModificar(notice);
    setForm({
      type: notice.type?.id ?? "",
      reason: notice.reason?.id ?? "",
      description: notice.description ?? "",
    });
    setNoticeDate(notice.notice_date ? new Date(`${notice.notice_date}T00:00:00`) : null);
    setNoticeTo(notice.notice_to ? new Date(`${notice.notice_to}T00:00:00`) : null);
    setSelectedRecipientIds(
      Array.isArray(notice.notified_people_ids)
        ? notice.notified_people_ids.map((r: any) => r?.id ?? r)
        : []
    );
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteConfirm() {
    if (!noticeToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteNotice(noticeToDelete.id);
      setNotices((prev) => prev.filter((n) => n.id !== noticeToDelete.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.current?.show({ severity: "success", summary: "Aviso eliminado" });
      setNoticeToDelete(null);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar el aviso" });
    } finally {
      setLoadingDelete(false);
    }
  }

  function abrirModalUpload(item: any) {
    setNoticeParaUpload(item);
    setUploadFile(null);
    setCompressedSizeMB(null);
    setIsCompressing(false);
  }

  function closeUploadDialog() {
    setNoticeParaUpload(null);
    setUploadFile(null);
    setCompressedSizeMB(null);
    setIsCompressing(false);
  }

  async function handleFileSelected(file: File) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.current?.show({ severity: "error", summary: "Archivo no válido", detail: "El archivo debe ser JPG, PNG o PDF y pesar menos de 10MB." });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.current?.show({ severity: "error", summary: "Archivo no válido", detail: "El archivo debe ser JPG, PNG o PDF y pesar menos de 10MB." });
      return;
    }

    if (file.type === "application/pdf") {
      await compressPdfAndSet(file);
      return;
    }

    setIsCompressing(true);
    try {
      const compressedBlob = await imageCompression(file, { maxWidthOrHeight: 1024, initialQuality: 0.8, useWebWorker: true });
      const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type || file.type });

      if (compressedFile.size > MAX_FILE_SIZE) {
        toast.current?.show({ severity: "error", summary: "Archivo demasiado grande", detail: "La imagen optimizada supera los 10MB permitidos. No se puede subir el archivo." });
        setUploadFile(null);
        setCompressedSizeMB(null);
        return;
      }

      setUploadFile(compressedFile);
      setCompressedSizeMB((compressedFile.size / 1024 / 1024).toFixed(2));
    } catch {
      toast.current?.show({ severity: "warn", summary: "Aviso", detail: "No se pudo comprimir la imagen. Se usará el archivo original." });
      setUploadFile(file);
    } finally {
      setIsCompressing(false);
    }
  }

  async function compressPdfAndSet(file: File) {
    setIsCompressing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const compressedFile = new File([compressedBytes as BlobPart], file.name, { type: "application/pdf" });
      const finalFile = compressedFile.size < file.size ? compressedFile : file;

      if (finalFile.size > MAX_FILE_SIZE) {
        toast.current?.show({ severity: "error", summary: "Archivo demasiado grande", detail: "El PDF optimizado supera los 10MB permitidos. No se puede subir el archivo." });
        setUploadFile(null);
        setCompressedSizeMB(null);
        return;
      }

      setUploadFile(finalFile);
      setCompressedSizeMB((finalFile.size / 1024 / 1024).toFixed(2));
    } catch {
      toast.current?.show({ severity: "warn", summary: "Aviso", detail: "No se pudo optimizar el PDF. Se usará el archivo original." });
      setUploadFile(file);
    } finally {
      setIsCompressing(false);
    }
  }

  function subirArchivo() {
    if (!uploadFile || !noticeParaUpload) return;
    setIsUploading(true);
    uploadNoticeFile(noticeParaUpload.id, uploadFile)
      .then((resp) => {
        toast.current?.show({ severity: "success", summary: "Éxito", detail: "Documentación subida correctamente" });
        setNotices((prev) => prev.map((n) => {
          if (n.id !== noticeParaUpload.id) return n;
          return {
            ...n,
            attachments: [...(n.attachments ?? []), resp],
            status: { id: "documentacion_adjuntada", code: "documentacion_adjuntada", name: "Documentación Adjuntada" },
          };
        }));
        closeUploadDialog();
      })
      .catch((err: any) => {
        toast.current?.show({ severity: "error", summary: "Error", detail: err.message || "Hubo un problema al subir el archivo" });
      })
      .finally(() => setIsUploading(false));
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
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo abrir el archivo." });
    } finally {
      setIsDownloadingFile(false);
      setDownloadingId(null);
    }
  }

  function closePreview() {
    if (previewFile) URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  }

  const statusLabel = (s: any) => {
    const found = statuses.find((st) => st.id === (s?.id ?? s));
    return found?.name ?? s?.name ?? "";
  };

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

  const uploadDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="fa-solid fa-file-arrow-up" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Subir documentación</p>
      </div>
    </div>
  );

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar aviso</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      {loadingAction && (
        <div className="main-remote-overlay">
          <div className="d-flex flex-column align-items-center text-white text-center px-3">
            <div className="spinner-border text-light mb-3" role="status">
              <span className="sr-only">Procesando...</span>
            </div>
            <span>Procesando solicitud, generando aviso. Espere por favor.</span>
          </div>
        </div>
      )}

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(74,108,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-bell" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Avisos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Solicitá ausencias o llegadas tardes</small>
            </div>
          </div>
        </div>

        {/* Nuevo aviso */}
        <div className="card profile-card mt-4 fadeIn animated">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-plus-circle" style={{ color: "#3b82f6", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>{noticeParaModificar ? "Modificando aviso" : "Nuevo aviso"}</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{noticeParaModificar ? "Completá el formulario para modificar el aviso" : "Completá el formulario para generar un aviso"}</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
                <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
                  <div className="row">
                    <div className="col-12 col-md-4 mb-3">
                      <label className="profile-field-label">Tipo *</label>
                      <div className={`license-filter-input-wrap${form.type ? " license-filter-input-wrap--active" : ""}`}>
                        <i className="pi pi-tag license-filter-icon" />
                        <Dropdown
                          value={form.type || null}
                          options={types}
                          optionLabel="name"
                          optionValue="id"
                          onChange={(e) => { setForm((p) => ({ ...p, type: e.value ?? "", reason: "" })); setNoticeDate(null); setNoticeTo(null); }}
                          placeholder="Seleccioná un tipo"
                          className="license-filter-dropdown"
                          panelClassName="license-filter-dropdown-panel"
                          emptyMessage="Sin tipos"
                        />
                      </div>
                      {touched && !form.type && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                    </div>

                    {isAusencia && (
                      <div className="col-12 col-md-4 mb-3 fadeIn animated">
                        <label className="profile-field-label">Razón *</label>
                        <div className={`license-filter-input-wrap${form.reason ? " license-filter-input-wrap--active" : ""}`}>
                          <i className="pi pi-info-circle license-filter-icon" />
                          <Dropdown
                            value={form.reason || null}
                            options={reasons}
                            optionLabel="name"
                            optionValue="id"
                            onChange={(e) => setForm((p) => ({ ...p, reason: e.value ?? "" }))}
                            placeholder="Seleccioná una razón"
                            className="license-filter-dropdown"
                            panelClassName="license-filter-dropdown-panel"
                            emptyMessage="Sin razones"
                          />
                        </div>
                        {touched && !form.reason && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                      </div>
                    )}

                    <div className="col-12 col-md-4 mb-3">
                      <label className="profile-field-label">{isAusencia ? "Desde / Hasta *" : "Fecha *"}</label>
                      <div className={`license-filter-input-wrap${noticeDate ? " license-filter-input-wrap--active" : ""}`}>
                        <i className="pi pi-calendar license-filter-icon" />
                        {!isAusencia ? (
                          <Calendar
                            inputId="notice_date"
                            value={noticeDate}
                            onChange={(e) => setNoticeDate((e.value as Date) ?? null)}
                            readOnlyInput
                            dateFormat="dd/mm/yy"
                            locale="es-avisos"
                            showButtonBar
                            showOtherMonths={false}
                            disabledDays={[0, 6]}
                            minDate={weekMinDate}
                            maxDate={weekMaxDate}
                            placeholder="Seleccioná una fecha"
                            className="license-filter-dropdown"
                            panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                          />
                        ) : (
                          <Calendar
                            inputId="notice_range"
                            value={noticeDate ? [noticeDate, noticeTo] : null}
                            onChange={(e) => {
                              const [start, end] = (e.value as [Date | null, Date | null] | null) ?? [null, null];
                              setNoticeDate(start ?? null);
                              setNoticeTo(end ?? null);
                            }}
                            onTodayButtonClick={() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              setNoticeDate(today);
                              setNoticeTo(today);
                            }}
                            selectionMode="range"
                            readOnlyInput
                            dateFormat="dd/mm/yy"
                            locale="es-avisos"
                            showButtonBar
                            showOtherMonths={false}
                            disabledDays={[0, 6]}
                            minDate={weekMinDate}
                            maxDate={noticeDate ? addBusinessDays(noticeDate, 20) : weekMaxDate}
                            placeholder="Seleccioná el rango de fechas"
                            className="license-filter-dropdown"
                            panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                          />
                        )}
                      </div>
                      {isAusencia && noticeDate && noticeTo && noticeTo >= noticeDate && (() => {
                        const totalDays = countDays(noticeDate, noticeTo);
                        const businessDays = countBusinessDays(noticeDate, noticeTo);
                        return (
                          <small className="fadeIn animated" style={{ marginTop: "4px", display: "block", color: "#cbd5e1", fontSize: "0.72rem" }}>
                            {totalDays} {totalDays === 1 ? "día total" : "días totales"}
                            {businessDays !== totalDays && ` (${businessDays} ${businessDays === 1 ? "día hábil" : "días hábiles"})`}
                          </small>
                        );
                      })()}
                      {!isAusencia && touched && !noticeDate && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                      {isAusencia && touched && (!noticeDate || !noticeTo) && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Las fechas "Desde" y "Hasta" son obligatorias</small>}
                      {isAusencia && touched && noticeDate && noticeTo && noticeTo < noticeDate && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* La fecha "Hasta" no puede ser anterior a la fecha "Desde"</small>}
                    </div>

                  </div>

                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="profile-field-label">Descripción *</label>
                      <textarea className="profile-input" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                      {touched && !form.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12">
                      <label className="profile-field-label">Jefes a notificar</label>
                      {isLoadingRecipients && <small className="text-muted">Cargando jefes...</small>}
                      {!isLoadingRecipients && recipients.length === 0 && <small className="text-muted">No hay jefes disponibles</small>}
                      <div className="row">
                        {recipients.map((r) => (
                          <div key={r.id} className="col-12 col-md-6 col-lg-4">
                            <div className="form-check mb-2 pl-0">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`recipient_${r.id}`}
                                checked={isRecipientSelected(r.id)}
                                onChange={(e) => toggleRecipient(r.id, e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor={`recipient_${r.id}`}>
                                <span className="d-block">{r.lastname_name}</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {isAusencia && (
                    <Message
                      severity="info"
                      className="animated fadeIn mb-3 w-100"
                      style={{ justifyContent: "flex-start" }}
                      text="Cuando es por ausencia, puede que tenga que presentar la documentación dentro de las 48hs siguientes."
                    />
                  )}

                  <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                    <button
                      disabled={loadingAction}
                      type="submit"
                      className="btn btn-primary d-flex align-items-center"
                      style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                    >
                      <i className={loadingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                      {noticeParaModificar
                        ? (loadingAction ? "Modificando..." : "Modificar aviso")
                        : (loadingAction ? "Creando..." : "Crear aviso")}
                    </button>
                    <button
                      type="button"
                      disabled={loadingAction}
                      onClick={limpiar}
                      className="btn btn-light text-muted ml-auto"
                      style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
                    >
                      Limpiar
                    </button>
                  </div>
                </form>
          </div>
        </div>

        {/* Listado */}
        <div className="card profile-card license-main-card mt-4 fadeIn animated">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#e8edff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-bell" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Mis avisos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Listado de avisos generados</small>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => loadNotices(page)}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body">
            <div className="license-filter-bar">
              <div className="license-filter-bar-inputs">
                <div className={`license-filter-input-wrap${filterForm.notice_type_id ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-tag license-filter-icon" />
                  <Dropdown
                    value={filterForm.notice_type_id || null}
                    options={types}
                    optionLabel="name"
                    optionValue="id"
                    onChange={(e) => {
                      const selectedType = types.find((t) => t.id === e.value);
                      const isLlegadaTarde = selectedType?.name?.toLowerCase().includes("llegada tarde");
                      updateFilter({ notice_type_id: e.value ?? "", notice_reason_id: isLlegadaTarde ? "" : filterForm.notice_reason_id });
                    }}
                    placeholder="Tipo"
                    showClear
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>

                {!isFilterLlegadaTarde && (
                  <div className={`license-filter-input-wrap${filterForm.notice_reason_id ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-info-circle license-filter-icon" />
                    <Dropdown
                      value={filterForm.notice_reason_id || null}
                      options={reasons}
                      optionLabel="name"
                      optionValue="id"
                      onChange={(e) => updateFilter({ notice_reason_id: e.value ?? "" })}
                      placeholder="Razón"
                      showClear
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel"
                    />
                  </div>
                )}

                <div className={`license-filter-input-wrap${descInput ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-search license-filter-icon" />
                  <input
                    type="text"
                    className="license-filter-input"
                    placeholder="Buscar en descripción..."
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                  />
                </div>

                <div className={`license-filter-input-wrap${filterForm.date_from || filterForm.date_to ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-calendar license-filter-icon" />
                  <Calendar
                    value={filterForm.date_from
                      ? [new Date(`${filterForm.date_from}T00:00:00`), filterForm.date_to ? new Date(`${filterForm.date_to}T00:00:00`) : null]
                      : null}
                    onChange={(e) => {
                      const [start, end] = (e.value as (Date | null)[] | null) ?? [null, null];
                      updateFilter({ date_from: start ? formatDateForApi(start) : "", date_to: end ? formatDateForApi(end) : "" });
                    }}
                    selectionMode="range"
                    readOnlyInput
                    dateFormat="dd/mm/yy"
                    locale="es-avisos"
                    showButtonBar
                    placeholder="Fecha desde - hasta"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                  />
                </div>

                <div className={`license-filter-input-wrap${filterForm.notice_status_id ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-flag license-filter-icon" />
                  <Dropdown
                    value={filterForm.notice_status_id || null}
                    options={statuses}
                    optionLabel="name"
                    optionValue="id"
                    onChange={(e) => updateFilter({ notice_status_id: e.value ?? "" })}
                    placeholder="Estado"
                    showClear
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>
              </div>

              {(descInput || Object.values(filterForm).some((v) => v)) && (
                <button type="button" className="license-filter-clear" onClick={clearFilters}>
                  <i className="pi pi-filter-slash" /> Limpiar filtros
                </button>
              )}
            </div>

            {loading && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mt-3" />}

            <div className="mt-3">
              <DataTable
                value={notices}
                className="p-datatable-sm license-table"
                emptyMessage={
                  <div className="license-empty">
                    <i className="pi pi-inbox" />
                    <p>No hay avisos para mostrar</p>
                  </div>
                }
              >
                <Column header="TIPO" body={(n) => <CategoryBadge label={n.type?.name} id={n.type?.id} list={types} />} />
                {!isFilterLlegadaTarde && (
                  <Column header="RAZÓN" body={(n) => <CategoryBadge label={n.reason?.name} id={n.reason?.id} palette={REASON_PALETTE} list={reasons} />} />
                )}
                <Column
                  header="DESCRIPCIÓN"
                  style={{ maxWidth: 260 }}
                  body={(n) => (
                    <Tooltip label={n.description ?? ""}>
                      <small style={{ display: "block", maxWidth: 250, wordBreak: "break-word" }}>
                        {n.description?.length > 45 ? `${n.description.slice(0, 45)}...` : n.description}
                      </small>
                    </Tooltip>
                  )}
                />
                <Column
                  header="FECHA"
                  body={(n) => {
                    const hasRange = n.type?.code === "ausencia" && n.notice_date && n.notice_to;
                    const start = hasRange ? new Date(`${n.notice_date}T00:00:00`) : null;
                    const end = hasRange ? new Date(`${n.notice_to}T00:00:00`) : null;
                    const days = start && end ? countDays(start, end) : null;
                    const businessDays = start && end ? countBusinessDays(start, end) : null;
                    return (
                      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                        <small>{formatDateDisplay(n.notice_date)}{n.notice_to ? ` - ${formatDateDisplay(n.notice_to)}` : ""}</small>
                        {days !== null && (
                          <span
                            className="badge rounded-pill"
                            style={{ background: "#f1f5f9", color: "#64748b", fontWeight: 600, fontSize: "0.68rem", padding: "3px 8px", whiteSpace: "nowrap" }}
                          >
                            {days} {days === 1 ? "día total" : "días totales"}
                            {businessDays !== days && ` (${businessDays} ${businessDays === 1 ? "día hábil" : "días hábiles"})`}
                          </span>
                        )}
                      </div>
                    );
                  }}
                />
                <Column
                  header="ESTADO"
                  body={(n) => {
                    const label = statusLabel(n.status);
                    const color = getStatusColor(label);
                    return (
                      <span
                        className="badge rounded-pill"
                        style={{ background: `${color}1a`, color, border: "none", fontWeight: 600, padding: "4px 10px" }}
                      >
                        {label}
                      </span>
                    );
                  }}
                />
                <Column
                  header=""
                  body={(n) => (
                    <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                      {n.type?.code === "ausencia" && (
                        <>
                          {hasAttachment(n) && (
                            isDownloadingFile && downloadingId === getUltimoAdjunto(n)?.id ? (
                              <span style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#94a3b8", cursor: "not-allowed" }}>
                                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "0.85rem" }} />
                              </span>
                            ) : (
                              <Tooltip label="Ver último archivo subido">
                                <button type="button" onClick={() => abrirArchivo(getUltimoAdjunto(n))} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                                  <i className="fa-solid fa-file" style={{ fontSize: "0.85rem" }} />
                                </button>
                              </Tooltip>
                            )
                          )}

                          {!hasAttachment(n) && isTimeExpired(n) && (
                            <Tooltip label="Pasaron 48hs, no puede subir archivos.">
                              <span style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545", cursor: "not-allowed" }}>
                                <ClockAlert size={14} />
                              </span>
                            </Tooltip>
                          )}

                          {checkCanUpload(n) && (
                            <Tooltip label="Subir documentación">
                              <button type="button" onClick={() => abrirModalUpload(n)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
                                <i className="fa-solid fa-file-arrow-up" style={{ fontSize: "0.85rem" }} />
                              </button>
                            </Tooltip>
                          )}
                        </>
                      )}

                      {n.status?.id === "creado" && (
                        <Tooltip label="Eliminar">
                          <button type="button" onClick={() => setNoticeToDelete(n)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                            <i className="fa-regular fa-circle-xmark" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      )}

                      <Tooltip label="Ver detalle">
                        <button type="button" onClick={() => openNoticeDetail(n.id)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                          <i className="pi pi-external-link" style={{ fontSize: "0.85rem" }} />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                />
              </DataTable>

              <Paginator
                className="mt-2"
                first={(page - 1) * perPage}
                rows={perPage}
                totalRecords={total}
                rowsPerPageOptions={[10, 15, 20]}
                onPageChange={(e) => loadNotices(e.page + 1, filterForm, e.rows)}
                pageLinkSize={3}
                rightContent={
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                    {total} {total === 1 ? "aviso" : "avisos"}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visor de archivo adjunto */}
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

      {/* Detalle del aviso */}
      <Sidebar
        visible={!!selectedNoticeId}
        position="right"
        showCloseIcon
        onHide={closeNoticeDetail}
        style={{ width: "min(720px, 95vw)" }}
      >
        {selectedNoticeId && (
          <AbsenceNoticeDetail
            id={selectedNoticeId}
            onClose={closeNoticeDetail}
            onChanged={() => loadNotices(page, filterForm, perPage)}
          />
        )}
      </Sidebar>

      {/* Confirmar eliminación */}
      <Dialog
        header={deleteDialogHeader}
        visible={!!noticeToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setNoticeToDelete(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingDelete}
                onClick={handleDeleteConfirm}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingDelete ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {loadingDelete ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={loadingDelete}
                onClick={() => setNoticeToDelete(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingDelete && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar el aviso. Esta acción no se puede deshacer.
        </p>
      </Dialog>

      {/* Subir documentación */}
      <Dialog
        header={uploadDialogHeader}
        visible={!!noticeParaUpload}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(480px, 92vw)" }}
        onHide={closeUploadDialog}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                type="button"
                disabled={!uploadFile || isUploading || isCompressing}
                onClick={subirArchivo}
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={isUploading || isCompressing ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {isCompressing ? "Optimizando..." : isUploading ? "Subiendo..." : "Subir documento"}
              </button>
              <button
                type="button"
                disabled={isUploading || isCompressing}
                onClick={closeUploadDialog}
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {(isUploading || isCompressing) && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <Message
          severity="info"
          className="mb-3 w-100"
          style={{ justifyContent: "flex-start" }}
          text={<small>Solo se admiten formatos <strong>PNG, JPG, JPEG y PDF</strong>, con un peso máximo de <strong>10MB</strong>.</small>}
        />

        <div
          className={`dropzone-area${uploadDrag ? " drag-over" : ""} text-center`}
          onDragOver={(e) => { e.preventDefault(); setUploadDrag(true); }}
          onDragLeave={() => setUploadDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setUploadDrag(false);
            if (!uploadFile && !isCompressing && e.dataTransfer.files[0]) handleFileSelected(e.dataTransfer.files[0]);
          }}
          onClick={() => !uploadFile && !isCompressing && uploadInputRef.current?.click()}
        >
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); }}
          />

          {isCompressing && (
            <div>
              <i className="fa-solid fa-circle-notch fa-spin mb-2 text-primary" style={{ fontSize: "1.5rem" }} /><br />
              <span className="text-muted">Optimizando archivo...</span>
            </div>
          )}

          {!isCompressing && !uploadFile && (
            <div>
              <i className="fa-solid fa-cloud-arrow-up mb-2 text-primary" style={{ fontSize: "1.5rem" }} /><br />
              Arrastra tu archivo aquí o haz clic para seleccionar
            </div>
          )}

          {!isCompressing && uploadFile && (
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
                onClick={(e) => { e.stopPropagation(); setUploadFile(null); setCompressedSizeMB(null); }}
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        {compressedSizeMB !== null && (
          <div className="mt-2 text-muted small">
            <i className="fa-solid fa-circle-check text-success mr-1" />
            Archivo optimizado · <strong>{compressedSizeMB} MB</strong>
          </div>
        )}
      </Dialog>

    </>
  );
}
