"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Paginator } from "primereact/paginator";
import { Dialog } from "primereact/dialog";
import {
  loadExitOrders, createExitOrderRequest, cancelExitOrder, loadExitPDF,
  loadExitOrdersAdmin, updateExitOrderAdmin, deleteExitOrderAdmin,
} from "@/lib/services/exits.service";
import CreateExitAdminModal from "./CreateExitAdminModal";

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
  Officials: "Oficial", Unexpected: "Sin orden de salida", Individuals: "Particular",
  Education: "Licencia por estudio/capacitación", Health: "Salud o cuidado familiar",
  Maternity_Breastfeeding: "Lactancia - Maternidad", Guild_Meeting_Attendance: "Asamblea",
  Others_Justify: "Otras justificaciones",
};

const STATUS_DATA: Record<string, { label: string; css: string; canCancel?: boolean; canArrival?: boolean }> = {
  Waiting: { label: "Esperando llegada", css: "warning", canCancel: true, canArrival: true },
  Cancel:  { label: "Cancelado", css: "danger" },
  Done:    { label: "Finalizado", css: "success" },
  Pending: { label: "Pendiente aprobación", css: "muted", canCancel: true },
};

const STATUS_OPTIONS = [
  { value: "Waiting", label: "Esperando llegada" },
  { value: "Cancel", label: "Cancelado" },
  { value: "Done", label: "Finalizado" },
  { value: "Pending", label: "Pendiente aprobación" },
];

function mapItem(item: any) {
  const rawType = item._rawType ?? item.type;
  const rawStatus = item._rawStatus ?? item.status;
  const sd = STATUS_DATA[rawStatus] ?? {};
  return {
    ...item,
    _rawType: rawType,
    _rawStatus: rawStatus,
    type: TYPE_LABELS[rawType] ?? rawType,
    statusLabel: sd.label ?? rawStatus,
    statusCss: sd.css ?? "secondary",
    canCancel: !!sd.canCancel,
    canArrival: !!sd.canArrival,
    lastname_name: item.boss?.lastname_name ?? item.people?.lastname_name ?? item.lastname_name,
  };
}

function isAdminUser(): boolean {
  try {
    const allRoles = JSON.parse(localStorage.getItem("roles") ?? "{}");
    const roles: any[] = allRoles?.frontend_workflow?.roles ?? [];
    return roles.some((r: string) => r === "manager_informatica" || r === "manager_rrhh");
  } catch { return false; }
}

export default function ExitsPage() {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [itemsAdmin, setItemsAdmin] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ cuil: "", type: "" });
  const [touched, setTouched] = useState(false);
  const [itemToCancel, setItemToCancel] = useState<any>(null);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [totalAdmin, setTotalAdmin] = useState(0);
  const [adminPage, setAdminPage] = useState(1);
  const [adminLimit] = useState(10);
  const [adminFilters, setAdminFilters] = useState({ user_lastname: "", status: "", type: "" });
  const [userLastnameSearch, setUserLastnameSearch] = useState("");
  const [modifyItem, setModifyItem] = useState<any>(null);
  const [modifyForm, setModifyForm] = useState({ departure_hour: "", arrival_hour: "", status: "", type: "" });
  const [modifyTouched, setModifyTouched] = useState(false);
  const [loadingModify, setLoadingModify] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  useEffect(() => {
    const admin = isAdminUser();
    setIsAdmin(admin);
    loadMyExits();
    if (admin) loadAdminExits(1, adminFilters);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isAdmin) {
        const next = { ...adminFilters, user_lastname: userLastnameSearch };
        setAdminFilters(next);
        setAdminPage(1);
        loadAdminExits(1, next);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [userLastnameSearch]);

  async function loadMyExits() {
    setLoading(true);
    try {
      const raw = await loadExitOrders();
      setItems([...raw].reverse().map(mapItem));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar sus salidas", detail: err.message });
    } finally { setLoading(false); }
  }

  async function loadAdminExits(page: number, filters: any) {
    setLoadingAdmin(true);
    try {
      const resp = await loadExitOrdersAdmin({ limit: adminLimit, page }, filters);
      if (!resp.message) {
        setTotalAdmin(resp.total ?? 0);
        setItemsAdmin((resp.data ?? []).map((i: any) => mapItem({ ...i, _rawType: i.type, _rawStatus: i.status })));
      } else {
        setTotalAdmin(0); setItemsAdmin([]);
      }
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar salidas de terceros", detail: err.message });
    } finally { setLoadingAdmin(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.cuil || !form.type) return;
    setLoadingCreate(true);
    try {
      const resp = await createExitOrderRequest({ cuil: form.cuil, type: form.type });
      toast.current?.show({ severity: "success", summary: "Solicitud de salida creada" });
      if (resp.exit_order) {
        const ni = mapItem({ ...resp.exit_order, boss: resp.boss, _rawStatus: "Pending", _rawType: form.type });
        setItems((p) => [ni, ...p]);
      }
      setForm({ cuil: "", type: "" }); setTouched(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear la orden", detail: err.message });
    } finally { setLoadingCreate(false); }
  }

  async function handleCancelExit() {
    if (!itemToCancel || loadingCancel) return;
    setLoadingCancel(true);
    try {
      await cancelExitOrder(itemToCancel.id);
      setItems((p) => p.map((i) => i.id === itemToCancel.id ? mapItem({ ...i, _rawStatus: "Cancel" }) : i));
      toast.current?.show({ severity: "success", summary: "Salida cancelada" });
      setItemToCancel(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se puede cancelar la salida" }); }
    finally { setLoadingCancel(false); }
  }

  async function handleOpenPdf(exit: any) {
    if (!exit.path_end || loadingPdf) return;
    setLoadingPdf(exit.id);
    try {
      const buffer = await loadExitPDF(exit.id);
      window.open(URL.createObjectURL(new Blob([buffer], { type: "application/pdf" })));
    } catch { toast.current?.show({ severity: "error", summary: "No se encontró el PDF" }); }
    finally { setLoadingPdf(null); }
  }

  function openModify(item: any) {
    setModifyItem(item);
    setModifyForm({
      departure_hour: item.departure_hour ?? "",
      arrival_hour: item.arrival_hour ?? "",
      status: item._rawStatus ?? "",
      type: item._rawType ?? "",
    });
    setModifyTouched(false);
  }

  async function handleModify(e: React.FormEvent) {
    e.preventDefault();
    setModifyTouched(true);
    if (!modifyForm.departure_hour || !modifyForm.status || !modifyForm.type) return;
    if (modifyForm.arrival_hour && new Date(modifyForm.departure_hour) >= new Date(modifyForm.arrival_hour)) {
      toast.current?.show({ severity: "info", summary: "La hora de llegada no puede ser anterior a la hora de salida" });
      return;
    }
    setLoadingModify(true);
    const data = {
      departure_hour: modifyForm.departure_hour.replace("T", " "),
      arrival_hour: modifyForm.arrival_hour ? modifyForm.arrival_hour.replace("T", " ") : "",
      status: modifyForm.status,
      type: modifyForm.type,
    };
    try {
      await updateExitOrderAdmin([], data, String(modifyItem.id));
      setItemsAdmin((p) => p.map((i) => i.id === modifyItem.id ? mapItem({ ...i, ...data, _rawStatus: data.status, _rawType: data.type }) : i));
      toast.current?.show({ severity: "success", summary: "Salida modificada" });
      setModifyItem(null);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo modificar la salida", detail: err.message });
    } finally { setLoadingModify(false); }
  }

  async function handleDelete() {
    if (!itemToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteExitOrderAdmin(itemToDelete.id);
      setItemsAdmin((p) => p.filter((i) => i.id !== itemToDelete.id));
      toast.current?.show({ severity: "success", summary: "Orden eliminada" });
      setItemToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar la orden" }); }
    finally { setLoadingDelete(false); }
  }

  function onAdminPage(e: any) {
    const page = e.page + 1;
    setAdminPage(page);
    loadAdminExits(page, adminFilters);
  }

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
        <div className="card">
          <div className="card-body">
            <form className="row" onSubmit={handleCreate} noValidate>
              <div className="form-group col-12 col-md-5">
                <label><small>CUIL *</small></label>
                <input type="text" className="form-control form-control-sm" placeholder="Sin guiones" value={form.cuil} onChange={(e) => setForm((p) => ({ ...p, cuil: e.target.value }))} />
                {touched && !form.cuil && <small className="text-danger">* Obligatorio</small>}
              </div>
              <div className="form-group col-12 col-md-5">
                <label><small>Tipo *</small></label>
                <select className="custom-select w-100" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                  <option value=""></option>
                  {EXIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {touched && !form.type && <small className="text-danger">* Obligatorio</small>}
              </div>
              <div className="form-group col-12 col-md-2 d-flex align-items-end">
                <button disabled={loadingCreate} type="submit" className="btn btn-info w-100">
                  {loadingCreate ? "Enviando..." : "Solicitar"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* My exits table */}
        <div className="card">
          <div className="card-header"><h5>Mis salidas</h5></div>
          <div className="card-body">
            {loading && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr><th>JEFE</th><th>TIPO</th><th>SALIDA</th><th>LLEGADA</th><th>ESTADO</th><th>ACCIONES</th></tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="fadeIn animated">
                      <td><small>{i.lastname_name}</small></td>
                      <td><small>{i.type}</small></td>
                      <td><small>{i.departure_hour}</small></td>
                      <td><small>{i.arrival_hour ?? "-"}</small></td>
                      <td><span className={`badge badge-${i.statusCss}`}>{i.statusLabel}</span></td>
                      <td className="text-nowrap">
                        {i.path_end && <button className="btn btn-sm btn-light mr-1" onClick={() => handleOpenPdf(i)} disabled={loadingPdf === i.id}><i className="mdi mdi-file-pdf-box text-danger" /></button>}
                        {i.canCancel && <button className="btn btn-sm btn-danger" onClick={() => setItemToCancel(i)}><i className="mdi mdi-close-circle-outline" /></button>}
                      </td>
                    </tr>
                  ))}
                  {!loading && items.length === 0 && <tr><td colSpan={6} className="text-center text-muted">No hay ordenes de salida.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Admin table */}
        {isAdmin && (
          <div className="card mt-3">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Gestión de salidas (Admin)</h5>
              <button className="btn btn-info btn-sm" onClick={() => setShowCreateAdmin(true)}>
                Crear salida para terceros
              </button>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-12 col-md-4">
                  <input type="text" className="form-control form-control-sm" placeholder="Buscar por apellido..." value={userLastnameSearch} onChange={(e) => setUserLastnameSearch(e.target.value)} />
                </div>
                <div className="col-6 col-md-3">
                  <select className="custom-select custom-select-sm w-100" value={adminFilters.status} onChange={(e) => { const f = { ...adminFilters, status: e.target.value }; setAdminFilters(f); setAdminPage(1); loadAdminExits(1, f); }}>
                    <option value="">Estado</option>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <select className="custom-select custom-select-sm w-100" value={adminFilters.type} onChange={(e) => { const f = { ...adminFilters, type: e.target.value }; setAdminFilters(f); setAdminPage(1); loadAdminExits(1, f); }}>
                    <option value="">Tipo</option>
                    {EXIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              {loadingAdmin && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr><th>EMPLEADO</th><th>TIPO</th><th>SALIDA</th><th>LLEGADA</th><th>ESTADO</th><th>ACCIONES</th></tr>
                  </thead>
                  <tbody>
                    {itemsAdmin.map((i) => (
                      <tr key={i.id} className="fadeIn animated">
                        <td><small>{i.lastname_name}</small></td>
                        <td><small>{i.type}</small></td>
                        <td><small>{i.departure_hour}</small></td>
                        <td><small>{i.arrival_hour ?? "-"}</small></td>
                        <td><span className={`badge badge-${i.statusCss}`}>{i.statusLabel}</span></td>
                        <td className="text-nowrap">
                          {i.path_end && <button className="btn btn-sm btn-light mr-1" onClick={() => handleOpenPdf(i)} disabled={loadingPdf === i.id}><i className="mdi mdi-file-pdf-box text-danger" /></button>}
                          <button className="btn btn-sm btn-info mr-1" onClick={() => openModify(i)}><i className="mdi mdi-pencil-outline" /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => setItemToDelete(i)}><i className="mdi mdi-delete-outline" /></button>
                        </td>
                      </tr>
                    ))}
                    {!loadingAdmin && itemsAdmin.length === 0 && <tr><td colSpan={6} className="text-center text-muted">No hay salidas.</td></tr>}
                  </tbody>
                </table>
              </div>
              <Paginator first={(adminPage - 1) * adminLimit} rows={adminLimit} totalRecords={totalAdmin} onPageChange={onAdminPage} />
            </div>
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {itemToCancel && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-warning mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Cancelar salida?</h4>
              <p className="text-muted">Tipo: <strong>{itemToCancel?.type}</strong></p>
              <div className="row g-2 mt-3">
                <div className="col-6"><button disabled={loadingCancel} className="btn btn-light w-100" onClick={() => setItemToCancel(null)}>No</button></div>
                <div className="col-6"><button disabled={loadingCancel} className="btn btn-warning w-100" onClick={handleCancelExit}>{loadingCancel ? "..." : "Sí, cancelar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Dialog */}
      <Dialog header="Modificar salida" visible={!!modifyItem} modal draggable={false} resizable={false} style={{ width: "480px" }} onHide={() => setModifyItem(null)}>
        <form onSubmit={handleModify} noValidate>
          <div className="row">
            <div className="form-group col-12 col-md-6">
              <label><small>Hora de salida *</small></label>
              <input type="datetime-local" className="form-control" value={modifyForm.departure_hour} onChange={(e) => setModifyForm((p) => ({ ...p, departure_hour: e.target.value }))} />
              {modifyTouched && !modifyForm.departure_hour && <small className="text-danger">* Obligatorio</small>}
            </div>
            <div className="form-group col-12 col-md-6">
              <label><small>Hora de llegada</small></label>
              <input type="datetime-local" className="form-control" value={modifyForm.arrival_hour} onChange={(e) => setModifyForm((p) => ({ ...p, arrival_hour: e.target.value }))} />
            </div>
            <div className="form-group col-12 col-md-6">
              <label><small>Estado *</small></label>
              <select className="custom-select w-100" value={modifyForm.status} onChange={(e) => setModifyForm((p) => ({ ...p, status: e.target.value }))}>
                <option value=""></option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {modifyTouched && !modifyForm.status && <small className="text-danger">* Obligatorio</small>}
            </div>
            <div className="form-group col-12 col-md-6">
              <label><small>Tipo *</small></label>
              <select className="custom-select w-100" value={modifyForm.type} onChange={(e) => setModifyForm((p) => ({ ...p, type: e.target.value }))}>
                <option value=""></option>
                {EXIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {modifyTouched && !modifyForm.type && <small className="text-danger">* Obligatorio</small>}
            </div>
          </div>
          <button disabled={loadingModify} type="submit" className="btn btn-info btn-block mt-2">
            {loadingModify ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </Dialog>

      {/* Create exit admin modal */}
      <CreateExitAdminModal
        isOpen={showCreateAdmin}
        onHide={() => setShowCreateAdmin(false)}
        onCreated={(exitOrder) => {
          setItemsAdmin((p) => [mapItem({ ...exitOrder, _rawType: exitOrder.type, _rawStatus: exitOrder.status }), ...p]);
        }}
      />

      {/* Delete modal */}
      {itemToDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Eliminar orden de salida?</h4>
              <p className="text-muted">{itemToDelete?.type}</p>
              <div className="row g-2 mt-3">
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-light w-100" onClick={() => setItemToDelete(null)}>Cancelar</button></div>
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-danger w-100" onClick={handleDelete}>{loadingDelete ? "..." : "Eliminar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
