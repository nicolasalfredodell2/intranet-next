"use client";

import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { getAllBossesForLegajo } from "@/lib/services/boss.service";
import { createExitOrderAdmin } from "@/lib/services/exits.service";

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

function toDateTimeInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

const EXIT_TYPES = [
  { value: "Unexpected",               label: "Sin órden de salida" },
  { value: "Individuals",              label: "Particular" },
  { value: "Officials",                label: "Oficial" },
  { value: "Guild_Meeting_Attendance", label: "Asamblea" },
  { value: "Education",                label: "Licencia por estudio/capacitación" },
  { value: "Health",                   label: "Salud o cuidado familiar" },
  { value: "Maternity_Breastfeeding",  label: "Lactancia - Maternidad" },
  { value: "Others_Justify",           label: "Otras justificaciones" },
];

interface Boss { cuil: string; lastname_name: string; }

interface Props {
  isOpen: boolean;
  onHide: () => void;
  onCreated: (exitOrder: any) => void;
}

const EMPTY = { type: "", departure_hour: "", arrival_hour: "", file: "", confirm_file: "", cuilBoss: "" };

export default function CreateExitAdminModal({ isOpen, onHide, onCreated }: Props) {
  const toast       = useRef<Toast>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef     = useRef("");

  const [form,          setForm]          = useState(EMPTY);
  const [touched,       setTouched]       = useState(false);
  const [bosses,        setBosses]        = useState<Boss[]>([]);
  const [loadingBosses, setLoadingBosses] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    fileRef.current = val;
    setForm((p) => ({ ...p, file: val }));
  }

  function handleConfirmFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const confirmVal = e.target.value;
    setForm((p) => ({ ...p, confirm_file: confirmVal }));
    if (!confirmVal) { setBosses([]); return; }
    setLoadingBosses(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => chargeBosses(confirmVal), 1000);
  }

  async function chargeBosses(confirmFile: string) {
    if (!confirmFile || confirmFile !== fileRef.current) {
      setBosses([]);
      setLoadingBosses(false);
      if (confirmFile && confirmFile !== fileRef.current) {
        toast.current?.show({ severity: "info", summary: "Los legajos no son iguales" });
      }
      return;
    }
    try {
      const resp = await getAllBossesForLegajo(confirmFile);
      const list: Boss[] = resp.bosses ?? resp ?? [];
      setBosses(list);
      if (list.length > 0) setForm((p) => ({ ...p, cuilBoss: list[0].cuil }));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar los jefes" });
    } finally {
      setLoadingBosses(false);
    }
  }

  async function handleSubmit() {
    setTouched(true);
    if (!form.type || !form.departure_hour || !form.file || !form.confirm_file || !form.cuilBoss) return;
    setLoadingCreate(true);
    try {
      const resp = await createExitOrderAdmin({
        type: form.type,
        departure_hour: form.departure_hour,
        ...(form.arrival_hour ? { arrival_hour: form.arrival_hour } : {}),
        file: form.file,
        cuilBoss: form.cuilBoss,
      });
      toast.current?.show({ severity: "success", summary: "Solicitud de salida creada" });
      onCreated(resp.exit_order ?? resp);
      handleHide();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear la orden", detail: err.message });
    } finally {
      setLoadingCreate(false);
    }
  }

  function handleHide() {
    setForm(EMPTY);
    setTouched(false);
    setBosses([]);
    fileRef.current = "";
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onHide();
  }

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-sign-out" style={{ color: "#059669", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Crear orden de salida</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Para un agente de la institución</small>
      </div>
    </div>
  );

  const dialogFooter = (
    <div>
      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
        <button
          type="button"
          disabled={loadingCreate}
          onClick={handleSubmit}
          className="btn btn-primary d-flex align-items-center"
          style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
        >
          <i className={loadingCreate ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
          {loadingCreate ? "Solicitando..." : "Solicitar salida"}
        </button>
        <button
          type="button"
          disabled={loadingCreate}
          onClick={handleHide}
          className="btn btn-light text-muted ml-auto"
          style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
        >
          Volver
        </button>
      </div>
      {loadingCreate && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />
      <Dialog
        header={dialogHeader}
        visible={isOpen}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(600px, 92vw)" }}
        onHide={handleHide}
        footer={dialogFooter}
      >
        <div className="row">

          <div className="col-12 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de salida *</label>
            <div className={`license-filter-input-wrap mt-1${form.type ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-tag license-filter-icon" />
              <Dropdown
                value={form.type || null}
                options={EXIT_TYPES}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => setForm((p) => ({ ...p, type: e.value ?? "" }))}
                placeholder="Seleccioná un tipo"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
            {touched && !form.type && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Día y hora de salida *</label>
            <div className="license-filter-input-wrap profile-birthdate-wrap mt-1">
              <i className="pi pi-calendar license-filter-icon" />
              <Calendar
                value={form.departure_hour ? new Date(form.departure_hour) : null}
                onChange={(e) => setForm((p) => ({ ...p, departure_hour: e.value ? toDateTimeInputValue(e.value as Date) : "" }))}
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                locale="es"
                showButtonBar
                placeholder="Seleccioná fecha y hora"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
              />
            </div>
            {touched && !form.departure_hour && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Día y hora de llegada <span style={{ fontWeight: 400, textTransform: "none", fontSize: "0.76rem", color: "#94a3b8" }}>(opcional)</span>
            </label>
            <div className="license-filter-input-wrap profile-birthdate-wrap mt-1">
              <i className="pi pi-calendar license-filter-icon" />
              <Calendar
                value={form.arrival_hour ? new Date(form.arrival_hour) : null}
                onChange={(e) => setForm((p) => ({ ...p, arrival_hour: e.value ? toDateTimeInputValue(e.value as Date) : "" }))}
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                locale="es"
                showButtonBar
                placeholder="Seleccioná fecha y hora"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
              />
            </div>
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Legajo *</label>
            <div className={`license-filter-input-wrap mt-1${form.file ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-id-card license-filter-icon" />
              <input
                type="text"
                style={{ paddingLeft: "32px", border: "none", width: "100%", fontSize: "0.84rem", background: "transparent", outline: "none" }}
                value={form.file}
                onChange={handleFileChange}
              />
            </div>
            {touched && !form.file && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirmar legajo *</label>
            <div className={`license-filter-input-wrap mt-1${form.confirm_file ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-id-card license-filter-icon" />
              <input
                type="text"
                style={{ paddingLeft: "32px", border: "none", width: "100%", fontSize: "0.84rem", background: "transparent", outline: "none" }}
                value={form.confirm_file}
                onChange={handleConfirmFileChange}
              />
            </div>
            {touched && !form.confirm_file && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
          </div>

          {loadingBosses && (
            <div className="col-12 mb-2 fadeIn animated d-flex align-items-center" style={{ gap: "8px", color: "#64748b", fontSize: "0.84rem" }}>
              <i className="pi pi-spin pi-spinner" />
              Cargando jefes...
            </div>
          )}

          {!loadingBosses && bosses.length > 0 && (
            <div className="col-12 mb-3 fadeIn animated">
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Jefe *</label>
              <div className={`license-filter-input-wrap mt-1${form.cuilBoss ? " license-filter-input-wrap--active" : ""}`}>
                <i className="pi pi-user license-filter-icon" />
                <Dropdown
                  value={form.cuilBoss || null}
                  options={bosses}
                  optionLabel="lastname_name"
                  optionValue="cuil"
                  onChange={(e) => setForm((p) => ({ ...p, cuilBoss: e.value ?? "" }))}
                  placeholder="Seleccioná un jefe"
                  className="license-filter-dropdown"
                  panelClassName="license-filter-dropdown-panel"
                />
              </div>
              {touched && !form.cuilBoss && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
            </div>
          )}

        </div>
      </Dialog>
    </>
  );
}
