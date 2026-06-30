"use client";

import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { getAllBossesForLegajo } from "@/lib/services/boss.service";
import { createExitOrderAdmin } from "@/lib/services/exits.service";

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
          className="btn btn-light text-muted"
          style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
        >
          Cerrar
        </button>
      </div>
      {loadingCreate && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
    </div>
  );

  return (
    <>
      <Toast ref={toast} position="bottom-center" />
      <Dialog
        header={dialogHeader}
        visible={isOpen}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "min(600px, 92vw)" }}
        onHide={handleHide}
        footer={dialogFooter}
      >
        <div className="row">

          <div className="col-12 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de salida *</label>
            <select
              className="form-control form-control-sm custom-select mt-1"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <option value=""></option>
              {EXIT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {touched && !form.type && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Día y hora de salida *</label>
            <input
              type="datetime-local"
              className="form-control form-control-sm mt-1"
              value={form.departure_hour}
              onChange={(e) => setForm((p) => ({ ...p, departure_hour: e.target.value }))}
            />
            {touched && !form.departure_hour && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Día y hora de llegada <span style={{ fontWeight: 400, textTransform: "none", fontSize: "0.76rem", color: "#94a3b8" }}>(opcional)</span>
            </label>
            <input
              type="datetime-local"
              className="form-control form-control-sm mt-1"
              value={form.arrival_hour}
              onChange={(e) => setForm((p) => ({ ...p, arrival_hour: e.target.value }))}
            />
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Legajo *</label>
            <input
              type="text"
              className="form-control form-control-sm mt-1"
              value={form.file}
              onChange={handleFileChange}
            />
            {touched && !form.file && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirmar legajo *</label>
            <input
              type="text"
              className="form-control form-control-sm mt-1"
              value={form.confirm_file}
              onChange={handleConfirmFileChange}
            />
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
              <select
                className="form-control form-control-sm custom-select mt-1"
                value={form.cuilBoss}
                onChange={(e) => setForm((p) => ({ ...p, cuilBoss: e.target.value }))}
              >
                {bosses.map((b) => (
                  <option key={b.cuil} value={b.cuil}>{b.lastname_name}</option>
                ))}
              </select>
              {touched && !form.cuilBoss && <small className="text-danger fadeIn animated">* Campo obligatorio</small>}
            </div>
          )}

        </div>
      </Dialog>
    </>
  );
}
