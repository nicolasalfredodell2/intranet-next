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
import { Clock } from "lucide-react";
import { changeJustified, loadDetailReportForIncomeAndExpenses } from "@/lib/services/expenses-income-surplus.service";

addLocale("es-expenses-income-surplus", {
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

const JUSTIFIED_OPTIONS = [
  { label: "Sí", value: "1" },
  { label: "No", value: "0" },
];

const STATUS_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  success: { bg: "rgba(5,150,105,0.10)", color: "#059669" },
  danger: { bg: "rgba(220,53,69,0.10)", color: "#dc3545" },
};

function formatDate(dateStr: string): string {
  const datePart = dateStr.split(/[T ]/)[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

function addTime(horaStr: string, minutos: number, segundos: number): Date {
  const [horas, mins, secs] = horaStr.split(":").map(Number);
  const fecha = new Date();
  fecha.setHours(horas, mins, secs, 0);
  fecha.setMinutes(fecha.getMinutes() + minutos);
  fecha.setSeconds(fecha.getSeconds() + segundos);
  return fecha;
}

function compareHours(horaStr1: string, horaStr2: string): boolean {
  const [h1, m1, s1] = horaStr1.split(":").map(Number);
  const [h2, m2, s2] = horaStr2.split(":").map(Number);
  const fecha1 = new Date();
  fecha1.setHours(h1, m1, s1, 0);
  const fecha2 = new Date();
  fecha2.setHours(h2, m2, s2, 0);
  return fecha1 <= fecha2;
}

function filterDetails(data: any[]): any[] {
  return data
    .filter((arrival: any) => {
      if (arrival.difference_minutes != 0 && arrival.difference_minutes != null) return true;

      const createdAt = new Date(arrival.created_at);
      const today = new Date();
      const isToday =
        today.getFullYear() === createdAt.getFullYear() &&
        today.getMonth() === createdAt.getMonth() &&
        today.getDate() === createdAt.getDate();
      if (!isToday) return false;

      const limit = addTime(arrival.hour_in, 10, 59).toTimeString().slice(0, 8);
      return !compareHours(arrival.hours, limit);
    })
    .reverse();
}

interface Props {
  visible: boolean;
  onHide: () => void;
  user: any;
  year: number;
  month: number;
}

export default function ExpensesIncomeSurplusDetailsDialog({ visible, onHide, user, year, month }: Props) {
  const toast = useRef<Toast>(null);

  const [detailsUser, setDetailsUser] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingJustified, setIsChangingJustified] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [justifiedFilter, setJustifiedFilter] = useState("");

  const filterMonthLabel = useMemo(() => {
    if (!year || !month) return "";
    const label = new Date(year, month - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [year, month]);

  const availableDates = useMemo(() => {
    const list = new Set<string>();
    detailsUser.forEach((detail) => {
      if (detail.date) list.add(detail.date.split(/[T ]/)[0]);
    });
    return [...list];
  }, [detailsUser]);

  const availableDateObjects = useMemo(() => availableDates.map((d) => new Date(`${d}T00:00:00`)), [availableDates]);

  const filteredDetails = useMemo(() => {
    return detailsUser.filter((detail) => {
      if (dateFilter && (!detail.date || detail.date.split(/[T ]/)[0] !== dateFilter)) return false;
      if (justifiedFilter && String(detail.justified ? "1" : "0") !== justifiedFilter) return false;
      return true;
    });
  }, [detailsUser, dateFilter, justifiedFilter]);

  function clearFilters() {
    setDateFilter("");
    setJustifiedFilter("");
  }

  async function loadUserDetail() {
    setIsLoading(true);
    try {
      const resp = await loadDetailReportForIncomeAndExpenses({ user_id: user.id, year, month });
      setDetailsUser(filterDetails(resp[0] ?? []));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar detalles de los reportes del usuario", detail: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!visible || !user) return;
    loadUserDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user, year, month]);

  async function changeNotified(userDetail: any) {
    setIsChangingJustified(true);
    try {
      await changeJustified(userDetail.id);
      setDetailsUser((prev) => prev.map((d) => (d.id === userDetail.id ? { ...d, justified: d.justified ? 0 : 1 } : d)));
      toast.current?.show({ severity: "success", summary: "Cambio realizado" });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cambiar", detail: "Inténtelo de nuevo" });
    } finally {
      setIsChangingJustified(false);
    }
  }

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Clock size={18} color="#eab308" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Detalle</p>
        <div className="d-flex align-items-center flex-wrap" style={{ gap: "6px" }}>
          <span className="license-dialog-year-badge">{user?.lastname_name}</span>
          <span className="license-dialog-year-badge">{filterMonthLabel}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <Dialog header={dialogHeader} visible={visible} draggable={false} modal dismissableMask onHide={onHide} style={{ width: "95vw" }}>
        <div className="license-filter-bar mb-3">
          <div className="license-filter-bar-inputs">
            <div className={`license-filter-input-wrap${dateFilter ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-calendar license-filter-icon" />
              <Calendar
                value={dateFilter ? new Date(`${dateFilter}T00:00:00`) : null}
                onChange={(e) => {
                  const d = e.value as Date | null;
                  setDateFilter(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
                }}
                dateFormat="dd/mm/yy"
                locale="es-expenses-income-surplus"
                showOtherMonths={false}
                minDate={year && month ? new Date(year, month - 1, 1) : undefined}
                maxDate={year && month ? new Date(year, month - 1, new Date(year, month, 0).getDate()) : undefined}
                enabledDates={availableDateObjects}
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
            <div className={`license-filter-input-wrap${justifiedFilter ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-check-square license-filter-icon" />
              <Dropdown
                value={justifiedFilter || null}
                options={JUSTIFIED_OPTIONS}
                onChange={(e) => setJustifiedFilter(e.value ?? "")}
                placeholder="Justificada"
                showClear
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
          {(dateFilter || justifiedFilter) && (
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
              <p>No hay detalles para mostrar</p>
            </div>
          }
        >
          <Column header="DÍA" body={(detail) => <small>{detail.date && formatDate(detail.date)}</small>} />
          <Column header="HORARIO LABORAL" body={(detail) => <small>{detail.hour_in} / {detail.hour_out}</small>} />
          <Column header="INGRESO" body={(detail) => <small>{detail.hours}</small>} />
          <Column header="DIFERENCIA" body={(detail) => <small>{detail.difference_minutes}</small>} />
          <Column
            header="JUSTIFICADA"
            body={(detail) =>
              isChangingJustified ? (
                <i className="pi pi-spin pi-spinner" />
              ) : (
                <span
                  className="badge rounded-pill pointer"
                  onClick={() => changeNotified(detail)}
                  style={{
                    background: (detail.justified ? STATUS_BADGE_COLORS.success : STATUS_BADGE_COLORS.danger).bg,
                    color: (detail.justified ? STATUS_BADGE_COLORS.success : STATUS_BADGE_COLORS.danger).color,
                    border: "none",
                    fontWeight: 600,
                    padding: "4px 10px",
                  }}
                >
                  {detail.justified ? "Sí" : "No"}
                </span>
              )
            }
          />
        </DataTable>
      </Dialog>
    </>
  );
}
