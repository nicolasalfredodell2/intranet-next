"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Clock, Pencil, Save } from "lucide-react";
import { loadOvertimesByUser, updateOvertime } from "@/lib/services/overtimes.service";
import OvertimesAuditsDialog from "./OvertimesAuditsDialog";
import OvertimesTimeStampsDialog from "./OvertimesTimeStampsDialog";

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

const SHIFT_OPTIONS = [
  { label: "Vespertino", value: "VESPERTINO" },
  { label: "Matutino", value: "MATUTINO" },
];

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

const EMPTY_FORM = { end_time: "", start_time: "", shift: "", status: "" };

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

function splitAuditsByNewValues(audits: any[]): any[] {
  return audits.slice(1).flatMap((obj: any) =>
    Object.keys(obj.new_values ?? {})
      .filter((key) => ["shift", "start_time", "end_time", "status"].includes(key))
      .map((key) => ({ ...obj, new_values: { [key]: obj.new_values[key] } }))
  );
}

interface Props {
  visible: boolean;
  onHide: () => void;
  user: any;
  year: number;
  month: number;
  onChangeTotalSum: (sum: number) => void;
}

export default function OvertimesDetailsDialog({ visible, onHide, user, year, month, onChangeTotalSum }: Props) {
  const toast = useRef<Toast>(null);

  const [detailsUser, setDetailsUser] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedForEdit, setSelectedForEdit] = useState<any>(null);
  const [formEdit, setFormEdit] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [auditsOpen, setAuditsOpen] = useState<any[] | null>(null);
  const [timeStampsOpen, setTimeStampsOpen] = useState<any>(null);

  useEffect(() => {
    if (!visible || !user) return;
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user, year, month, statusFilter, shiftFilter]);

  async function loadDetails() {
    setIsLoading(true);
    try {
      const monthStr = `${year}-${String(month).length === 1 ? `0${month}` : month}`;
      const resp = await loadOvertimesByUser(
        { shift: shiftFilter, status: statusFilter, user_lastname: "" },
        { user_id: user.id, month: monthStr }
      );

      if (resp.message) {
        setDetailsUser([]);
        onChangeTotalSum(0);
        return;
      }

      const data: any[] = resp.data ?? [];

      let sum = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        sum += Number(data[i].difference_minutes) || 0;
        data[i].sumDifferenceMinutes = formatMinutes(sum);
      }

      const processed = data.map((item: any) => {
        const meta = STATUS_META[item.status] ?? { label: item.status, className: "muted" };
        let audits = item.audits ?? [];
        if (audits.length !== 0) {
          audits = [audits[0], ...splitAuditsByNewValues(audits)].reverse();
        }
        return {
          ...item,
          statusEnglish: item.status,
          status: meta.label,
          class: meta.className,
          difference_minutes_in_hs: item.difference_minutes ? formatMinutes(item.difference_minutes) : "0 Hs.",
          audits,
        };
      });

      setDetailsUser(processed);
      onChangeTotalSum(sum);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar detalles", detail: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  function selectOvertime(detail: any) {
    if (!selectedForEdit || selectedForEdit.id !== detail.id) {
      setSelectedForEdit(detail);
      setFormEdit({
        end_time: detail.end_time ? formatTime(detail.end_time) : "",
        start_time: detail.start_time ? formatTime(detail.start_time) : "",
        shift: detail.shift,
        status: detail.statusEnglish,
      });
      return;
    }
    setSelectedForEdit(null);
    setFormEdit(EMPTY_FORM);
  }

  const canUpdate = useMemo(() => {
    if (!selectedForEdit) return false;
    const startTimeFromSelection = selectedForEdit.start_time ? formatTime(selectedForEdit.start_time) : "00:00:00";
    const endTimeFromSelection = selectedForEdit.end_time ? formatTime(selectedForEdit.end_time) : "00:00:00";
    return !(
      formEdit.shift === selectedForEdit.shift &&
      formEdit.status === selectedForEdit.statusEnglish &&
      formEdit.end_time === endTimeFromSelection &&
      formEdit.start_time === startTimeFromSelection
    );
  }, [formEdit, selectedForEdit]);

  const availableDates = useMemo(() => {
    const list = new Set<string>();
    detailsUser.forEach((detail) => {
      if (detail.start_time) list.add(detail.start_time.split(/[T ]/)[0]);
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
    return detailsUser.filter((detail) => detail.start_time && detail.start_time.split(/[T ]/)[0] === dateFilter);
  }, [detailsUser, dateFilter]);

  function clearFilters() {
    setStatusFilter("");
    setShiftFilter("");
    setDateFilter("");
  }

  async function handleUpdate() {
    if (isSaving || !canUpdate || !selectedForEdit) return;

    if (formEdit.end_time && (timeToMinutes(formEdit.start_time) ?? 0) > (timeToMinutes(formEdit.end_time) ?? 0)) {
      toast.current?.show({ severity: "info", summary: "La hora de Ingreso debe ser menor a la hora de Egreso" });
      return;
    }

    setIsSaving(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const payload = {
        status: formEdit.status,
        shift: formEdit.shift,
        end_time:
          selectedForEdit.end_time || formEdit.end_time
            ? `${selectedForEdit.end_time ? selectedForEdit.start_time.split(/[T ]/)[0] : new Date(selectedForEdit.start_time).toISOString().split("T")[0]} ${formEdit.end_time}`
            : null,
        start_time:
          selectedForEdit.start_time || formEdit.start_time
            ? `${selectedForEdit.start_time ? selectedForEdit.start_time.split(/[T ]/)[0] : todayStr} ${formEdit.start_time}`
            : null,
      };

      await updateOvertime(payload, selectedForEdit.id, user.id);

      toast.current?.show({ severity: "success", summary: "Overtime actualizada" });
      setSelectedForEdit(null);
      setFormEdit(EMPTY_FORM);
      loadDetails();
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo realizar la modificación", detail: "Inténtelo más tarde" });
    } finally {
      setIsSaving(false);
    }
  }

  function handleHide() {
    setSelectedForEdit(null);
    setFormEdit(EMPTY_FORM);
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
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Legajo: {user?.file}</small>
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
                  const hasOvertime = availableDates.includes(key);
                  return (
                    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: hasOvertime ? "#0ea5e9" : undefined, fontWeight: hasOvertime ? 700 : undefined }}>
                      {date.day}
                      {hasOvertime && (
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
            <div className={`license-filter-input-wrap${shiftFilter ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-sun license-filter-icon" />
              <Dropdown
                value={shiftFilter || null}
                options={SHIFT_OPTIONS}
                onChange={(e) => setShiftFilter(e.value ?? "")}
                placeholder="Tipo"
                showClear
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
          {(dateFilter || statusFilter || shiftFilter) && (
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
              <p>No hay overtimes para los filtros aplicados</p>
            </div>
          }
        >
          <Column
            header="ESTADO"
            body={(detail) =>
              selectedForEdit?.id === detail.id ? (
                <Dropdown
                  value={formEdit.status}
                  options={STATUS_OPTIONS}
                  onChange={(e) => setFormEdit((p) => ({ ...p, status: e.value }))}
                  className="fadeIn animated"
                  style={{ fontSize: "0.8rem", minWidth: "180px" }}
                />
              ) : (
                <span onClick={() => selectOvertime(detail)} className="fadeIn animated pointer">
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
                </span>
              )
            }
          />

          <Column
            header="TIPO"
            body={(detail) =>
              selectedForEdit?.id === detail.id ? (
                <Dropdown
                  value={formEdit.shift}
                  options={SHIFT_OPTIONS}
                  onChange={(e) => setFormEdit((p) => ({ ...p, shift: e.value }))}
                  className="fadeIn animated"
                  style={{ fontSize: "0.8rem", minWidth: "150px" }}
                />
              ) : (
                <small onClick={() => selectOvertime(detail)} className="fadeIn animated pointer">{detail.shift}</small>
              )
            }
          />

          <Column header="FECHA" body={(detail) => detail.start_time && <small className="fadeIn animated">{formatDate(detail.start_time)}</small>} />

          <Column
            header="INGRESO"
            body={(detail) =>
              selectedForEdit?.id === detail.id ? (
                <input
                  className="form-control form-control-sm fadeIn animated"
                  type="time"
                  step={1}
                  value={formEdit.start_time}
                  onChange={(e) => setFormEdit((p) => ({ ...p, start_time: e.target.value }))}
                />
              ) : (
                <div onClick={() => selectOvertime(detail)}>
                  {detail.start_time ? (
                    detail.start_time_fixed == 1 ? (
                      <span
                        className="badge rounded-pill fadeIn animated"
                        style={{ background: STATUS_BADGE_COLORS.warning.bg, color: STATUS_BADGE_COLORS.warning.color, border: "none", fontWeight: 600, padding: "4px 10px" }}
                      >
                        {formatTime(detail.start_time)}
                      </span>
                    ) : (
                      <small className="fadeIn animated">{formatTime(detail.start_time)}</small>
                    )
                  ) : (
                    <small className="fadeIn animated">--</small>
                  )}
                </div>
              )
            }
          />

          <Column
            header="EGRESO"
            body={(detail) =>
              selectedForEdit?.id === detail.id ? (
                <input
                  className="form-control form-control-sm fadeIn animated"
                  type="time"
                  step={1}
                  value={formEdit.end_time}
                  onChange={(e) => setFormEdit((p) => ({ ...p, end_time: e.target.value }))}
                />
              ) : (
                <div onClick={() => selectOvertime(detail)}>
                  {detail.end_time ? (
                    detail.end_time_fixed == 1 ? (
                      <span
                        className="badge rounded-pill fadeIn animated"
                        style={{ background: STATUS_BADGE_COLORS.warning.bg, color: STATUS_BADGE_COLORS.warning.color, border: "none", fontWeight: 600, padding: "4px 10px" }}
                      >
                        {formatTime(detail.end_time)}
                      </span>
                    ) : (
                      <small className="fadeIn animated">{formatTime(detail.end_time)}</small>
                    )
                  ) : (
                    <small className="fadeIn animated">--</small>
                  )}
                </div>
              )
            }
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
                  <button type="button" onClick={() => setAuditsOpen(detail.audits)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
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
              <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                <Pencil size={14} className="pointer text-info" onClick={() => selectOvertime(detail)} />
                {selectedForEdit?.id === detail.id &&
                  (isSaving ? (
                    <i className="pi pi-spin pi-spinner text-info fadeIn animated" />
                  ) : (
                    <Save size={14} className={`fadeIn animated pointer ${canUpdate ? "text-info" : "text-muted"}`} onClick={handleUpdate} />
                  ))}
              </div>
            )}
          />
        </DataTable>
      </Dialog>

      <OvertimesAuditsDialog visible={!!auditsOpen} onHide={() => setAuditsOpen(null)} audits={auditsOpen ?? []} />
      <OvertimesTimeStampsDialog visible={!!timeStampsOpen} onHide={() => setTimeStampsOpen(null)} overtime={timeStampsOpen} />
    </>
  );
}
