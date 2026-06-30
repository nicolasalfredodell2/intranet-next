"use client";

import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { getAllBossesForLegajo } from "@/lib/services/boss.service";
import { createExitOrderAdmin } from "@/lib/services/exits.service";

const EXIT_TYPES = [
  { value: "Unexpected", label: "Sin órden de salida" },
  { value: "Individuals", label: "Particular" },
  { value: "Officials", label: "Oficial" },
  { value: "Guild_Meeting_Attendance", label: "Asamblea" },
  { value: "Education", label: "Licencia por estudio/capacitación" },
  { value: "Health", label: "Salud o cuidado familiar" },
  { value: "Maternity_Breastfeeding", label: "Lactancia - Maternidad" },
  { value: "Others_Justify", label: "Otras justificaciones" },
];

interface Boss {
  cuil: string;
  lastname_name: string;
}

interface Props {
  isOpen: boolean;
  onHide: () => void;
  onCreated: (exitOrder: any) => void;
}

const EMPTY = { type: "", departure_hour: "", arrival_hour: "", file: "", confirm_file: "", cuilBoss: "" };

export default function CreateExitAdminModal({ isOpen, onHide, onCreated }: Props) {
  const toast = useRef<Toast>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef("");

  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [bosses, setBosses] = useState<Boss[]>([]);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Creación de órden de salida"
        visible={isOpen}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "65vw" }}
        onHide={handleHide}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="row">

            <div className="form-group col-12">
              <label><small>TIPO DE SALIDA *</small></label>
              <select
                className="form-control form-control-sm custom-select"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value=""></option>
                {EXIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {touched && !form.type && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
            </div>

            <div className="form-group col-12 col-md-6">
              <label><small>DÍA Y HORA DE SALIDA *</small></label>
              <input
                type="datetime-local"
                className="form-control form-control-sm"
                value={form.departure_hour}
                onChange={(e) => setForm((p) => ({ ...p, departure_hour: e.target.value }))}
              />
              {touched && !form.departure_hour && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
            </div>

            <div className="form-group col-12 col-md-6">
              <label><small>DÍA Y HORA DE LLEGADA <span className="text-muted">(Campo opcional)</span></small></label>
              <input
                type="datetime-local"
                className="form-control form-control-sm"
                value={form.arrival_hour}
                onChange={(e) => setForm((p) => ({ ...p, arrival_hour: e.target.value }))}
              />
            </div>

            <div className="form-group col-12 col-md-6">
              <label><small>LEGAJO *</small></label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.file}
                onChange={handleFileChange}
              />
              {touched && !form.file && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
            </div>

            <div className="form-group col-12 col-md-6">
              <label><small>CONFIRMAR LEGAJO *</small></label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.confirm_file}
                onChange={handleConfirmFileChange}
              />
              {touched && !form.confirm_file && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
            </div>

            {loadingBosses && (
              <div className="col-12 mb-3 animated fadeIn">
                <p className="mb-0">
                  <i className="pi pi-spin pi-spinner mr-1" />
                  Cargando jefes
                </p>
              </div>
            )}

            {!loadingBosses && bosses.length > 0 && (
              <div className="form-group col-12 animated fadeIn">
                <label><small>JEFE *</small></label>
                <select
                  className="form-control form-control-sm custom-select"
                  value={form.cuilBoss}
                  onChange={(e) => setForm((p) => ({ ...p, cuilBoss: e.target.value }))}
                >
                  {bosses.map((b) => (
                    <option key={b.cuil} value={b.cuil}>{b.lastname_name}</option>
                  ))}
                </select>
                {touched && !form.cuilBoss && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
              </div>
            )}

          </div>

          <div className="d-flex justify-content-end mt-3" style={{ gap: "8px" }}>
            <button type="submit" disabled={loadingCreate} className="btn btn-info">
              {loadingCreate ? "Solicitando salida..." : "Solicitar salida"}
            </button>
            <button type="button" disabled={loadingCreate} className="btn btn-light" onClick={handleHide}>
              Cerrar
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
