"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { loadExitOrders, createExitOrder, cancelExitOrder, loadExitPDF } from "@/lib/services/exits.service";

const EXIT_TYPES = [
  { value: "Officials", label: "Oficial" },
  { value: "Individuals", label: "Particular" },
  { value: "Education", label: "Licencia por estudio/capacitación" },
  { value: "Health", label: "Salud o cuidado familiar" },
  { value: "Maternity_Breastfeeding", label: "Lactancia - Maternidad" },
  { value: "Guild_Meeting_Attendance", label: "Asamblea" },
  { value: "Others_Justify", label: "Otras justificaciones" },
];

const TYPE_LABELS: Record<string, string> = {
  Officials: "Oficial",
  Unexpected: "Sin orden de salida",
  Individuals: "Particular",
  Education: "Licencia por estudio/capacitación",
  Health: "Salud o cuidado familiar",
  Maternity_Breastfeeding: "Lactancia - Maternidad",
  Guild_Meeting_Attendance: "Asamblea",
  Others_Justify: "Otras justificaciones",
};

const STATUS_LABELS: Record<string, { label: string; cssClass: string }> = {
  Waiting: { label: "Esperando llegada", cssClass: "warning" },
  Cancel: { label: "Cancelado", cssClass: "danger" },
  Done: { label: "Finalizado", cssClass: "success" },
  Pending: { label: "Pendiente aprobación", cssClass: "muted" },
};

function mapExits(raw: any[]): any[] {
  return raw.map((item: any) => {
    const type = TYPE_LABELS[item.type] ?? item.type;
    const statusInfo = STATUS_LABELS[item.status];
    return {
      ...item,
      type,
      lastname_name: item.boss?.lastname_name ?? item.lastname_name,
      statusLabel: statusInfo?.label ?? item.status,
      statusClass: statusInfo?.cssClass ?? "",
      canArrival: item.status === "Waiting",
      canCancel: item.status === "Waiting" || item.status === "Pending",
      canShowPdf: true,
    };
  });
}

function getTodayDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExitsPage() {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [itemToCancel, setItemToCancel] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState({ cuil: "", departure_hour: "", type: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const raw = await loadExitOrders();
      setItems(mapExits([...raw].reverse()));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar sus salidas", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.cuil || !form.departure_hour || !form.type) return;

    const now = new Date();
    const dep = new Date(form.departure_hour);
    if (dep < now) {
      toast.current?.show({ severity: "info", summary: "La hora de salida no puede ser antes que la hora actual." });
      return;
    }

    const d = dep;
    const pad = (n: number) => String(n).padStart(2, "0");
    const departureHourString = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    setLoadingCreate(true);
    try {
      const resp = await createExitOrder({ cuil: form.cuil, departure_hour: departureHourString, type: form.type });
      toast.current?.show({ severity: "success", summary: "Solicitud de salida creada" });
      if (resp.exit_order) {
        const newItem = { ...resp.exit_order, boss: resp.boss, status: "Pending" };
        setItems((prev) => mapExits([newItem, ...prev]));
      }
      setForm({ cuil: "", departure_hour: "", type: "" }); setTouched(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear la orden", detail: err.message });
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleOpenPdf(exit: any) {
    if (!exit.path_end || loadingPdf) return;
    setLoadingPdf(exit.id);
    try {
      const buffer = await loadExitPDF(exit.id);
      const blob = new Blob([buffer], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob));
    } catch { toast.current?.show({ severity: "error", summary: "No se encontró el PDF" }); }
    finally { setLoadingPdf(null); }
  }

  async function handleCancel() {
    if (!itemToCancel || loadingCancel) return;
    setLoadingCancel(true);
    try {
      await cancelExitOrder(itemToCancel.id);
      setItems((prev) => mapExits(prev.map((i) => i.id === itemToCancel.id ? { ...i, status: "Cancel" } : i)));
      toast.current?.show({ severity: "success", summary: "Salida cancelada" });
      setItemToCancel(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se puede cancelar la salida" }); }
    finally { setLoadingCancel(false); }
  }

  const filtered = items.filter((i) => {
    if (filterStatus && i.statusLabel !== filterStatus) return false;
    if (filterType && i.type !== filterType) return false;
    return true;
  });

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Ordenes de salida</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Ordenes de salida</li>
            </ol>
          </div>
        </div>

        {/* Create form */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <form className="animated fadeIn row" onSubmit={handleCreate} noValidate>
                  <div className="form-group col-12 col-md-4">
                    <label><small>CUIL *</small></label>
                    <input type="text" className="form-control form-control-sm" placeholder="Sin guiones" value={form.cuil} onChange={(e) => setForm((p) => ({ ...p, cuil: e.target.value }))} />
                    {touched && !form.cuil && <small className="text-danger">* Obligatorio</small>}
                  </div>
                  <div className="form-group col-12 col-md-4">
                    <label><small>Hora de salida *</small></label>
                    <input type="datetime-local" className="form-control form-control-sm" min={getTodayDatetimeLocal()} value={form.departure_hour} onChange={(e) => setForm((p) => ({ ...p, departure_hour: e.target.value }))} />
                    {touched && !form.departure_hour && <small className="text-danger">* Obligatorio</small>}
                  </div>
                  <div className="form-group col-12 col-md-4">
                    <label><small>Tipo *</small></label>
                    <select className="custom-select w-100" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                      <option value=""></option>
                      {EXIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {touched && !form.type && <small className="text-danger">* Obligatorio</small>}
                  </div>
                  <div className="col-12">
                    <button disabled={loadingCreate} type="submit" className="btn btn-info">
                      {loadingCreate ? "Enviando..." : "Solicitar salida"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-3">
          <div className="col-6 col-md-3">
            <select className="custom-select custom-select-sm w-100" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Estado</option>
              {Object.values(STATUS_LABELS).map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="custom-select custom-select-sm w-100" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Tipo</option>
              {EXIT_TYPES.map((t) => <option key={t.value} value={t.label}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                {loading && <ProgressBar mode="indeterminate" style={{ height: "6px" }} />}
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>JEFE</th>
                        <th>TIPO</th>
                        <th>SALIDA</th>
                        <th>LLEGADA</th>
                        <th>ESTADO</th>
                        <th>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id} className="fadeIn animated">
                          <td><small>{item.lastname_name}</small></td>
                          <td><small>{item.type}</small></td>
                          <td><small>{item.departure_hour}</small></td>
                          <td><small>{item.arrival_hour ?? "-"}</small></td>
                          <td><span className={`badge badge-${item.statusClass}`}>{item.statusLabel}</span></td>
                          <td className="text-nowrap">
                            {item.canShowPdf && item.path_end && (
                              <button className="btn btn-sm btn-light mr-1" onClick={() => handleOpenPdf(item)} disabled={loadingPdf === item.id}>
                                {loadingPdf === item.id ? <i className="pi pi-spin pi-spinner" /> : <i className="mdi mdi-file-pdf-box text-danger" />}
                              </button>
                            )}
                            {item.canCancel && (
                              <button className="btn btn-sm btn-danger" onClick={() => setItemToCancel(item)}>
                                <i className="mdi mdi-close-circle-outline" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!loading && filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted">No hay ordenes de salida.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {itemToCancel && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-warning mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Cancelar salida?</h4>
              <p className="text-muted">Tipo: <strong>{itemToCancel?.type}</strong></p>
              <div className="row g-2 mt-3">
                <div className="col-6"><button disabled={loadingCancel} className="btn btn-light w-100" onClick={() => setItemToCancel(null)}>No</button></div>
                <div className="col-6"><button disabled={loadingCancel} className="btn btn-warning w-100" onClick={handleCancel}>{loadingCancel ? "..." : "Sí, cancelar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
