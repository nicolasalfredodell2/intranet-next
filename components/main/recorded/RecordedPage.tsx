"use client";

import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { getRecordedData, createRecord, updateRecord, deleteRecord } from "@/lib/services/recorded.service";

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  success: { label: "Confirmado", badge: "badge-success" },
  warning: { label: "Esperando", badge: "badge-warning" },
  danger: { label: "Incompleto", badge: "badge-danger" },
  muted: { label: "Sin estado", badge: "badge-secondary" },
};

export default function RecordedPage() {
  const toast = useRef<Toast>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [filters, setFilters] = useState({ date_from: "", date_to: "", cuil: "", name: "", area: "" });
  const [touched, setTouched] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ cuil: "", date: "", hour: "", type: "1" });
  const [createTouched, setCreateTouched] = useState(false);

  const [recordToEdit, setRecordToEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ date: "", hour: "" });
  const [editTouched, setEditTouched] = useState(false);

  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const TYPE_OPTIONS = [
    { value: "1", label: "Ingreso laboral" },
    { value: "2", label: "Salida temporal" },
    { value: "3", label: "Reingreso temporal" },
    { value: "4", label: "Egreso laboral" },
    { value: "5", label: "Salida de emergencia" },
    { value: "6", label: "Regreso de emergencia" },
    { value: "7", label: "Salida sin retorno" },
  ];

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!filters.date_from || !filters.date_to) return;
    setLoading(true);
    try {
      const data = await getRecordedData(filters);
      setRecords(data);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar los registros", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateTouched(true);
    if (!createForm.cuil || !createForm.date || !createForm.hour) return;
    setLoadingAction(true);
    const datetime = `${createForm.date} ${createForm.hour}:00`;
    try {
      await createRecord({ cuil: createForm.cuil, date_time: datetime, type: Number(createForm.type) });
      toast.current?.show({ severity: "success", summary: "Registro creado" });
      setShowCreate(false);
      setCreateForm({ cuil: "", date: "", hour: "", type: "1" }); setCreateTouched(false);
      await handleSearch(new Event("submit") as any);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear el registro", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setEditTouched(true);
    if (!editForm.date || !editForm.hour) return;
    setLoadingAction(true);
    const datetime = `${editForm.date} ${editForm.hour}:00`;
    try {
      await updateRecord({ id: recordToEdit.id, date_time: datetime });
      toast.current?.show({ severity: "success", summary: "Registro actualizado" });
      setRecordToEdit(null);
      setRecords((prev) => prev.map((r) => r.id === recordToEdit.id ? { ...r, date_time: datetime } : r));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo actualizar el registro", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDelete() {
    if (!recordToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteRecord(recordToDelete.id);
      setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      toast.current?.show({ severity: "success", summary: "Registro eliminado" });
      setRecordToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar el registro" }); }
    finally { setLoadingDelete(false); }
  }

  function openEdit(record: any) {
    const parts = record.date_time?.split(" ");
    setEditForm({ date: parts?.[0] ?? "", hour: parts?.[1]?.substring(0, 5) ?? "" });
    setEditTouched(false);
    setRecordToEdit(record);
  }

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Registros de marcaciones</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Marcaciones</li>
            </ol>
          </div>
        </div>

        {/* Filter form */}
        <div className="card">
          <div className="card-body">
            <form className="row" onSubmit={handleSearch} noValidate>
              <div className="form-group col-12 col-md-3">
                <label><small>Fecha desde *</small></label>
                <input type="date" className="form-control form-control-sm" value={filters.date_from} onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))} />
                {touched && !filters.date_from && <small className="text-danger">* Obligatorio</small>}
              </div>
              <div className="form-group col-12 col-md-3">
                <label><small>Fecha hasta *</small></label>
                <input type="date" className="form-control form-control-sm" value={filters.date_to} onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))} />
                {touched && !filters.date_to && <small className="text-danger">* Obligatorio</small>}
              </div>
              <div className="form-group col-12 col-md-2">
                <label><small>CUIL</small></label>
                <input type="text" className="form-control form-control-sm" value={filters.cuil} onChange={(e) => setFilters((p) => ({ ...p, cuil: e.target.value }))} />
              </div>
              <div className="form-group col-12 col-md-2">
                <label><small>Nombre</small></label>
                <input type="text" className="form-control form-control-sm" value={filters.name} onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group col-12 col-md-2">
                <label><small>Área</small></label>
                <input type="text" className="form-control form-control-sm" value={filters.area} onChange={(e) => setFilters((p) => ({ ...p, area: e.target.value }))} />
              </div>
              <div className="col-12 d-flex gap-2 align-items-center">
                <button disabled={loading} type="submit" className="btn btn-info btn-sm">
                  {loading ? "Buscando..." : "Buscar"}
                </button>
                <button type="button" className="btn btn-success btn-sm" onClick={() => { setCreateForm({ cuil: "", date: "", hour: "", type: "1" }); setCreateTouched(false); setShowCreate(true); }}>
                  <i className="mdi mdi-plus" /> Crear registro
                </button>
              </div>
            </form>
          </div>
        </div>

        {loading && <ProgressBar mode="indeterminate" style={{ height: "4px" }} className="mb-3" />}

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm table-striped table-hover">
                <thead>
                  <tr>
                    <th>NOMBRE</th>
                    <th>ÁREA</th>
                    <th>TIPO</th>
                    <th>FECHA/HORA</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="fadeIn animated">
                      <td><small>{r.lastname_name ?? r.person?.lastname_name}</small></td>
                      <td><small>{r.area ?? r.person?.area}</small></td>
                      <td><small>{r.type}</small></td>
                      <td><small>{r.date_time}</small></td>
                      <td>
                        {r.statusClass && (
                          <span className={`badge ${STATUS_MAP[r.statusClass]?.badge ?? "badge-secondary"}`}>
                            {STATUS_MAP[r.statusClass]?.label ?? r.statusClass}
                          </span>
                        )}
                      </td>
                      <td className="text-nowrap">
                        <i className="fa-regular fa-pen-to-square text-info pointer mr-2" onClick={() => openEdit(r)} />
                        <i className="fa-regular fa-circle-xmark text-danger pointer" onClick={() => setRecordToDelete(r)} />
                      </td>
                    </tr>
                  ))}
                  {!loading && records.length === 0 && <tr><td colSpan={6} className="text-center text-muted">Ingrese filtros y haga clic en Buscar.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog header="Crear registro de marcación" visible={showCreate} modal draggable={false} resizable={false} style={{ width: "420px" }} onHide={() => setShowCreate(false)}>
        <form onSubmit={handleCreate} noValidate>
          <div className="form-group">
            <label><small>CUIL *</small></label>
            <input type="text" className="form-control" value={createForm.cuil} onChange={(e) => setCreateForm((p) => ({ ...p, cuil: e.target.value }))} />
            {createTouched && !createForm.cuil && <small className="text-danger">* Obligatorio</small>}
          </div>
          <div className="row">
            <div className="form-group col-6">
              <label><small>Fecha *</small></label>
              <input type="date" className="form-control" value={createForm.date} onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))} />
              {createTouched && !createForm.date && <small className="text-danger">* Obligatorio</small>}
            </div>
            <div className="form-group col-6">
              <label><small>Hora *</small></label>
              <input type="time" className="form-control" value={createForm.hour} onChange={(e) => setCreateForm((p) => ({ ...p, hour: e.target.value }))} />
              {createTouched && !createForm.hour && <small className="text-danger">* Obligatorio</small>}
            </div>
          </div>
          <div className="form-group">
            <label><small>Tipo *</small></label>
            <select className="custom-select w-100" value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}>
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button disabled={loadingAction} type="submit" className="btn btn-info btn-block mt-2">
            {loadingAction ? "Creando..." : "Crear registro"}
          </button>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog header="Editar registro" visible={!!recordToEdit} modal draggable={false} resizable={false} style={{ width: "360px" }} onHide={() => setRecordToEdit(null)}>
        <form onSubmit={handleUpdate} noValidate>
          <div className="row">
            <div className="form-group col-6">
              <label><small>Fecha *</small></label>
              <input type="date" className="form-control" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} />
              {editTouched && !editForm.date && <small className="text-danger">* Obligatorio</small>}
            </div>
            <div className="form-group col-6">
              <label><small>Hora *</small></label>
              <input type="time" className="form-control" value={editForm.hour} onChange={(e) => setEditForm((p) => ({ ...p, hour: e.target.value }))} />
              {editTouched && !editForm.hour && <small className="text-danger">* Obligatorio</small>}
            </div>
          </div>
          <button disabled={loadingAction} type="submit" className="btn btn-info btn-block mt-2">
            {loadingAction ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </Dialog>

      {recordToDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Eliminar registro?</h4>
              <p className="text-muted">{recordToDelete?.date_time} — {recordToDelete?.type}</p>
              <div className="row g-2 mt-3">
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-light w-100" onClick={() => setRecordToDelete(null)}>Cancelar</button></div>
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-danger w-100" onClick={handleDelete}>{loadingDelete ? "..." : "Eliminar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
