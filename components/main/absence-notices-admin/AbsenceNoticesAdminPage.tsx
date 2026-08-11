"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Paginator } from "primereact/paginator";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Sidebar } from "primereact/sidebar";
import { OverlayPanel } from "primereact/overlaypanel";
import { addLocale } from "primereact/api";
import {
  getNoticesConfig,
  getAllNoticesAdmin,
  changeNoticeStatusAdmin,
  rejectNoticeAttachment,
  getNoticeFile,
} from "@/lib/services/absence-notices.service";

addLocale("es-avisos-admin", {
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

interface FilterForm {
  notice_type_id: string;
  notice_reason_id: string;
  notice_status_id: string;
  legajo: string;
  name: string;
  date_from: string;
  date_to: string;
}

const EMPTY_FILTERS: FilterForm = { notice_type_id: "", notice_reason_id: "", notice_status_id: "", legajo: "", name: "", date_from: "", date_to: "" };

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
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

function formatDateForApi(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${hh}:${mm}`;
}

// Paleta de estado por código, igual al mapeo de clases del listado Angular original.
const STATUS_BADGE_COLORS: Record<string, string> = {
  creado: "#64748b",
  recibido: "#d946ef",
  pendiente_documentacion: "#6366f1",
  documentacion_adjuntada: "#0ea5e9",
  documentacion_aprobada: "#4a6cf7",
  documentacion_rechazada: "#eab308",
  aprobado: "#059669",
  rechazado: "#dc3545",
  finalizado: "#475569",
};

function getStatusColor(code: string | undefined | null): string {
  return STATUS_BADGE_COLORS[code ?? ""] ?? "#94a3b8";
}

const CATEGORY_PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const REASON_PALETTE = ["#eb6834", "#eda100", "#e87ba4", "#4a3aa7", "#e34948"];

function colorByIndex(id: string | number, list: any[], palette: string[]): string {
  const idx = list.findIndex((item) => item.id === id);
  return palette[(idx >= 0 ? idx : 0) % palette.length];
}

function CategoryBadge({ label, id, palette = CATEGORY_PALETTE, list }: { label?: string | null; id?: string | number | null; palette?: string[]; list: any[] }) {
  if (!label || !id) return <small>-</small>;
  const color = colorByIndex(id, list, palette);
  return (
    <span className="badge rounded-pill" style={{ background: `${color}1a`, color, border: "none", fontWeight: 600, padding: "4px 10px" }}>
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

// ── Helpers de adjuntos / flujo de estados (migrados de list.component.ts) ──
function hasAttachment(item: any): boolean {
  return Array.isArray(item?.attachments) && item.attachments.length > 0;
}

function getUltimoAdjunto(item: any) {
  if (!hasAttachment(item)) return null;
  return [...item.attachments].sort((a: any, b: any) => b.id - a.id)[0];
}

function canManageDocumentation(item: any): boolean {
  if (item?.status?.code !== "documentacion_adjuntada") return false;
  const latest = getUltimoAdjunto(item);
  if (!latest) return false;
  return !latest.rejection_reasons?.length;
}

function canActOnDoc(item: any): boolean {
  const status = item.status?.code;
  return (status === "pendiente_documentacion" || status === "documentacion_adjuntada") && item.type?.code !== "llegada_tarde";
}

function canFinalizar(item: any): boolean {
  return item.type?.code === "ausencia" && item.status?.code === "aprobado";
}

function hasWorkflowActions(item: any): boolean {
  return item.status?.code === "creado" || canActOnDoc(item) || canFinalizar(item) || (item.attachments?.length ?? 0) > 1;
}

const MENU_ITEM_STYLE = { display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 14px", background: "none", border: "none", textAlign: "left" as const, fontSize: "0.84rem", color: "#374151", cursor: "pointer" };

export default function AbsenceNoticesAdminPage() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<OverlayPanel>(null);

  const [types, setTypes] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);

  const [notices, setNotices] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingAbsensceNotices, setIsLoadingAbsensceNotices] = useState(false);

  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS);
  const [legajoInput, setLegajoInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Menú de acciones de flujo (el "..." de cada fila)
  const [menuNotice, setMenuNotice] = useState<any>(null);
  const [noticeSeleccionado, setNoticeSeleccionado] = useState<any>(null);

  const [displayRecibidoDialog, setDisplayRecibidoDialog] = useState(false);
  const [isProcessingRecibido, setIsProcessingRecibido] = useState(false);

  const [displayActionDialog, setDisplayActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"aprobar" | "rechazar" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [observation, setObservation] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [displayAprobarDocDialog, setDisplayAprobarDocDialog] = useState(false);
  const [aprobarDocObservation, setAprobarDocObservation] = useState("");
  const [isProcessingAprobarDoc, setIsProcessingAprobarDoc] = useState(false);

  const [displayRejectFileDialog, setDisplayRejectFileDialog] = useState(false);
  const [attachmentToReject, setAttachmentToReject] = useState<any>(null);
  const [fileRejectionReason, setFileRejectionReason] = useState("");
  const [isProcessingRejectFile, setIsProcessingRejectFile] = useState(false);

  const [displayFinalizarDialog, setDisplayFinalizarDialog] = useState(false);
  const [isProcessingFinalizar, setIsProcessingFinalizar] = useState(false);

  const [displayHistoryDialog, setDisplayHistoryDialog] = useState(false);
  const [historyAttachments, setHistoryAttachments] = useState<any[]>([]);

  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(null);

  useEffect(() => {
    loadConfig();
    loadAbsenceNotices();
  }, []);

  // Debounce de los filtros de texto (legajo / nombre)
  useEffect(() => {
    const t = setTimeout(() => {
      if (legajoInput !== filters.legajo || nameInput !== filters.name) {
        updateFilters({ legajo: legajoInput, name: nameInput });
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legajoInput, nameInput]);

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

  async function loadAbsenceNotices(page = 1, perPage = rows, f: FilterForm = filters) {
    if (isLoadingAbsensceNotices) return;
    setIsLoadingAbsensceNotices(true);
    try {
      const resp = await getAllNoticesAdmin(page, perPage, f);
      setNotices(resp.data ?? []);
      setTotalRecords(resp.meta?.total ?? 0);
      setRows(perPage);
      setCurrentPage(resp.meta?.current_page ?? page);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setIsLoadingAbsensceNotices(false);
    }
  }

  function reload() {
    loadAbsenceNotices(currentPage, rows, filters);
  }

  function paginate(event: { page: number; first: number; rows: number }) {
    loadAbsenceNotices(event.page + 1, event.rows, filters);
  }

  function updateFilters(patch: Partial<FilterForm>) {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      loadAbsenceNotices(1, rows, next);
      return next;
    });
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setLegajoInput("");
    setNameInput("");
    loadAbsenceNotices(1, rows, EMPTY_FILTERS);
  }

  const statusLabel = (s: any) => {
    const found = statuses.find((st) => st.id === (s?.id ?? s));
    return found?.name ?? s?.name ?? "";
  };

  // ── Menú de acciones de flujo ──
  function openMenu(e: React.MouseEvent, n: any) {
    setMenuNotice(n);
    menuRef.current?.toggle(e);
  }

  function closeMenu() {
    menuRef.current?.hide();
  }

  // ── Confirmar recepción ──
  function abrirModalRecibido(n: any) {
    setNoticeSeleccionado(n);
    setDisplayRecibidoDialog(true);
  }

  async function confirmarRecibido() {
    const statusId = statuses.find((s) => s.code === "recibido")?.id;
    if (!statusId) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se encontró el estado \"recibido\" en la configuración." });
      return;
    }
    setIsProcessingRecibido(true);
    try {
      await changeNoticeStatusAdmin(noticeSeleccionado.id, { notice_status_id: statusId });
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Aviso marcado como recibido correctamente" });
      setDisplayRecibidoDialog(false);
      reload();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo procesar la solicitud" });
    } finally {
      setIsProcessingRecibido(false);
    }
  }

  // ── Aprobar / rechazar ──
  function abrirModalAccion(n: any, type: "aprobar" | "rechazar") {
    setNoticeSeleccionado(n);
    setActionType(type);
    setRejectionReason("");
    setObservation("");
    setDisplayActionDialog(true);
  }

  async function confirmarAccion() {
    if (actionType === "rechazar" && !rejectionReason) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Debe ingresar un motivo de rechazo" });
      return;
    }
    const payload: any = { notice_status_id: actionType === "aprobar" ? 7 : 8 };
    if (actionType === "rechazar") payload.rejection_reason = rejectionReason;
    else if (observation.trim()) payload.observation = observation.trim();

    setIsProcessingAction(true);
    try {
      await changeNoticeStatusAdmin(noticeSeleccionado.id, payload);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: actionType === "aprobar" ? "Aviso aprobado correctamente" : "Aviso rechazado correctamente" });
      setDisplayActionDialog(false);
      reload();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo procesar la solicitud" });
    } finally {
      setIsProcessingAction(false);
    }
  }

  // ── Aprobar documentación ──
  function abrirModalAprobarDoc(n: any) {
    setNoticeSeleccionado(n);
    setAprobarDocObservation("");
    setDisplayAprobarDocDialog(true);
  }

  async function confirmarAprobarDoc() {
    setIsProcessingAprobarDoc(true);
    const payload: any = { notice_status_id: 5 };
    if (aprobarDocObservation.trim()) payload.observation = aprobarDocObservation.trim();
    try {
      await changeNoticeStatusAdmin(noticeSeleccionado.id, payload);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Documentación aprobada correctamente" });
      setDisplayAprobarDocDialog(false);
      reload();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo aprobar la documentación" });
    } finally {
      setIsProcessingAprobarDoc(false);
    }
  }

  // ── Rechazar archivo adjunto ──
  function abrirModalRechazarArchivo(attachment: any) {
    setAttachmentToReject(attachment);
    setFileRejectionReason("");
    setDisplayRejectFileDialog(true);
  }

  async function confirmarRechazoArchivo() {
    if (!fileRejectionReason) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Debe ingresar un motivo de rechazo" });
      return;
    }
    setIsProcessingRejectFile(true);
    try {
      await rejectNoticeAttachment(attachmentToReject.id, fileRejectionReason.trim());
      toast.current?.show({ severity: "success", summary: "Documento rechazado" });
      setDisplayRejectFileDialog(false);
      reload();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo rechazar el archivo." });
    } finally {
      setIsProcessingRejectFile(false);
    }
  }

  // ── Finalizar ──
  function abrirModalFinalizar(n: any) {
    setNoticeSeleccionado(n);
    setDisplayFinalizarDialog(true);
  }

  async function confirmarFinalizar() {
    const statusId = statuses.find((s) => s.code === "finalizado")?.id;
    if (!statusId) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se encontró el estado \"finalizado\" en la configuración." });
      return;
    }
    setIsProcessingFinalizar(true);
    try {
      await changeNoticeStatusAdmin(noticeSeleccionado.id, { notice_status_id: statusId });
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Aviso finalizado correctamente" });
      setDisplayFinalizarDialog(false);
      reload();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo finalizar el aviso" });
    } finally {
      setIsProcessingFinalizar(false);
    }
  }

  // ── Historial de adjuntos ──
  function abrirModalHistorial(attachments: any[]) {
    setHistoryAttachments([...attachments].sort((a, b) => b.id - a.id));
    setDisplayHistoryDialog(true);
  }

  // ── Ver archivo ──
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

  const isFilterLlegadaTarde = types.find((t) => t.id == filters.notice_type_id)?.name?.toLowerCase().includes("llegada tarde");
  const hasFilters = Object.values(filters).some((v) => v);

  const previewNameParts = previewFile?.name.split(".") ?? [];
  const previewExt = previewNameParts.length > 1 ? previewNameParts.pop() : null;
  const previewNameNoExt = previewNameParts.join(".");

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-bell" style={{ color: "#eab308", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Avisos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Administración de avisos del personal</small>
            </div>
          </div>
        </div>

        {/* Listado */}
        <div className="card profile-card license-main-card mt-4 fadeIn animated">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-list" style={{ color: "#eab308", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Listado de avisos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Avisos generados por todo el personal</small>
            </div>
            <button
              type="button"
              disabled={isLoadingAbsensceNotices}
              onClick={reload}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={isLoadingAbsensceNotices ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body">
            <div className="license-filter-bar">
              <div className="license-filter-bar-inputs">
                <div className={`license-filter-input-wrap${legajoInput ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-id-card license-filter-icon" />
                  <input
                    type="text"
                    className="license-filter-input"
                    placeholder="Legajo"
                    value={legajoInput}
                    onChange={(e) => setLegajoInput(e.target.value)}
                  />
                </div>

                <div className={`license-filter-input-wrap${nameInput ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-search license-filter-icon" />
                  <input
                    type="text"
                    className="license-filter-input"
                    placeholder="Buscar por agente..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </div>

                <div className={`license-filter-input-wrap${filters.notice_type_id ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-tag license-filter-icon" />
                  <Dropdown
                    value={filters.notice_type_id || null}
                    options={types}
                    optionLabel="name"
                    optionValue="id"
                    onChange={(e) => {
                      const selectedType = types.find((t) => t.id === e.value);
                      const isLlegadaTarde = selectedType?.name?.toLowerCase().includes("llegada tarde");
                      updateFilters({ notice_type_id: e.value ?? "", notice_reason_id: isLlegadaTarde ? "" : filters.notice_reason_id });
                    }}
                    placeholder="Tipo"
                    showClear
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>

                {!isFilterLlegadaTarde && (
                  <div className={`license-filter-input-wrap${filters.notice_reason_id ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-info-circle license-filter-icon" />
                    <Dropdown
                      value={filters.notice_reason_id || null}
                      options={reasons}
                      optionLabel="name"
                      optionValue="id"
                      onChange={(e) => updateFilters({ notice_reason_id: e.value ?? "" })}
                      placeholder="Razón"
                      showClear
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel"
                    />
                  </div>
                )}

                <div className={`license-filter-input-wrap${filters.notice_status_id ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-flag license-filter-icon" />
                  <Dropdown
                    value={filters.notice_status_id || null}
                    options={statuses}
                    optionLabel="name"
                    optionValue="id"
                    onChange={(e) => updateFilters({ notice_status_id: e.value ?? "" })}
                    placeholder="Estado"
                    showClear
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>

                <div className={`license-filter-input-wrap${filters.date_from || filters.date_to ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-calendar license-filter-icon" />
                  <Calendar
                    value={filters.date_from
                      ? [new Date(`${filters.date_from}T00:00:00`), filters.date_to ? new Date(`${filters.date_to}T00:00:00`) : null]
                      : null}
                    onChange={(e) => {
                      const [start, end] = (e.value as (Date | null)[] | null) ?? [null, null];
                      updateFilters({ date_from: start ? formatDateForApi(start) : "", date_to: end ? formatDateForApi(end) : "" });
                    }}
                    selectionMode="range"
                    readOnlyInput
                    dateFormat="dd/mm/yy"
                    locale="es-avisos-admin"
                    showButtonBar
                    placeholder="Fecha desde - hasta"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                  />
                </div>
              </div>

              {hasFilters && (
                <button type="button" className="license-filter-clear" onClick={clearFilters}>
                  <i className="pi pi-filter-slash" /> Limpiar filtros
                </button>
              )}
            </div>

            {isLoadingAbsensceNotices && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mt-3" />}

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
                <Column
                  header="AGENTE (LEGAJO)"
                  body={(n) => {
                    const legajo = n.people?.internal?.split("/")[0]?.trim();
                    return (
                      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                        <small>{n.people?.lastname_name ?? n.cuil}</small>
                        {legajo && (
                          <span
                            className="badge rounded-pill"
                            style={{ background: "#f1f5f9", color: "#64748b", fontWeight: 600, fontSize: "0.68rem", padding: "3px 8px", whiteSpace: "nowrap" }}
                          >
                            {legajo}
                          </span>
                        )}
                      </div>
                    );
                  }}
                />
                <Column header="TIPO" body={(n) => <CategoryBadge label={n.type?.name} id={n.type?.id} list={types} />} />
                {!isFilterLlegadaTarde && (
                  <Column header="RAZÓN" body={(n) => <CategoryBadge label={n.reason?.name} id={n.reason?.id} palette={REASON_PALETTE} list={reasons} />} />
                )}
                <Column
                  header="FECHA"
                  body={(n) => {
                    const start = n.notice_date ? new Date(`${n.notice_date}T00:00:00`) : null;
                    const end = n.notice_to ? new Date(`${n.notice_to}T00:00:00`) : null;
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
                  header="ESTADO"
                  body={(n) => {
                    const label = statusLabel(n.status);
                    const color = getStatusColor(n.status?.code);
                    return (
                      <span className="badge rounded-pill" style={{ background: `${color}1a`, color, border: "none", fontWeight: 600, padding: "4px 10px" }}>
                        {label}
                      </span>
                    );
                  }}
                />
                <Column
                  header=""
                  body={(n) => (
                    <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                      {hasAttachment(n) && (
                        isDownloadingFile && downloadingId === getUltimoAdjunto(n)?.id ? (
                          <span style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#94a3b8", cursor: "not-allowed" }}>
                            <i className="pi pi-spin pi-spinner" style={{ fontSize: "0.85rem" }} />
                          </span>
                        ) : (
                          <Tooltip label="Ver último archivo subido">
                            <button type="button" onClick={() => abrirArchivo(getUltimoAdjunto(n))} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                              <i className="pi pi-eye" style={{ fontSize: "0.85rem" }} />
                            </button>
                          </Tooltip>
                        )
                      )}

                      {hasWorkflowActions(n) && (
                        <Tooltip label="Más acciones">
                          <button type="button" onClick={(e) => openMenu(e, n)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                            <i className="pi pi-ellipsis-v" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  )}
                />
              </DataTable>

              <Paginator
                className="mt-2"
                first={(currentPage - 1) * rows}
                rows={rows}
                totalRecords={totalRecords}
                rowsPerPageOptions={[10, 15, 20]}
                onPageChange={paginate}
                pageLinkSize={3}
                rightContent={
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                    {totalRecords} {totalRecords === 1 ? "aviso" : "avisos"}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menú de acciones de flujo por fila */}
      <OverlayPanel ref={menuRef} showCloseIcon={false} style={{ padding: "6px 0", minWidth: "220px" }}>
        {menuNotice && (
          <div>
            {menuNotice.status?.code === "creado" && (
              <button type="button" style={MENU_ITEM_STYLE} onClick={() => { closeMenu(); abrirModalRecibido(menuNotice); }}>
                <i className="pi pi-inbox" style={{ color: "#3b82f6" }} /> Confirmar recepción
              </button>
            )}

            {canActOnDoc(menuNotice) && (
              <>
                <button type="button" style={MENU_ITEM_STYLE} onClick={() => { closeMenu(); abrirModalAccion(menuNotice, "aprobar"); }}>
                  <i className="pi pi-check" style={{ color: "#059669" }} /> Aprobar
                </button>
                <button type="button" style={MENU_ITEM_STYLE} onClick={() => { closeMenu(); abrirModalAccion(menuNotice, "rechazar"); }}>
                  <i className="pi pi-times" style={{ color: "#dc3545" }} /> Rechazar
                </button>
                {canManageDocumentation(menuNotice) && (
                  <>
                    <button type="button" style={MENU_ITEM_STYLE} onClick={() => { closeMenu(); abrirModalAprobarDoc(menuNotice); }}>
                      <i className="pi pi-verified" style={{ color: "#059669" }} /> Aprobar documentación
                    </button>
                    <button type="button" style={MENU_ITEM_STYLE} onClick={() => { closeMenu(); abrirModalRechazarArchivo(getUltimoAdjunto(menuNotice)); }}>
                      <i className="pi pi-ban" style={{ color: "#dc3545" }} /> Rechazar documentación
                    </button>
                  </>
                )}
              </>
            )}

            {menuNotice.attachments?.length > 1 && (
              <button type="button" style={MENU_ITEM_STYLE} onClick={() => { closeMenu(); abrirModalHistorial(menuNotice.attachments); }}>
                <i className="pi pi-history" style={{ color: "#64748b" }} /> Ver historial
              </button>
            )}

            {canFinalizar(menuNotice) && (
              <button type="button" style={MENU_ITEM_STYLE} onClick={() => { closeMenu(); abrirModalFinalizar(menuNotice); }}>
                <i className="pi pi-flag-fill" style={{ color: "#475569" }} /> Finalizar
              </button>
            )}
          </div>
        )}
      </OverlayPanel>

      {/* Visor de archivo adjunto */}
      <Sidebar
        visible={!!previewFile}
        position="right"
        showCloseIcon
        onHide={closePreview}
        baseZIndex={3000}
        style={{ width: "min(560px, 92vw)" }}
        header={
          <div className="d-flex align-items-center" style={{ gap: "8px", minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: "0.93rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewNameNoExt}</span>
            {previewExt && (
              <span style={{ background: "#eff6ff", color: "#3b82f6", borderRadius: "20px", padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
                {previewExt.toUpperCase()}
              </span>
            )}
          </div>
        }
      >
        {previewFile?.type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewFile.url} alt={previewFile.name} style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }} />
        )}
        {previewFile?.type === "pdf" && (
          <iframe src={previewFile.url} title={previewFile.name} style={{ width: "100%", height: "calc(100vh - 120px)", border: "none" }} />
        )}
      </Sidebar>

      {/* Confirmar recepción */}
      <Dialog
        header="Confirmar recepción"
        visible={displayRecibidoDialog}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setDisplayRecibidoDialog(false)}
        footer={
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <button type="button" disabled={isProcessingRecibido} onClick={() => setDisplayRecibidoDialog(false)} className="btn btn-light text-muted ml-auto" style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}>
              Cancelar
            </button>
            <button type="button" disabled={isProcessingRecibido} onClick={confirmarRecibido} className="btn btn-primary d-flex align-items-center" style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}>
              <i className={isProcessingRecibido ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
              {isProcessingRecibido ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          ¿Está seguro de que desea confirmar la recepción de este aviso?
        </p>
      </Dialog>

      {/* Aprobar / rechazar */}
      <Dialog
        header={actionType === "aprobar" ? "Confirmar aprobación" : "Rechazar aviso"}
        visible={displayActionDialog}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(460px, 92vw)" }}
        onHide={() => setDisplayActionDialog(false)}
        footer={
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <button type="button" disabled={isProcessingAction} onClick={() => setDisplayActionDialog(false)} className="btn btn-light text-muted ml-auto" style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={isProcessingAction}
              onClick={confirmarAccion}
              className={`btn d-flex align-items-center ${actionType === "aprobar" ? "btn-success" : "btn-danger"}`}
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
            >
              <i className={isProcessingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
              {isProcessingAction ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151" }}>
          ¿Está seguro de que desea <strong>{actionType}</strong> este aviso?
        </p>

        {actionType === "aprobar" && noticeSeleccionado?.type?.code === "ausencia" && !hasAttachment(noticeSeleccionado) && (
          <div className="d-flex align-items-center p-3 rounded" style={{ background: "#fff8e6", border: "1px solid #ffeeba", gap: "10px" }}>
            <i className="pi pi-exclamation-triangle" style={{ color: "#b58105", fontSize: "1.3rem", flexShrink: 0 }} />
            <small style={{ color: "#856404", lineHeight: 1.3 }}>
              <strong>Atención:</strong> el agente no subió ninguna documentación aún.
            </small>
          </div>
        )}

        {actionType === "rechazar" && (
          <div className="form-group mt-3 mb-0">
            <label className="profile-field-label">Motivo de rechazo *</label>
            <textarea className="profile-input" rows={3} disabled={isProcessingAction} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Escriba aquí el motivo..." />
          </div>
        )}

        {actionType === "aprobar" && (
          <>
            <div className="alert alert-primary d-flex align-items-start p-3 mt-3 mb-3" role="alert">
              <i className="pi pi-info-circle mr-2 mt-1" style={{ fontSize: "1rem", flexShrink: 0 }} />
              <small style={{ lineHeight: 1.4 }}>
                <strong>Tené en cuenta:</strong> si aprobás el aviso sin revisar la documentación adjunta, esta quedará sin control. Recordá evaluarla por separado.
              </small>
            </div>
            <div className="form-group mb-0">
              <label className="profile-field-label">Observaciones *</label>
              <textarea className="profile-input" rows={3} disabled={isProcessingAction} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Escriba aquí la observación..." />
            </div>
          </>
        )}
      </Dialog>

      {/* Aprobar documentación */}
      <Dialog
        header="Aprobar documentación"
        visible={displayAprobarDocDialog}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setDisplayAprobarDocDialog(false)}
        footer={
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <button type="button" disabled={isProcessingAprobarDoc} onClick={() => setDisplayAprobarDocDialog(false)} className="btn btn-light text-muted ml-auto" style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}>
              Cancelar
            </button>
            <button type="button" disabled={isProcessingAprobarDoc} onClick={confirmarAprobarDoc} className="btn btn-success d-flex align-items-center" style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}>
              <i className={isProcessingAprobarDoc ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
              {isProcessingAprobarDoc ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151" }}>
          ¿Está seguro de que desea aprobar la documentación de este aviso?
        </p>
        <div className="form-group mb-0">
          <label className="profile-field-label">Observación (opcional)</label>
          <textarea className="profile-input" rows={3} disabled={isProcessingAprobarDoc} value={aprobarDocObservation} onChange={(e) => setAprobarDocObservation(e.target.value)} placeholder="Escriba aquí la observación..." />
        </div>
      </Dialog>

      {/* Rechazar documentación */}
      <Dialog
        header="Rechazar documentación"
        visible={displayRejectFileDialog}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(500px, 92vw)" }}
        onHide={() => setDisplayRejectFileDialog(false)}
        footer={
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <button type="button" disabled={isProcessingRejectFile} onClick={() => setDisplayRejectFileDialog(false)} className="btn btn-light text-muted ml-auto" style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}>
              Cancelar
            </button>
            <button type="button" disabled={!fileRejectionReason.trim() || isProcessingRejectFile} onClick={confirmarRechazoArchivo} className="btn btn-danger d-flex align-items-center" style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}>
              <i className={isProcessingRejectFile ? "pi pi-spin pi-spinner" : "pi pi-ban"} style={{ fontSize: "0.78rem" }} />
              {isProcessingRejectFile ? "Procesando..." : "Confirmar rechazo"}
            </button>
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151" }}>¿Está seguro de que desea rechazar el siguiente archivo adjunto?</p>

        {attachmentToReject && (
          <div className="d-flex justify-content-between align-items-center p-3 mb-3 rounded border">
            <div className="text-truncate mr-2">
              <i className="pi pi-file-pdf mr-2" style={{ color: "#dc3545", fontSize: "1.1rem" }} />
              <strong style={{ color: "#1e293b" }}>{attachmentToReject.name}</strong>
            </div>
            <button type="button" className="btn btn-sm btn-light text-primary text-nowrap" onClick={() => abrirArchivo(attachmentToReject)}>
              <i className="pi pi-eye" /> Ver
            </button>
          </div>
        )}

        <div className="form-group mb-0">
          <label className="profile-field-label">Motivo del rechazo *</label>
          <textarea className="profile-input" rows={3} disabled={isProcessingRejectFile} value={fileRejectionReason} onChange={(e) => setFileRejectionReason(e.target.value)} placeholder="Escriba el motivo detallado..." />
        </div>
      </Dialog>

      {/* Finalizar aviso */}
      <Dialog
        header="Finalizar aviso"
        visible={displayFinalizarDialog}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setDisplayFinalizarDialog(false)}
        footer={
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <button type="button" disabled={isProcessingFinalizar} onClick={() => setDisplayFinalizarDialog(false)} className="btn btn-light text-muted ml-auto" style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}>
              Cancelar
            </button>
            <button type="button" disabled={isProcessingFinalizar} onClick={confirmarFinalizar} className="btn btn-primary d-flex align-items-center" style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}>
              <i className={isProcessingFinalizar ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
              {isProcessingFinalizar ? "Finalizando..." : "Confirmar"}
            </button>
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          ¿Está seguro de que desea finalizar este aviso?
        </p>
      </Dialog>

      {/* Historial de archivos adjuntos */}
      <Dialog
        header="Historial de archivos adjuntos"
        visible={displayHistoryDialog}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ width: "min(680px, 95vw)" }}
        onHide={() => setDisplayHistoryDialog(false)}
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {historyAttachments.map((file, i) => (
            <div key={file.id} className="mb-3 p-3 rounded border" style={{ background: "#fff", position: "relative", paddingLeft: "18px" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", borderRadius: "4px 0 0 4px", background: i === 0 ? "#059669" : "#94a3b8" }} />
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 font-weight-bold" style={{ color: "#1e293b" }}>
                  <i className="pi pi-file-pdf mr-2" style={{ color: "#dc3545" }} />
                  {file.name}
                  {i === 0 && (
                    <span className="badge badge-success ml-2 px-2 py-1">Último subido</span>
                  )}
                </h6>
                <small className="text-muted d-flex align-items-center">
                  <i className="pi pi-clock mr-1" /> {formatDateTime(file.created_at)}
                </small>
              </div>

              <button type="button" className="btn btn-sm btn-light text-primary border mb-2" onClick={() => abrirArchivo(file)}>
                <i className="pi pi-eye" /> Ver documento
              </button>

              {file.rejection_reasons?.length > 0 && (
                <div className="p-3 rounded mt-2" style={{ background: "rgba(220,53,69,0.06)" }}>
                  <small className="font-weight-bold text-danger d-block mb-2">
                    <i className="pi pi-exclamation-circle" /> Motivos de rechazo:
                  </small>
                  <ul className="mb-0 pl-3 text-danger" style={{ fontSize: "0.85rem" }}>
                    {file.rejection_reasons.map((r: any, ri: number) => (
                      <li key={ri} className="mb-1">
                        {r.reason} <span className="opacity-75">({formatDateTime(r.created_at)})</span>
                      </li>
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
