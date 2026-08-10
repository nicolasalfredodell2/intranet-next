"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { ProgressBar } from "primereact/progressbar";
import { Plus } from "lucide-react";
import { createHoraExtra } from "@/lib/services/horas-extras.service";

addLocale("es-horas-extras-create", {
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

const TYPE_OPTIONS = [
  { label: "Compensatorio", value: "1" },
  { label: "Hora extra", value: "2" },
];

const SHIFT_OPTIONS = [
  { label: "Ambos", value: "AMBOS" },
  { label: "Matutino", value: "MATUTINO" },
  { label: "Vespertino", value: "VESPERTINO" },
];

const EMPTY_FORM = { begin_date: "", end_date: "", shift: "", user_id: "", work_planner_type_id: "2" };

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface Props {
  visible: boolean;
  onHide: () => void;
  horaExtra: any;
  year: number;
  month: number;
  onCreated: () => void;
}

export default function HorasExtrasCreateDialog({ visible, onHide, horaExtra, year, month, onCreated }: Props) {
  const toast = useRef<Toast>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (horaExtra?.user_id) setForm((p) => ({ ...p, user_id: horaExtra.user_id }));
  }, [horaExtra]);

  const filterMonthLabel = useMemo(() => {
    if (!year || !month) return "";
    const label = new Date(year, month - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [year, month]);

  const monthStart = year && month ? new Date(year, month - 1, 1) : undefined;
  const monthEnd = year && month ? new Date(year, month - 1, new Date(year, month, 0).getDate()) : undefined;
  const lockedMonthPt = {
    previousButton: { style: { visibility: "hidden" as const, pointerEvents: "none" as const } },
    nextButton: { style: { visibility: "hidden" as const, pointerEvents: "none" as const } },
    monthTitle: { style: { pointerEvents: "none" as const, cursor: "default" as const } },
    yearTitle: { style: { pointerEvents: "none" as const, cursor: "default" as const } },
  };

  const canCreate = useMemo(() => {
    return !!(form.work_planner_type_id && form.shift && form.begin_date && form.end_date);
  }, [form]);

  function resetForm() {
    setForm({ ...EMPTY_FORM, user_id: horaExtra?.user_id ?? "" });
  }

  function closeModal() {
    resetForm();
    onHide();
  }

  async function create() {
    if (isCreating) return;

    if (form.end_date < form.begin_date) {
      toast.current?.show({ severity: "info", summary: "La Fecha Fin no puede ser menor a la Fecha Inicio" });
      return;
    }

    setIsCreating(true);
    try {
      await createHoraExtra(form);
      toast.current?.show({ severity: "success", summary: form.work_planner_type_id === "1" ? "Compensatorio creado" : "Hora extra creada" });
      resetForm();
      onCreated();
      onHide();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: form.work_planner_type_id === "1" ? "No se pudo crear el compensatorio" : "No se pudo crear la hora extra",
        detail: "Inténtelo más tarde",
      });
    } finally {
      setIsCreating(false);
    }
  }

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Plus size={18} color="#eab308" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Crear hora extra</p>
        <div className="d-flex align-items-center flex-wrap" style={{ gap: "6px" }}>
          <span className="license-dialog-year-badge">{horaExtra?.lastname_name}</span>
          <span className="license-dialog-year-badge">Legajo {String(horaExtra?.internal ?? "").split("/")[0]}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <Dialog
        header={dialogHeader}
        visible={visible}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(560px, 92vw)" }}
        onHide={closeModal}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={isCreating || !canCreate}
                onClick={create}
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={isCreating ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {isCreating ? "Creando..." : "Crear"}
              </button>
              <button
                disabled={isCreating}
                onClick={resetForm}
                type="button"
                className="btn btn-light text-muted"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Limpiar
              </button>
              <button
                disabled={isCreating}
                onClick={closeModal}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Cancelar
              </button>
            </div>
            {isCreating && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <div className="row">
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Tipo</label>
            <div className="license-filter-input-wrap">
              <i className="pi pi-tag license-filter-icon" />
              <Dropdown
                value={form.work_planner_type_id}
                options={TYPE_OPTIONS}
                onChange={(e) => setForm((p) => ({ ...p, work_planner_type_id: e.value }))}
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Turno</label>
            <div className="license-filter-input-wrap">
              <i className="pi pi-sun license-filter-icon" />
              <Dropdown
                value={form.shift || null}
                options={SHIFT_OPTIONS}
                onChange={(e) => setForm((p) => ({ ...p, shift: e.value ?? "" }))}
                placeholder="Seleccioná un turno"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Fecha inicio</label>
            <div className="license-filter-input-wrap profile-birthdate-wrap">
              <i className="pi pi-calendar license-filter-icon" />
              <small style={{ color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap", marginRight: "6px" }}>{filterMonthLabel}</small>
              <Calendar
                value={form.begin_date ? new Date(`${form.begin_date}T00:00:00`) : null}
                onChange={(e) => setForm((p) => ({ ...p, begin_date: e.value ? toDateInputValue(e.value as Date) : "" }))}
                dateFormat="dd/mm/yy"
                locale="es-horas-extras-create"
                showOtherMonths={false}
                disabledDays={[0, 6]}
                viewDate={monthStart}
                minDate={monthStart}
                maxDate={monthEnd}
                placeholder="Seleccioná una fecha"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                pt={lockedMonthPt}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Fecha fin</label>
            <div className="license-filter-input-wrap profile-birthdate-wrap">
              <i className="pi pi-calendar license-filter-icon" />
              <small style={{ color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap", marginRight: "6px" }}>{filterMonthLabel}</small>
              <Calendar
                value={form.end_date ? new Date(`${form.end_date}T00:00:00`) : null}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.value ? toDateInputValue(e.value as Date) : "" }))}
                dateFormat="dd/mm/yy"
                locale="es-horas-extras-create"
                showOtherMonths={false}
                disabledDays={[0, 6]}
                viewDate={monthStart}
                minDate={form.begin_date ? new Date(`${form.begin_date}T00:00:00`) : monthStart}
                maxDate={monthEnd}
                placeholder="Seleccioná una fecha"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                pt={lockedMonthPt}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
