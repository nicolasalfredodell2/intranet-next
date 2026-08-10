"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { ProgressBar } from "primereact/progressbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Clock, Pencil } from "lucide-react";
import { loadExitOrdersAdminByUser, updateExitOrderAdmin } from "@/lib/services/exits.service";
import ExitOrdersAuditsDialog from "./ExitOrdersAuditsDialog";
import ExitOrdersTimeStampsDialog from "./ExitOrdersTimeStampsDialog";

addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Quitar fecha",
});

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

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

const STATUS_OPTIONS = [
  { label: "Pendiente de aprobación", value: "Pending" },
  { label: "En espera", value: "Waiting" },
  { label: "Finalizado", value: "Done" },
  { label: "Cancelado", value: "Cancel" },
];

const TYPE_OPTIONS = [
  { label: "Sin orden de salida", value: "Unexpected" },
  { label: "Particular", value: "Individuals" },
  { label: "Oficial", value: "Officials" },
  { label: "Asamblea", value: "Guild_Meeting_Attendance" },
  { label: "Licencia por estudio/capacitación", value: "Education" },
  { label: "Salud o cuidado familiar", value: "Health" },
  { label: "Lactancia - Maternidad", value: "Maternity_Breastfeeding" },
  { label: "Otras justificaciones", value: "Others_Justify" },
];

const TYPE_LABELS: Record<string, string> = {
  Unexpected: "Sin orden de salida",
  Individuals: "Particular",
  Officials: "Oficial",
  Guild_Meeting_Attendance: "Asamblea",
  Education: "Licencia por estudio/capacitación",
  Health: "Salud o cuidado familiar",
  Maternity_Breastfeeding: "Lactancia - Maternidad",
  Others_Justify: "Otras justificaciones",
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  Waiting: { label: "Esperando llegada", className: "warning" },
  Cancel: { label: "Cancelado", className: "danger" },
  Done: { label: "Finalizado", className: "success" },
  Pending: { label: "Pendiente aprobación", className: "muted" },
};

const STATUS_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  warning: { bg: "rgba(255,193,7,0.12)", color: "#b45309" },
  danger: { bg: "rgba(220,53,69,0.10)", color: "#dc3545" },
  success: { bg: "rgba(5,150,105,0.10)", color: "#059669" },
  muted: { bg: "rgba(100,116,139,0.10)", color: "#64748b" },
};

const EMPTY_FORM = { arrival_hour: "", departure_hour: "", status: "", type: "" };

function formatMinutes(minutes: number | null | undefined): string {
  const value = Number(minutes) || 0;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${h}:${m >= 0 && m < 10 ? `0${m}` : m} Hs.`;
}

function formatDate(dateTimeStr: string): string {
  const datePart = dateTimeStr.split(/[T ]/)[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

function formatTime(dateTimeStr: string): string {
  return dateTimeStr.split(/[T ]/)[1]?.slice(0, 8) ?? "";
}

function timeToMinutes(time: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function parseValues(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value as Record<string, any>;
}

function splitAuditsByNewValues(audits: any[]): any[] {
  return audits.slice(1).flatMap((obj: any) => {
    const newValues = parseValues(obj.new_values);
    return Object.keys(newValues)
      .filter((key) => ["type", "departure_hour", "arrival_hour", "status"].includes(key))
      .map((key) => ({ ...obj, new_values: { [key]: newValues[key] } }));
  });
}

interface Props {
  visible: boolean;
  onHide: () => void;
  user: any;
  year: number;
  month: number;
}

export default function ExitOrdersDetailsDialog({ visible, onHide, user, year, month }: Props) {
  const toast = useRef<Toast>(null);

  const [detailsUser, setDetailsUser] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [editingExit, setEditingExit] = useState<any>(null);
  const [formEdit, setFormEdit] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [auditsOpen, setAuditsOpen] = useState<any | null>(null);
  const [timeStampsOpen, setTimeStampsOpen] = useState<any>(null);

  useEffect(() => {
    if (!visible || !user) return;
    loadUserDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user, year, month, statusFilter, typeFilter]);

  async function loadUserDetail() {
    setIsLoading(true);
    try {
      const monthStr = `${year}-${String(month).length === 1 ? `0${month}` : month}`;
      const resp = await loadExitOrdersAdminByUser(
        { limit: 50, page: 1, status: statusFilter, type: typeFilter, user_lastname: "" },
        { user_id: user.id, month_exit_order: monthStr }
      );

      if (resp.message) {
        setDetailsUser([]);
        return;
      }

      const data: any[] = resp.data ?? [];

      let sum = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        sum += Number(data[i].difference_minutes) || 0;
        data[i].sumDifferenceMinutes = formatMinutes(sum);
      }

      const processed = data.map((item: any) => {
        const statusMeta = STATUS_META[item.status] ?? { label: item.status, className: "muted" };
        let audits = item.audits ?? [];
        if (audits.length !== 0) {
          audits = [audits[0], ...splitAuditsByNewValues(audits)].reverse();
        }

        let isArrivalHourModificateForUser = false;
        let isDepartureHourModificateForUser = false;
        audits.forEach((audit: any) => {
          const newValues = parseValues(audit.new_values);
          if (audit.user_name !== "Sistema" && newValues.arrival_hour) isArrivalHourModificateForUser = true;
          if (audit.user_name !== "Sistema" && newValues.departure_hour) isDepartureHourModificateForUser = true;
        });

        return {
          ...item,
          statusEnglish: item.status,
          status: statusMeta.label,
          class: statusMeta.className,
          typeEnglish: item.type,
          type: TYPE_LABELS[item.type] ?? item.type,
          difference_minutes_in_hs: item.difference_minutes ? formatMinutes(item.difference_minutes) : "0 Hs.",
          audits,
          isArrivalHourModificateForUser,
          isDepartureHourModificateForUser,
        };
      });

      setDetailsUser(processed);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar detalles", detail: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  function openEditDialog(detail: any) {
    setEditingExit(detail);
    setFormEdit({
      arrival_hour: detail.arrival_hour ? formatTime(detail.arrival_hour) : "",
      departure_hour: detail.departure_hour ? formatTime(detail.departure_hour) : "",
      type: detail.typeEnglish,
      status: detail.statusEnglish,
    });
  }

  function closeEditDialog() {
    setEditingExit(null);
    setFormEdit(EMPTY_FORM);
  }

  const canUpdate = useMemo(() => {
    if (!editingExit) return false;
    const arrivalFromSelection = editingExit.arrival_hour ? formatTime(editingExit.arrival_hour) : "00:00:00";
    const departureFromSelection = editingExit.departure_hour ? formatTime(editingExit.departure_hour) : "00:00:00";
    return !(
      formEdit.type === editingExit.typeEnglish &&
      formEdit.status === editingExit.statusEnglish &&
      formEdit.arrival_hour === arrivalFromSelection &&
      formEdit.departure_hour === departureFromSelection
    );
  }, [formEdit, editingExit]);

  const availableDates = useMemo(() => {
    const list = new Set<string>();
    detailsUser.forEach((detail) => {
      if (detail.departure_hour) list.add(detail.departure_hour.split(/[T ]/)[0]);
    });
    return [...list];
  }, [detailsUser]);

  const availableDateObjects = useMemo(() => availableDates.map((d) => new Date(`${d}T00:00:00`)), [availableDates]);

  const filterMonthLabel = useMemo(() => {
    if (!year || !month) return "";
    const label = new Date(year, month - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [year, month]);

  const filteredDetails = useMemo(() => {
    if (!dateFilter) return detailsUser;
    return detailsUser.filter((detail) => detail.departure_hour && detail.departure_hour.split(/[T ]/)[0] === dateFilter);
  }, [detailsUser, dateFilter]);

  function clearFilters() {
    setStatusFilter("");
    setTypeFilter("");
    setDateFilter("");
  }

  async function handleUpdate() {
    if (isSaving || !canUpdate || !editingExit) return;

    if (formEdit.arrival_hour && (timeToMinutes(formEdit.departure_hour) ?? 0) >= (timeToMinutes(formEdit.arrival_hour) ?? 0)) {
      toast.current?.show({ severity: "info", summary: "La hora de salida no puede ser mayor a la hora de llegada" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        status: formEdit.status,
        type: formEdit.type,
        arrival_hour: editingExit.arrival_hour ? `${editingExit.arrival_hour.split(/[T ]/)[0]} ${formEdit.arrival_hour}` : null,
        departure_hour: editingExit.departure_hour ? `${editingExit.departure_hour.split(/[T ]/)[0]} ${formEdit.departure_hour}` : null,
      };

      await updateExitOrderAdmin([], payload, String(editingExit.id));

      toast.current?.show({ severity: "success", summary: "Orden de salida actualizada" });
      closeEditDialog();
      loadUserDetail();
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo modificar la orden de salida", detail: "Inténtelo más tarde" });
    } finally {
      setIsSaving(false);
    }
  }

  function handleHide() {
    closeEditDialog();
    setAuditsOpen(null);
    setTimeStampsOpen(null);
    clearFilters();
    onHide();
  }

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Clock size={18} color="#eab308" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>
          {isLoading ? "Cargando detalles de" : "Detalles de"} {user?.lastname_name}
        </p>
        <span className="license-dialog-year-badge">Legajo {user?.file}</span>
      </div>
    </div>
  );

  const editDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Pencil size={18} color="#3b82f6" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Editá el estado, tipo y horarios del registro</small>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <Dialog header={dialogHeader} visible={visible} draggable={false} modal dismissableMask onHide={handleHide} style={{ width: "95vw" }}>
        <div className="license-filter-bar mb-3">
          <div className="license-filter-bar-inputs">
            <div className={`license-filter-input-wrap${dateFilter ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-calendar license-filter-icon" />
              <small style={{ color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap", marginRight: "6px" }}>{filterMonthLabel}</small>
              <Calendar
                value={dateFilter ? new Date(`${dateFilter}T00:00:00`) : null}
                onChange={(e) => {
                  const d = e.value as Date | null;
                  setDateFilter(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
                }}
                dateFormat="dd/mm/yy"
                locale="es"
                showOtherMonths={false}
                minDate={year && month ? new Date(year, month - 1, 1) : undefined}
                maxDate={year && month ? new Date(year, month - 1, new Date(year, month, 0).getDate()) : undefined}
                enabledDates={availableDateObjects}
                dateTemplate={(date) => {
                  const key = `${date.year}-${String(date.month + 1).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                  const hasExit = availableDates.includes(key);
                  return (
                    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: hasExit ? "#0ea5e9" : undefined, fontWeight: hasExit ? 700 : undefined }}>
                      {date.day}
                      {hasExit && (
                        <span style={{ position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: "50%", background: "#0ea5e9" }} />
                      )}
                    </span>
                  );
                }}
                readOnlyInput
                placeholder="Día"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel license-filter-calendar-panel overtimes-detail-date-panel"
                pt={{
                  previousButton: { style: { visibility: "hidden", pointerEvents: "none" } },
                  nextButton: { style: { visibility: "hidden", pointerEvents: "none" } },
                  monthTitle: { style: { pointerEvents: "none", cursor: "default" } },
                  yearTitle: { style: { pointerEvents: "none", cursor: "default" } },
                }}
              />
            </div>
            <div className={`license-filter-input-wrap${statusFilter ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-flag license-filter-icon" />
              <Dropdown
                value={statusFilter || null}
                options={STATUS_OPTIONS}
                onChange={(e) => setStatusFilter(e.value ?? "")}
                placeholder="Estado"
                showClear
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
            <div className={`license-filter-input-wrap${typeFilter ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-tag license-filter-icon" />
              <Dropdown
                value={typeFilter || null}
                options={TYPE_OPTIONS}
                onChange={(e) => setTypeFilter(e.value ?? "")}
                placeholder="Tipo"
                showClear
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
          {(dateFilter || statusFilter || typeFilter) && (
            <button type="button" className="license-filter-clear" onClick={clearFilters}>
              <i className="pi pi-filter-slash" /> Limpiar filtros
            </button>
          )}
        </div>

        <DataTable
          value={filteredDetails}
          loading={isLoading}
          scrollable
          scrollHeight="400px"
          className="p-datatable-sm license-table"
          emptyMessage={
            <div className="license-empty">
              <i className="pi pi-inbox" />
              <p>No hay órdenes de salidas para los filtros aplicados</p>
            </div>
          }
        >
          <Column
            header="ESTADO"
            body={(detail) => (
              <span
                className="badge rounded-pill"
                style={{
                  background: (STATUS_BADGE_COLORS[detail.class] ?? STATUS_BADGE_COLORS.muted).bg,
                  color: (STATUS_BADGE_COLORS[detail.class] ?? STATUS_BADGE_COLORS.muted).color,
                  border: "none",
                  fontWeight: 600,
                  padding: "4px 10px",
                }}
              >
                {detail.status}
              </span>
            )}
          />

          <Column header="TIPO" body={(detail) => <small>{detail.type}</small>} />

          <Column header="FECHA" body={(detail) => detail.departure_hour && <small>{formatDate(detail.departure_hour)}</small>} />

          <Column
            header="EGRESO"
            body={(detail) => {
              if (!detail.departure_hour) return <small>--</small>;
              if (detail.departure_hour_fixed == 1 && detail.isDepartureHourModificateForUser) {
                return (
                  <small>
                    {formatTime(detail.departure_hour)} <span className="text-info">*</span>
                  </small>
                );
              }
              if (detail.departure_hour_fixed == 1) {
                return (
                  <span className="badge rounded-pill" style={{ background: STATUS_BADGE_COLORS.warning.bg, color: STATUS_BADGE_COLORS.warning.color, border: "none", fontWeight: 600, padding: "4px 10px" }}>
                    {formatTime(detail.departure_hour)}
                  </span>
                );
              }
              return <small>{formatTime(detail.departure_hour)}</small>;
            }}
          />

          <Column
            header="INGRESO"
            body={(detail) => {
              if (!detail.arrival_hour) return <small>--</small>;
              if (detail.arrival_hour_fixed == 1 && detail.isArrivalHourModificateForUser) {
                return (
                  <small>
                    {formatTime(detail.arrival_hour)} <span className="text-info">*</span>
                  </small>
                );
              }
              if (detail.arrival_hour_fixed == 1) {
                return (
                  <span className="badge rounded-pill" style={{ background: STATUS_BADGE_COLORS.warning.bg, color: STATUS_BADGE_COLORS.warning.color, border: "none", fontWeight: 600, padding: "4px 10px" }}>
                    {formatTime(detail.arrival_hour)}
                  </span>
                );
              }
              return <small>{formatTime(detail.arrival_hour)}</small>;
            }}
          />

          <Column header="DIFERENCIA HORARIA" body={(detail) => <small className="pointer p-1 status-muted">{detail.difference_minutes_in_hs}</small>} />

          <Column header="SUMA TOTAL" body={(detail) => <small>{detail.sumDifferenceMinutes}</small>} />

          <Column
            header="FICHADAS DEL DÍA"
            body={(detail) => (
              <Tooltip label="Ver detalle">
                <button type="button" onClick={() => setTimeStampsOpen(detail)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                  <i className="pi pi-external-link" style={{ fontSize: "0.85rem" }} />
                </button>
              </Tooltip>
            )}
          />

          <Column
            header="AUDITORÍA"
            body={(detail) =>
              detail.audits && detail.audits.length > 0 ? (
                <Tooltip label="Ver detalle">
                  <button type="button" onClick={() => setAuditsOpen(detail)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                    <i className="pi pi-external-link" style={{ fontSize: "0.85rem" }} />
                  </button>
                </Tooltip>
              ) : (
                <small className="text-muted">Sin detalle</small>
              )
            }
          />

          <Column
            header=""
            body={(detail) => (
              <Tooltip label="Modificar">
                <button type="button" onClick={() => openEditDialog(detail)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
                  <Pencil size={14} />
                </button>
              </Tooltip>
            )}
          />
        </DataTable>
      </Dialog>

      <Dialog
        header={editDialogHeader}
        visible={!!editingExit}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(560px, 92vw)" }}
        onHide={closeEditDialog}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={isSaving || !canUpdate}
                onClick={handleUpdate}
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={isSaving ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
              <button
                disabled={isSaving}
                onClick={() => setFormEdit(EMPTY_FORM)}
                type="button"
                className="btn btn-light text-muted"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Limpiar
              </button>
              <button
                disabled={isSaving}
                onClick={closeEditDialog}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {isSaving && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <div className="row">
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Estado</label>
            <div className="license-filter-input-wrap">
              <i className="pi pi-flag license-filter-icon" />
              <Dropdown
                value={formEdit.status}
                options={STATUS_OPTIONS}
                onChange={(e) => setFormEdit((p) => ({ ...p, status: e.value }))}
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Tipo</label>
            <div className="license-filter-input-wrap">
              <i className="pi pi-tag license-filter-icon" />
              <Dropdown
                value={formEdit.type}
                options={TYPE_OPTIONS}
                onChange={(e) => setFormEdit((p) => ({ ...p, type: e.value }))}
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Egreso</label>
            <input
              className="form-control form-control-sm"
              type="time"
              step={1}
              value={formEdit.departure_hour}
              onChange={(e) => setFormEdit((p) => ({ ...p, departure_hour: e.target.value }))}
            />
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Ingreso</label>
            <input
              className="form-control form-control-sm"
              type="time"
              step={1}
              value={formEdit.arrival_hour}
              onChange={(e) => setFormEdit((p) => ({ ...p, arrival_hour: e.target.value }))}
            />
          </div>
        </div>
      </Dialog>

      <ExitOrdersAuditsDialog visible={!!auditsOpen} onHide={() => setAuditsOpen(null)} audits={auditsOpen?.audits ?? []} date={auditsOpen?.departure_hour} agentName={user?.lastname_name} />
      <ExitOrdersTimeStampsDialog visible={!!timeStampsOpen} onHide={() => setTimeStampsOpen(null)} exitOrder={timeStampsOpen} />
    </>
  );
}
