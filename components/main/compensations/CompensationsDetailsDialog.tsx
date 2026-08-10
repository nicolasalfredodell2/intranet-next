"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { ProgressBar } from "primereact/progressbar";
import { Pencil } from "lucide-react";
import { updateCompensation } from "@/lib/services/compensations.service";

addLocale("es-compensations-details", {
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

const EMPTY_FORM = { begin_date: "", end_date: "", shift: "", user_id: "", work_planner_id: "", work_planner_type_id: "" };

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface Props {
  visible: boolean;
  onHide: () => void;
  compensation: any;
  onUpdated: (compensation: any) => void;
  onRemoved: (compensation: any) => void;
}

export default function CompensationsDetailsDialog({ visible, onHide, compensation, onUpdated, onRemoved }: Props) {
  const toast = useRef<Toast>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!compensation) return;
    setForm({
      begin_date: compensation.begin_date ?? "",
      end_date: compensation.end_date ?? "",
      shift: compensation.shift ?? "",
      user_id: compensation.user_id ?? "",
      work_planner_id: compensation.work_planner_id ?? "",
      work_planner_type_id: compensation.work_planner_type_id != null ? String(compensation.work_planner_type_id) : "",
    });
  }, [compensation]);

  const canUpdate = useMemo(() => {
    if (!compensation) return false;
    return !(
      form.work_planner_id === compensation.work_planner_id &&
      form.work_planner_type_id === String(compensation.work_planner_type_id ?? "") &&
      form.shift === compensation.shift &&
      form.begin_date === compensation.begin_date &&
      form.end_date === compensation.end_date
    );
  }, [form, compensation]);

  function closeModal() {
    if (isUpdating) return;
    onHide();
  }

  async function update() {
    if (isUpdating || !canUpdate) return;

    if (form.end_date < form.begin_date) {
      toast.current?.show({ severity: "info", summary: "La Fecha Fin no puede ser menor a la Fecha Inicio" });
      return;
    }

    setIsUpdating(true);
    try {
      await updateCompensation(form, form.work_planner_id);

      toast.current?.show({ severity: "success", summary: "Compensatorio actualizado" });

      onUpdated({
        ...compensation,
        begin_date: form.begin_date,
        end_date: form.end_date,
        shift: form.shift,
        work_planner_type_id: form.work_planner_type_id,
      });

      if (form.work_planner_type_id === "2") onRemoved(compensation);

      onHide();
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo modificar el compensatorio", detail: "Inténtelo más tarde" });
    } finally {
      setIsUpdating(false);
    }
  }

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Pencil size={18} color="#3b82f6" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar</p>
        <div className="d-flex align-items-center flex-wrap" style={{ gap: "6px" }}>
          <span className="license-dialog-year-badge">{compensation?.lastname_name}</span>
          <span className="license-dialog-year-badge">Legajo {String(compensation?.internal ?? "").split("/")[0]}</span>
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
                disabled={isUpdating || !canUpdate}
                onClick={update}
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={isUpdating ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {isUpdating ? "Guardando..." : "Guardar"}
              </button>
              <button
                disabled={isUpdating}
                onClick={() => setForm(EMPTY_FORM)}
                type="button"
                className="btn btn-light text-muted"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Limpiar
              </button>
              <button
                disabled={isUpdating}
                onClick={closeModal}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {isUpdating && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <div className="row">
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Tipo</label>
            <div className="license-filter-input-wrap">
              <i className="pi pi-tag license-filter-icon" />
              <Dropdown
                value={form.work_planner_type_id || null}
                options={TYPE_OPTIONS}
                onChange={(e) => setForm((p) => ({ ...p, work_planner_type_id: e.value }))}
                placeholder="Seleccioná un tipo"
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
              <Calendar
                value={form.begin_date ? new Date(`${form.begin_date}T00:00:00`) : null}
                onChange={(e) => setForm((p) => ({ ...p, begin_date: e.value ? toDateInputValue(e.value as Date) : "" }))}
                dateFormat="dd/mm/yy"
                locale="es-compensations-details"
                showButtonBar
                showOtherMonths={false}
                placeholder="Seleccioná una fecha"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
              />
            </div>
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Fecha fin</label>
            <div className="license-filter-input-wrap profile-birthdate-wrap">
              <i className="pi pi-calendar license-filter-icon" />
              <Calendar
                value={form.end_date ? new Date(`${form.end_date}T00:00:00`) : null}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.value ? toDateInputValue(e.value as Date) : "" }))}
                dateFormat="dd/mm/yy"
                locale="es-compensations-details"
                showButtonBar
                showOtherMonths={false}
                minDate={form.begin_date ? new Date(`${form.begin_date}T00:00:00`) : undefined}
                placeholder="Seleccioná una fecha"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
