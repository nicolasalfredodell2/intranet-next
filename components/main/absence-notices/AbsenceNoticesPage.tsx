"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Paginator } from "primereact/paginator";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";
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

addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Limpiar",
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

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

function getStatusClass(statusId: string): string {
  switch (statusId) {
    case "aprobado": return "bg-success text-white";
    case "creado": return "bg-secondary text-white";
    case "documentacion_adjuntada": return "bg-info text-white";
    case "documentacion_aprobada": return "bg-primary text-white";
    case "documentacion_rechazada": return "bg-warning text-dark";
    case "rechazado": return "bg-danger text-white";
    default: return "bg-light text-dark";
  }
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

export default function AbsenceNoticesPage() {
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
  const perPage = 10;
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

  const [historyAttachments, setHistoryAttachments] = useState<any[] | null>(null);

  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    loadConfig();
    loadNotices();
    loadRecipients();
  }, []);

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

  async function loadNotices(p = 1, f: FilterForm = filterForm) {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await getMyNotices(p, perPage, f);
      setNotices(resp.data ?? []);
      setTotal(resp.meta?.total ?? 0);
      setPage(p);
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

  function abrirModalHistorial(attachments: any[]) {
    setHistoryAttachments([...attachments].sort((a, b) => b.id - a.id));
  }

  async function abrirArchivo(attachment: any) {
    if (!attachment?.id) return;
    setIsDownloadingFile(true);
    setDownloadingId(attachment.id);
    try {
      const blob = await getNoticeFile(attachment.id);
      const mimeType = blob.type || "application/octet-stream";
      const finalBlob = new Blob([blob], { type: mimeType });
      const fileURL = URL.createObjectURL(finalBlob);
      const isPDF = mimeType === "application/pdf" || attachment.name?.toLowerCase().endsWith(".pdf");

      if (isPDF) {
        const link = document.createElement("a");
        link.href = fileURL;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
      } else {
        const filename = attachment.name || "imagen";
        const newWin = window.open("", "_blank");
        if (newWin) {
          newWin.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${filename}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1a1a1a; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
.bar { position: fixed; top: 0; left: 0; right: 0; height: 52px; background: rgba(0,0,0,0.78); display: flex; align-items: center; padding: 0 16px; gap: 12px; z-index: 10; }
.dl { color: #fff; background: #0d6efd; border-radius: 4px; padding: 6px 14px; text-decoration: none; font: 14px/1 sans-serif; white-space: nowrap; }
.dl:hover { background: #0b5ed7; }
.name { color: #bbb; font: 13px/1 sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
img { max-width: 100%; max-height: calc(100vh - 72px); object-fit: contain; margin-top: 68px; }
</style>
</head>
<body>
<div class="bar">
<a class="dl" href="${fileURL}" download="${filename}">&#8595; Descargar</a>
<span class="name">${filename}</span>
</div>
<img src="${fileURL}" alt="${filename}">
</body>
</html>`);
          newWin.document.close();
        }
        setTimeout(() => URL.revokeObjectURL(fileURL), 300000);
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo abrir el archivo." });
    } finally {
      setIsDownloadingFile(false);
      setDownloadingId(null);
    }
  }

  const statusLabel = (s: any) => {
    const found = statuses.find((st) => st.id === (s?.id ?? s));
    return found?.name ?? s?.name ?? "";
  };

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
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Avisos</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Avisos</li>
            </ol>
          </div>
        </div>

        {/* Formulario */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <form className="animated fadeIn row" onSubmit={handleSubmit} noValidate>
                  <div className="fadeIn animated form-group col-12 col-lg-6">
                    <label className="col-12"><small>Tipo *</small></label>
                    <div className="col-md-12">
                      <select className="custom-select w-100" value={form.type} onChange={(e) => { setForm((p) => ({ ...p, type: e.target.value, reason: "" })); setNoticeDate(null); setNoticeTo(null); }}>
                        <option value=""></option>
                        {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      {touched && !form.type && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                    </div>

                    {isAusencia && (
                      <div className="alert alert-info mt-4 mx-3 d-flex align-items-center animated fadeIn">
                        <i className="mdi mdi-information-outline mr-2" />
                        <div><strong>Cuando es por ausencia, puede que tenga que presentar la documentación dentro de las 48hs siguientes.</strong></div>
                      </div>
                    )}

                    {isAusencia && (
                      <div className="fadeIn animated form-group mt-3">
                        <label className="col-md-12"><small>Razón <span className="text-danger">*</span></small></label>
                        <div className="col-md-12">
                          <select className="custom-select w-100" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}>
                            <option value=""></option>
                            {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          {touched && !form.reason && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                        </div>
                      </div>
                    )}

                    <div className="fadeIn animated form-group mt-3">
                      <label className="col-md-12"><small>Descripción *</small></label>
                      <div className="col-md-12">
                        <textarea className="form-control" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                        {touched && !form.description && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                      </div>
                    </div>

                    <div className="fadeIn animated form-group mt-3">
                      <label className="col-md-12"><small>Jefes a notificar</small></label>
                      <div className="col-md-12">
                        {isLoadingRecipients && <small className="text-muted">Cargando jefes...</small>}
                        {!isLoadingRecipients && recipients.length === 0 && <small className="text-muted">No hay jefes disponibles</small>}
                        {recipients.map((r) => (
                          <div key={r.id} className="form-check mb-2">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`recipient_${r.id}`}
                              checked={isRecipientSelected(r.id)}
                              onChange={(e) => toggleRecipient(r.id, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`recipient_${r.id}`}>
                              <span className="d-block">{r.lastname_name}</span>
                              <small className="text-muted">{r.email}</small>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!isAusencia && (
                    <div className="fadeIn animated form-group col-12 col-lg-3">
                      <label className="col-12 d-flex align-items-center justify-content-between">
                        <small>Fecha <span className="text-danger">*</span></small>
                        {noticeDate && (
                          <button type="button" className="btn btn-sm btn-link p-0 text-muted" title="Quitar fecha" onClick={() => setNoticeDate(null)}>
                            <i className="mdi mdi-close-circle-outline" /> Quitar
                          </button>
                        )}
                      </label>
                      <div className="col-12">
                        <Calendar
                          inputId="notice_date"
                          value={noticeDate}
                          onChange={(e) => setNoticeDate((e.value as Date) ?? null)}
                          dateFormat="dd/mm/yy"
                          locale="es"
                          disabledDays={[0, 6]}
                          minDate={weekMinDate}
                          maxDate={weekMaxDate}
                          inline
                          className="w-100"
                        />
                        <small className="text-muted d-block mt-1">Fecha: <strong>{noticeDate ? formatDateDisplay(formatDateForApi(noticeDate)) : "-"}</strong></small>
                        {touched && !noticeDate && <small className="text-danger animated fadeIn d-block">* Campo obligatorio</small>}
                      </div>
                    </div>
                  )}

                  {isAusencia && (
                    <div className="fadeIn animated form-group col-12 col-lg-3">
                      <label className="col-12 d-flex align-items-center justify-content-between">
                        <small>Desde / Hasta <span className="text-danger">*</span></small>
                        {noticeDate && (
                          <button type="button" className="btn btn-sm btn-link p-0 text-muted" title="Quitar fechas" onClick={() => { setNoticeDate(null); setNoticeTo(null); }}>
                            <i className="mdi mdi-close-circle-outline" /> Quitar
                          </button>
                        )}
                      </label>
                      <div className="col-md-12">
                        <Calendar
                          inputId="notice_range"
                          value={noticeDate ? [noticeDate, noticeTo] : null}
                          onChange={(e) => {
                            const [start, end] = (e.value as [Date | null, Date | null] | null) ?? [null, null];
                            setNoticeDate(start ?? null);
                            setNoticeTo(end ?? null);
                          }}
                          selectionMode="range"
                          dateFormat="dd/mm/yy"
                          locale="es"
                          disabledDays={[0, 6]}
                          minDate={weekMinDate}
                          maxDate={noticeDate ? addBusinessDays(noticeDate, 20) : weekMaxDate}
                          inline
                          className="w-100"
                        />
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted">Desde: <strong>{noticeDate ? formatDateDisplay(formatDateForApi(noticeDate)) : "-"}</strong></small>
                          <small className="text-muted">Hasta: <strong>{noticeTo ? formatDateDisplay(formatDateForApi(noticeTo)) : "-"}</strong></small>
                        </div>
                        {touched && (!noticeDate || !noticeTo) && <small className="text-danger animated fadeIn d-block">* Las fechas "Desde" y "Hasta" son obligatorias</small>}
                        {touched && noticeDate && noticeTo && noticeTo < noticeDate && <small className="text-danger animated fadeIn d-block">* La fecha "Hasta" no puede ser anterior a la fecha "Desde"</small>}
                      </div>
                    </div>
                  )}

                  <div className="fadeIn animated form-group col-12">
                    <div className="row">
                      <div className="col-6">
                        <button disabled={loadingAction} type="submit" className="btn btn-block btn-info">
                          {noticeParaModificar
                            ? (loadingAction ? "MODIFICANDO AVISO" : "MODIFICAR AVISO")
                            : (loadingAction ? "CREANDO AVISO" : "CREAR AVISO")}
                        </button>
                      </div>
                      <div className="col-6">
                        <button type="button" disabled={loadingAction} className="btn btn-block btn-muted" onClick={limpiar}>Limpiar</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <hr />

        {/* Listado */}
        <div className="card profile-card license-main-card">
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
                    onChange={(e) => updateFilter({ notice_type_id: e.value ?? "" })}
                    placeholder="Tipo"
                    showClear
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>

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

                <div className={`license-filter-input-wrap${filterForm.date_from ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-calendar license-filter-icon" />
                  <input type="date" className="license-filter-input" title="Fecha desde" value={filterForm.date_from} onChange={(e) => updateFilter({ date_from: e.target.value })} />
                </div>

                <div className={`license-filter-input-wrap${filterForm.date_to ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-calendar license-filter-icon" />
                  <input type="date" className="license-filter-input" title="Fecha hasta" value={filterForm.date_to} onChange={(e) => updateFilter({ date_to: e.target.value })} />
                </div>
              </div>

              <button type="button" className="license-filter-clear" onClick={clearFilters}>
                <i className="pi pi-filter-slash" /> Limpiar filtros
              </button>
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
                <Column header="TIPO" body={(n) => <small>{n.type?.name}</small>} />
                <Column header="RAZÓN" body={(n) => <small>{n.reason?.name ?? "-"}</small>} />
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
                  body={(n) => (
                    <small>{formatDateDisplay(n.notice_date)}{n.notice_to ? ` - ${formatDateDisplay(n.notice_to)}` : ""}</small>
                  )}
                />
                <Column
                  header="ESTADO"
                  body={(n) => (
                    <span className={`badge rounded-pill ${getStatusClass(n.status?.id)}`}>
                      {statusLabel(n.status)}
                    </span>
                  )}
                />
                <Column
                  header="ACCIONES"
                  body={(n) => (
                    <div className="d-flex align-items-center" style={{ gap: "4px" }}>
                      {n.type?.code === "ausencia" && (
                        <>
                          {hasAttachment(n) && (
                            isDownloadingFile && downloadingId === getUltimoAdjunto(n)?.id ? (
                              <i className="fa-solid fa-spinner fa-spin mx-1 text-primary" />
                            ) : (
                              <Tooltip label="Ver último archivo subido">
                                <i className="fa-solid fa-file mx-1 text-dark pointer" onClick={() => abrirArchivo(getUltimoAdjunto(n))} />
                              </Tooltip>
                            )
                          )}

                          {!hasAttachment(n) && isTimeExpired(n) && (
                            <Tooltip label="Plazo de 48hs vencido. Ya no se pueden subir archivos.">
                              <i className="fa-solid fa-clock-rotate-left mx-1 text-danger" style={{ cursor: "not-allowed" }} />
                            </Tooltip>
                          )}

                          {n.attachments?.length > 1 && (
                            <Tooltip label="Ver historial de archivos">
                              <i className="fa-solid fa-clock-rotate-left mx-1 text-info pointer" onClick={() => abrirModalHistorial(n.attachments)} />
                            </Tooltip>
                          )}

                          {checkCanUpload(n) && (
                            <Tooltip label="Subir documentación">
                              <i className="fa-solid fa-file-arrow-up mx-1 pointer text-primary" onClick={() => abrirModalUpload(n)} />
                            </Tooltip>
                          )}
                        </>
                      )}

                      <Tooltip label="Modificar">
                        <i className="fa-regular fa-pen-to-square mx-1 pointer text-info" onClick={() => llenarFormulario(n)} />
                      </Tooltip>

                      {n.status?.id === "creado" && (
                        <Tooltip label="Eliminar">
                          <i className="fa-regular fa-circle-xmark mx-1 pointer text-danger" onClick={() => setNoticeToDelete(n)} />
                        </Tooltip>
                      )}
                    </div>
                  )}
                />
              </DataTable>

              <Paginator
                className="mt-2"
                rows={perPage}
                totalRecords={total}
                onPageChange={(e) => loadNotices(e.page + 1)}
                pageLinkSize={3}
              />
            </div>
          </div>
        </div>
      </div>

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
        header="Subir Documentación"
        visible={!!noticeParaUpload}
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
            <button
              type="button"
              className="btn btn-primary"
              disabled={!uploadFile || isUploading || isCompressing}
              onClick={subirArchivo}
            >
              {!isUploading && !isCompressing && "Subir Documento"}
              {isCompressing && <><i className="fa-solid fa-circle-notch fa-spin" /> Optimizando...</>}
              {isUploading && !isCompressing && <><i className="fa-solid fa-circle-notch fa-spin" /> Subiendo...</>}
            </button>
          </div>
        }
      >
        <div className="alert alert-info mt-2">
          <i className="mdi mdi-information-outline mr-2" />
          <small>Solo se admiten formatos <strong>PNG, JPG, JPEG y PDF</strong>, con un peso máximo de <strong>10MB</strong>.</small>
        </div>

        <div
          className={`dropzone-area${uploadDrag ? " drag-over" : ""} text-center mt-3`}
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

      {/* Historial de archivos */}
      <Dialog
        header="Historial de Archivos Adjuntos"
        visible={!!historyAttachments}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ width: "min(480px, 92vw)" }}
        onHide={() => setHistoryAttachments(null)}
        footer={
          <button type="button" className="btn btn-outline-secondary" onClick={() => setHistoryAttachments(null)}>
            Cerrar
          </button>
        }
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {(historyAttachments ?? []).map((file, i) => (
            <div key={file.id} className="border rounded mb-2 p-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 font-weight-bold">
                  <i className="fa-solid fa-file-pdf text-danger mr-2" /> {file.name}
                  {i === 0 && <span className="badge badge-success ml-2">Último subido</span>}
                </h6>
                <small className="text-muted">{file.created_at}</small>
              </div>

              <div className="mb-2">
                <button className="btn btn-sm btn-outline-primary" onClick={() => abrirArchivo(file)}>
                  <i className="fa-solid fa-eye" /> Ver documento
                </button>
              </div>

              {file.rejection_reasons && file.rejection_reasons.length > 0 && (
                <div className="alert alert-danger p-2 mb-0">
                  <small className="font-weight-bold"><i className="fa-solid fa-circle-exclamation" /> Motivos de rechazo:</small>
                  <ul className="mb-0 pl-3 mt-1">
                    {file.rejection_reasons.map((reason: any, idx: number) => (
                      <li key={idx}><small>{reason.reason} <span className="text-muted">({reason.created_at})</span></small></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}
