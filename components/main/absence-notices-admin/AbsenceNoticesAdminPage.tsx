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
import { addLocale } from "primereact/api";
import {
  getNoticesConfig,
  getAllNoticesAdmin,
  modificateNoticeAdmin,
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

interface NoticeForm {
  type: string;
  reason: string;
  description: string;
}

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

function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDateForApi(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
};

function getStatusColor(label: string): string {
  const key = String(label ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "");
  return STATUS_BADGE_COLORS[key] ?? "#94a3b8";
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

export default function AbsenceNoticesAdminPage() {
  const toast = useRef<Toast>(null);

  const [types, setTypes] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);

  const [notices, setNotices] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingAbsensceNotices, setIsLoadingAbsensceNotices] = useState(false);
  const [isLoadingCreateAbsensceNotices, setIsLoadingCreateAbsensceNotices] = useState(false);

  const [absenceNoticeParaModificar, setAbsenceNoticeParaModificar] = useState<any>(null);
  const [form, setForm] = useState<NoticeForm>({ type: "", reason: "", description: "" });
  const [touched, setTouched] = useState(false);

  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS);
  const [legajoInput, setLegajoInput] = useState("");
  const [nameInput, setNameInput] = useState("");

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
      setRows(resp.meta?.per_page ?? perPage);
      setCurrentPage(resp.meta?.current_page ?? page);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setIsLoadingAbsensceNotices(false);
    }
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

  function llenarFormulario(notice: any) {
    setAbsenceNoticeParaModificar(notice);
    setForm({
      type: notice.type?.id ?? "",
      reason: notice.reason?.id ?? "",
      description: notice.description ?? "",
    });
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiar() {
    setAbsenceNoticeParaModificar(null);
    setForm({ type: "", reason: "", description: "" });
    setTouched(false);
  }

  // Migración de create() del Angular original: en realidad modifica el aviso seleccionado.
  async function modificar(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.type || !form.description || !absenceNoticeParaModificar) return;
    setIsLoadingCreateAbsensceNotices(true);
    try {
      const payload: any = { notice_type_id: form.type, description: form.description };
      if (form.reason) payload.notice_reason_id = form.reason;
      const resp = await modificateNoticeAdmin(payload, absenceNoticeParaModificar.id);
      setNotices((prev) => [resp, ...prev.filter((n) => n.id !== absenceNoticeParaModificar.id)]);
      toast.current?.show({ severity: "success", summary: "Aviso modificado" });
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setIsLoadingCreateAbsensceNotices(false);
    }
  }

  const statusLabel = (s: any) => {
    const found = statuses.find((st) => st.id === (s?.id ?? s));
    return found?.name ?? s?.name ?? "";
  };

  const isFilterLlegadaTarde = types.find((t) => t.id == filters.notice_type_id)?.name?.toLowerCase().includes("llegada tarde");
  const hasFilters = Object.values(filters).some((v) => v);

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card profile-card--admin">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-bell" style={{ color: "#eab308", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Avisos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Administración de avisos del personal</small>
            </div>
            <span style={{ background: "rgba(234,179,8,0.14)", color: "#a16207", borderRadius: "20px", padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              Administración
            </span>
          </div>
        </div>

        {/* Modificar aviso */}
        {absenceNoticeParaModificar && (
          <div className="card profile-card mt-4 fadeIn animated">
            <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar aviso</h5>
                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{absenceNoticeParaModificar.people?.lastname_name ?? absenceNoticeParaModificar.cuil}</small>
              </div>
              <button type="button" onClick={limpiar} className="btn btn-light text-muted" style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}>
                Cancelar
              </button>
            </div>
            <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <form onSubmit={modificar} noValidate>
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
                        onChange={(e) => setForm((p) => ({ ...p, type: e.value ?? "" }))}
                        placeholder="Seleccioná un tipo"
                        className="license-filter-dropdown"
                        panelClassName="license-filter-dropdown-panel"
                        emptyMessage="Sin tipos"
                      />
                    </div>
                    {touched && !form.type && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                  </div>

                  <div className="col-12 col-md-4 mb-3">
                    <label className="profile-field-label">Razón</label>
                    <div className={`license-filter-input-wrap${form.reason ? " license-filter-input-wrap--active" : ""}`}>
                      <i className="pi pi-info-circle license-filter-icon" />
                      <Dropdown
                        value={form.reason || null}
                        options={reasons}
                        optionLabel="name"
                        optionValue="id"
                        onChange={(e) => setForm((p) => ({ ...p, reason: e.value ?? "" }))}
                        placeholder="Seleccioná una razón"
                        showClear
                        className="license-filter-dropdown"
                        panelClassName="license-filter-dropdown-panel"
                        emptyMessage="Sin razones"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 mb-3">
                    <label className="profile-field-label">Descripción *</label>
                    <textarea className="profile-input" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                    {touched && !form.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                  </div>
                </div>

                <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                  <button
                    disabled={isLoadingCreateAbsensceNotices}
                    type="submit"
                    className="btn btn-primary d-flex align-items-center"
                    style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                  >
                    <i className={isLoadingCreateAbsensceNotices ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                    {isLoadingCreateAbsensceNotices ? "Modificando..." : "Modificar aviso"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Listado */}
        <div className="card profile-card license-main-card mt-4 fadeIn animated">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#e8edff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-list" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Listado de avisos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Avisos generados por todo el personal</small>
            </div>
            <button
              type="button"
              disabled={isLoadingAbsensceNotices}
              onClick={() => loadAbsenceNotices(currentPage, rows, filters)}
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
                <Column header="AGENTE" body={(n) => <small>{n.people?.lastname_name ?? n.cuil}</small>} />
                <Column header="TIPO" body={(n) => <CategoryBadge label={n.type?.name} id={n.type?.id} list={types} />} />
                {!isFilterLlegadaTarde && (
                  <Column header="RAZÓN" body={(n) => <CategoryBadge label={n.reason?.name} id={n.reason?.id} palette={REASON_PALETTE} list={reasons} />} />
                )}
                <Column
                  header="FECHA"
                  body={(n) => <small>{formatDateDisplay(n.notice_date)}{n.notice_to ? ` - ${formatDateDisplay(n.notice_to)}` : ""}</small>}
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
                    const color = getStatusColor(label);
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
                    <Tooltip label="Modificar">
                      <button
                        type="button"
                        onClick={() => llenarFormulario(n)}
                        style={{ background: "none", border: "1.5px solid #dbeafe", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#3b82f6" }}
                      >
                        <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
                      </button>
                    </Tooltip>
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
    </>
  );
}
