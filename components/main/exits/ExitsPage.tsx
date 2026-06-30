"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Paginator } from "primereact/paginator";
import { getAllBosses } from "@/lib/services/boss.service";
import {
  loadExitOrders,
  createExitOrderRequest,
  cancelExitOrder,
  loadExitPDF,
  loadExitOrdersAdmin,
  updateExitOrderAdmin,
  deleteExitOrderAdmin,
} from "@/lib/services/exits.service";
import CreateExitAdminModal from "./CreateExitAdminModal";

// ── Constants ──────────────────────────────────────────────────────────────────

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

// Display label → English key (for the modify form)
const TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_LABELS).map(([k, v]) => [v, k])
);

const EXIT_TYPE_OPTIONS = [
  { value: "Unexpected",              label: "Sin órden de salida" },
  { value: "Individuals",             label: "Particular" },
  { value: "Officials",               label: "Oficial" },
  { value: "Guild_Meeting_Attendance",label: "Asamblea" },
  { value: "Education",               label: "Licencia por estudio/capacitación" },
  { value: "Health",                  label: "Salud o cuidado familiar" },
  { value: "Maternity_Breastfeeding", label: "Lactancia - Maternidad" },
  { value: "Others_Justify",          label: "Otras justificaciones" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapItem(item: any): any {
  const rawType   = item._rawType   ?? item.type;
  const rawStatus = item._rawStatus ?? item.status;

  let cls = "", statusLabel = rawStatus, statusEnglish = rawStatus;
  let canArrival = false, canShowPdf = false, canCancel = false, canModificate = false;

  switch (rawStatus) {
    case "Waiting":
      cls = "warning"; statusLabel = "Esperando llegada"; statusEnglish = "Waiting";
      canArrival = true; canShowPdf = true; canCancel = true; canModificate = true; break;
    case "Cancel":
      cls = "danger";  statusLabel = "Cancelado";          statusEnglish = "Cancel";
      canShowPdf = true; canModificate = true; break;
    case "Done":
      cls = "success"; statusLabel = "Finalizado";          statusEnglish = "Done";
      canShowPdf = true; canModificate = true; break;
    case "Pending":
      cls = "muted";   statusLabel = "Pendiente aprobación"; statusEnglish = "Pending";
      canShowPdf = true; canCancel = true; canModificate = true; break;
  }

  return {
    ...item,
    _rawType: rawType,
    _rawStatus: rawStatus,
    type: TYPE_LABELS[rawType] ?? rawType,
    class: cls,
    status: statusLabel,
    statusEnglish,
    canArrival, canShowPdf, canCancel, canModificate,
    lastname_name: item.boss?.lastname_name ?? item.people?.lastname_name ?? item.lastname_name ?? "",
  };
}

function isAdminUser(): boolean {
  try {
    const roles: string[] = JSON.parse(localStorage.getItem("roles") ?? "{}")?.frontend_workflow?.roles ?? [];
    return roles.some((r) => r === "manager_informatica" || r === "manager_rrhh");
  } catch { return false; }
}

function formatDate(str: string | null | undefined): string {
  if (!str) return "--";
  try {
    return new Date(str).toLocaleString("es-AR", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return str; }
}

type AdminFilters = { limit: number; page: number; status: string; type: string; user_lastname: string };

// ── Component ──────────────────────────────────────────────────────────────────

export default function ExitsPage() {
  const toast       = useRef<Toast>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to always have the latest admin filters inside async/debounce callbacks
  const adminFiltersRef = useRef<AdminFilters>({ limit: 10, page: 1, status: "", type: "", user_lastname: "" });

  // Bosses + create form
  const [bosses,              setBosses]              = useState<any[]>([]);
  const [formType,            setFormType]            = useState("");
  const [formCuil,            setFormCuil]            = useState("");
  const [cuilTouched,         setCuilTouched]         = useState(false);
  const [loadingActionCreate, setLoadingActionCreate] = useState(false);

  // My exits
  const [items,           setItems]           = useState<any[]>([]);
  const [loadingExits,    setLoadingExits]    = useState(false);
  const [filtersForExists, setFiltersForExists] = useState({ lastname_name: "", status: "", type: "" });

  // PDF
  const [idSelectedExitForViewPDF,    setIdSelectedExitForViewPDF]    = useState<number | null>(null);
  const [isLoadingActionOpenPdfExit,  setIsLoadingActionOpenPdfExit]  = useState(false);

  // Cancel
  const [isOpenModalCancelExit,   setIsOpenModalCancelExit]   = useState(false);
  const [loadingActionCancelExit, setLoadingActionCancelExit] = useState(false);

  // Admin exits
  const [isAdmin,         setIsAdmin]         = useState(false);
  const [itemsAdmin,      setItemsAdmin]      = useState<any[]>([]);
  const [loadingExitsAdmin, setLoadingExitsAdmin] = useState(false);
  const [totalExitsAdmin, setTotalExitsAdmin] = useState(0);
  const [adminFilters,    setAdminFilters]    = useState<AdminFilters>({ limit: 10, page: 1, status: "", type: "", user_lastname: "" });
  const [paginatorFirst,  setPaginatorFirst]  = useState(0);

  // Modify
  const [showModalModificateItem,    setShowModalModificateItem]    = useState(false);
  const [loadingActionModificateItem, setLoadingActionModificateItem] = useState(false);
  const [modifyForm,      setModifyForm]      = useState({ status: "", type: "", departure_hour: "", arrival_hour: "" });
  const [modifyTouched,   setModifyTouched]   = useState(false);

  // Delete
  const [isOpenModalDeleteExitAdmin, setIsOpenModalDeleteExitAdmin] = useState(false);
  const [loadingActionDeleteItem,    setLoadingActionDeleteItem]    = useState(false);

  // Create admin modal
  const [isOpenModalCreateExitAdmin, setIsOpenModalCreateExitAdmin] = useState(false);

  // Shared selected item (cancel / modify / delete)
  const [itemSelected, setItemSelected] = useState<any>(null);

  // ── Init ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const admin = isAdminUser();
    setIsAdmin(admin);
    loadBossesData();
    loadExitsData();
    if (admin) loadExitsAdminData(adminFiltersRef.current);
    const t = setInterval(loadExitsData, 300_000);
    return () => clearInterval(t);
  }, []);

  // ── Data loaders ──────────────────────────────────────────────────────────────

  async function loadBossesData() {
    try {
      const resp = await getAllBosses();
      const userCuil = localStorage.getItem("user");
      const list: any[] = Object.values(resp.bosses ?? {}).filter(
        (b: any) =>
          b.occupation_signature !== "Vocal" &&
          b.occupation_signature !== "Presidente" &&
          b.cuil !== userCuil
      );
      setBosses(list);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar los jefes", detail: err.message });
    }
  }

  async function loadExitsData() {
    setLoadingExits(true);
    try {
      const raw = await loadExitOrders();
      setItems((Array.isArray(raw) ? [...raw].reverse() : []).map(mapItem));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar sus salidas", detail: err.message });
    } finally { setLoadingExits(false); }
  }

  async function loadExitsAdminData(filters: AdminFilters) {
    setLoadingExitsAdmin(true);
    try {
      const resp = await loadExitOrdersAdmin({ limit: filters.limit, page: filters.page }, filters);
      if (!resp.message) {
        setTotalExitsAdmin(resp.total ?? 0);
        setItemsAdmin((resp.data ?? []).map((i: any) => mapItem({ ...i, _rawType: i.type, _rawStatus: i.status })));
      } else {
        setTotalExitsAdmin(0);
        setItemsAdmin([]);
      }
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar salidas solicitadas por terceros", detail: err.message });
    } finally { setLoadingExitsAdmin(false); }
  }

  // ── Create exit ───────────────────────────────────────────────────────────────

  function changeTypeOfExit(type: string) {
    setFormType(type);
    setFormCuil("");
    setCuilTouched(false);
  }

  async function create() {
    setCuilTouched(true);
    if (!formCuil || !formType) return;
    setLoadingActionCreate(true);
    try {
      const resp = await createExitOrderRequest({ cuil: formCuil, type: formType });
      toast.current?.show({ severity: "success", summary: "Solicitud de salida creada" });
      if (resp.exit_order) {
        setItems((p) => [mapItem({ ...resp.exit_order, boss: resp.boss, _rawStatus: "Pending", _rawType: formType }), ...p]);
      }
      setFormType("");
      setFormCuil("");
      setCuilTouched(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear la orden", detail: err.message });
    } finally { setLoadingActionCreate(false); }
  }

  // ── Filters ───────────────────────────────────────────────────────────────────

  function setFilter(e: React.ChangeEvent<HTMLInputElement>, field: string) {
    setFiltersForExists((p) => ({ ...p, [field]: e.target.value }));
  }

  function setFilterAdmin(e: React.ChangeEvent<HTMLSelectElement>, field: string) {
    const next = { ...adminFiltersRef.current, [field]: e.target.value, page: 1 };
    adminFiltersRef.current = next;
    setAdminFilters(next);
    setPaginatorFirst(0);
    loadExitsAdminData(next);
  }

  function handleUserLastnameFilter(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = { ...adminFiltersRef.current, user_lastname: value, page: 1 };
      adminFiltersRef.current = next;
      setAdminFilters(next);
      setPaginatorFirst(0);
      loadExitsAdminData(next);
    }, 500);
  }

  // ── PDF ───────────────────────────────────────────────────────────────────────

  async function openPdfExit(exit: any) {
    setIdSelectedExitForViewPDF(exit.id);
    if (isLoadingActionOpenPdfExit) return;
    if (!exit.path_end) {
      setIdSelectedExitForViewPDF(null);
      toast.current?.show({ severity: "error", summary: "No se encontró el PDF" });
      return;
    }
    setIsLoadingActionOpenPdfExit(true);
    try {
      const buffer = await loadExitPDF(exit.id);
      window.open(URL.createObjectURL(new Blob([buffer], { type: "application/pdf" })));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se encontró el PDF" });
    } finally {
      setIdSelectedExitForViewPDF(null);
      setIsLoadingActionOpenPdfExit(false);
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────────

  function openModalCancelExit(exit: any) {
    setItemSelected(exit);
    setIsOpenModalCancelExit(true);
  }

  function closeModalCancelExit() {
    setItemSelected(null);
    setIsOpenModalCancelExit(false);
  }

  async function cancelExit() {
    if (loadingActionCancelExit) return;
    setLoadingActionCancelExit(true);
    try {
      await cancelExitOrder(itemSelected.id);
      toast.current?.show({ severity: "success", summary: "Salida cancelada" });
      setItems((p) => p.map((i) => i.id === itemSelected.id ? mapItem({ ...i, _rawStatus: "Cancel" }) : i));
      closeModalCancelExit();
    } catch {
      toast.current?.show({ severity: "error", summary: "No se puede cancelar la salida" });
    } finally { setLoadingActionCancelExit(false); }
  }

  // ── Modify ────────────────────────────────────────────────────────────────────

  function openModalModificateItem(item: any) {
    setItemSelected(item);
    setModifyForm({
      departure_hour: item.departure_hour ?? "",
      arrival_hour:   item.arrival_hour   ?? "",
      status:         item.statusEnglish  ?? "",
      type:           TYPE_REVERSE[item.type] ?? item._rawType ?? "",
    });
    setModifyTouched(false);
    setShowModalModificateItem(true);
  }

  function closeModalModificateItem() {
    setItemSelected(null);
    setModifyForm({ status: "", type: "", departure_hour: "", arrival_hour: "" });
    setShowModalModificateItem(false);
  }

  async function modificateItem() {
    setModifyTouched(true);
    if (!modifyForm.departure_hour || !modifyForm.status || !modifyForm.type) return;
    if (modifyForm.arrival_hour && new Date(modifyForm.departure_hour) >= new Date(modifyForm.arrival_hour)) {
      toast.current?.show({ severity: "info", summary: "La hora de llegada no puede ser anterior a la hora de salida" });
      return;
    }
    setLoadingActionModificateItem(true);
    const data = {
      departure_hour: modifyForm.departure_hour.replace("T", " "),
      arrival_hour:   modifyForm.arrival_hour ? modifyForm.arrival_hour.replace("T", " ") : "",
      status: modifyForm.status,
      type:   modifyForm.type,
    };
    try {
      await updateExitOrderAdmin([], data, String(itemSelected.id));
      toast.current?.show({ severity: "success", summary: "Salida modificada" });
      setItemsAdmin((p) => p.map((i) =>
        i.id === itemSelected.id
          ? mapItem({ ...i, ...data, _rawStatus: data.status, _rawType: data.type })
          : i
      ));
      closeModalModificateItem();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo modificar la salida", detail: err.message });
    } finally { setLoadingActionModificateItem(false); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  function openModalDeleteItem(item: any) {
    setItemSelected(item);
    setIsOpenModalDeleteExitAdmin(true);
  }

  async function deleteItem() {
    if (loadingActionDeleteItem) return;
    setLoadingActionDeleteItem(true);
    try {
      await deleteExitOrderAdmin(itemSelected.id);
      setItemsAdmin((p) => p.filter((i) => i.id !== itemSelected.id));
      toast.current?.show({ severity: "success", summary: "Orden eliminada" });
      setIsOpenModalDeleteExitAdmin(false);
      setItemSelected(null);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar la orden" });
    } finally { setLoadingActionDeleteItem(false); }
  }

  // ── Pagination ────────────────────────────────────────────────────────────────

  function pageChange(event: any) {
    const next = { ...adminFiltersRef.current, limit: Number(event.rows), page: Number(event.page + 1) };
    adminFiltersRef.current = next;
    setAdminFilters(next);
    setPaginatorFirst(event.first);
    loadExitsAdminData(next);
  }

  // ── Client-side filter (equivalent to exitsOrder2 pipe) ───────────────────────

  const filteredItems = items.filter((item) => {
    if (filtersForExists.type         && !item.type.toLowerCase().includes(filtersForExists.type.toLowerCase()))               return false;
    if (filtersForExists.lastname_name && !item.lastname_name?.toLowerCase().includes(filtersForExists.lastname_name.toLowerCase())) return false;
    if (filtersForExists.status       && !item.status.toLowerCase().includes(filtersForExists.status.toLowerCase()))           return false;
    return true;
  });

  // ── JSX ───────────────────────────────────────────────────────────────────────

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="animated fadeIn">

        {/* Page titles */}
        <div className="row page-titles">
          <div className="align-self-center col-md-5">
            <h3 className="text-themecolor">Salidas</h3>
          </div>
          <div className="align-self-center col-md-7">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Salidas</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="card card-body">

              {/* ── Creación de salida ──────────────────────────────────────── */}
              <div className="row">
                <div className="col-12">
                  <h5 className="h5">Creación de salida</h5>

                  <div className="d-flex justify-content-center row animated fadeIn">
                    <div className="col-12">
                      <div className="form-group text-center">
                        <label>Seleccione el tipo de salida</label>

                        <div className="row d-flex justify-content-around">
                          {([
                            { value: "Individuals",              label: "Particular" },
                            { value: "Officials",                label: "Oficial" },
                            { value: "Guild_Meeting_Attendance", label: "Asamblea" },
                          ] as const).map((t) => (
                            <div
                              key={t.value}
                              onClick={() => changeTypeOfExit(t.value)}
                              className={`d-flex col-12 col-lg-3 pt-3 pt-lg-0 justify-content-center align-items-center text-center text-white pointer ${formType === t.value ? "bg-info" : "bg-secondary"}`}
                              style={{ height: 50, cursor: "pointer" }}
                            >
                              <strong>{t.label}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="my-2 row">
                <div className="col-12"><hr /></div>
              </div>

              {/* ── Mis salidas ─────────────────────────────────────────────── */}
              <div className="animated fadeIn mb-5 mt-3 row">
                <div className="col-12">
                  <h5 className="h5">
                    {loadingExits ? "Cargando mis salidas" : "Mis salidas"}
                  </h5>

                  <div className="table-responsive">
                    <table className="table table-sm table-striped p-datatable-sm p-datatable-striped">
                      <thead>
                        <tr>
                          <th>TIPO</th>
                          <th>SOLICITADO A</th>
                          <th>ESTADO</th>
                          <th>HORA SALIDA</th>
                          <th>HORA LLEGADA</th>
                          <th>ACCIONES</th>
                        </tr>
                        <tr>
                          <th><input className="form-control form-control-sm" type="text" onChange={(e) => setFilter(e, "type")} /></th>
                          <th><input className="form-control form-control-sm" type="text" onChange={(e) => setFilter(e, "lastname_name")} /></th>
                          <th><input className="form-control form-control-sm" type="text" onChange={(e) => setFilter(e, "status")} /></th>
                          <th /><th /><th />
                        </tr>
                      </thead>
                      <tbody>
                        {loadingExits && (
                          <tr><td colSpan={6} className="text-center py-3"><i className="pi pi-spin pi-spinner" /></td></tr>
                        )}
                        {!loadingExits && filteredItems.length === 0 && (
                          <tr><td colSpan={6} className="text-center text-muted py-3">No hay salidas registradas.</td></tr>
                        )}
                        {filteredItems.map((item) => (
                          <tr key={item.id}>
                            <td><small>{item.type}</small></td>
                            <td><small>{item.lastname_name}</small></td>
                            <td>
                              <span className={`pointer p-1 status-${item.class}`}>
                                <small>{item.status}</small>
                              </span>
                            </td>
                            <td><small>{formatDate(item.departure_hour)}</small></td>
                            <td><small>{formatDate(item.arrival_hour)}</small></td>
                            <td>
                              {item.canShowPdf && (
                                <i
                                  onClick={() => openPdfExit(item)}
                                  className={`pointer text-dark ${isLoadingActionOpenPdfExit && idSelectedExitForViewPDF === item.id ? "pi pi-spin pi-spinner" : "fa-regular fa-file-pdf"}`}
                                  aria-hidden="true"
                                  title="Visualizar PDF"
                                  style={{ margin: "0 5px" }}
                                />
                              )}
                              {item.canCancel && (
                                <i
                                  onClick={() => openModalCancelExit(item)}
                                  className="fa-regular fa-circle-xmark pointer text-danger"
                                  aria-hidden="true"
                                  title="Cancelar salida"
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Admin section ───────────────────────────────────────────── */}
              {isAdmin && (
                <div className="animated fadeIn row">
                  <div className="col-12">
                    <h5 className="h5">
                      {loadingExitsAdmin
                        ? "Cargando salidas solicitadas por terceros"
                        : "Salidas solicitadas por terceros"}
                    </h5>

                    <button
                      className="btn btn-info mb-3 mt-2"
                      onClick={() => setIsOpenModalCreateExitAdmin(true)}
                    >
                      Crear salida para terceros
                    </button>

                    <div className="table-responsive">
                      <table className="table table-sm table-striped animate__animated animate__fadeIn p-datatable-sm p-datatable-striped">
                        <thead>
                          <tr>
                            <th>SOLICITADA POR</th>
                            <th>ESTADO</th>
                            <th>TIPO</th>
                            <th>HORA SALIDA</th>
                            <th>HORA LLEGADA</th>
                            <th>ACCIONES</th>
                          </tr>
                          <tr>
                            <th>
                              <input
                                className="form-control form-control-sm"
                                type="text"
                                onChange={handleUserLastnameFilter}
                              />
                            </th>
                            <th>
                              <select
                                className="form-control form-control-sm"
                                onChange={(e) => setFilterAdmin(e, "status")}
                              >
                                <option value=""></option>
                                <option value="Pending">Pendiente de aprobación</option>
                                <option value="Waiting">En espera</option>
                                <option value="Done">Finalizado</option>
                                <option value="Cancel">Cancelado</option>
                              </select>
                            </th>
                            <th>
                              <select
                                className="form-control form-control-sm"
                                onChange={(e) => setFilterAdmin(e, "type")}
                              >
                                <option value=""></option>
                                {EXIT_TYPE_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </th>
                            <th /><th /><th />
                          </tr>
                        </thead>
                        <tbody>
                          {loadingExitsAdmin && (
                            <tr><td colSpan={6} className="text-center py-3"><i className="pi pi-spin pi-spinner" /></td></tr>
                          )}
                          {!loadingExitsAdmin && itemsAdmin.length === 0 && (
                            <tr><td colSpan={6} className="text-center text-muted py-3">No hay salidas registradas.</td></tr>
                          )}
                          {itemsAdmin.map((item) => (
                            <tr key={item.id}>
                              <td><small>{item.lastname_name}</small></td>
                              <td>
                                <span className={`pointer p-1 status-${item.class}`}>
                                  <small>{item.status}</small>
                                </span>
                              </td>
                              <td><small>{item.type}</small></td>
                              <td><small>{formatDate(item.departure_hour)}</small></td>
                              <td><small>{formatDate(item.arrival_hour)}</small></td>
                              <td>
                                {item.canShowPdf && (
                                  <i
                                    onClick={() => openPdfExit(item)}
                                    className={`pointer text-dark ${isLoadingActionOpenPdfExit && idSelectedExitForViewPDF === item.id ? "pi pi-spin pi-spinner" : "fa-regular fa-file-pdf"}`}
                                    aria-hidden="true"
                                    title="Visualizar PDF"
                                    style={{ marginRight: "7.5px" }}
                                  />
                                )}
                                {item.canModificate && (
                                  <i
                                    onClick={() => openModalModificateItem(item)}
                                    className="fa fa-pencil-square-o pointer text-primary"
                                    aria-hidden="true"
                                    title="Modificar"
                                    style={{ marginRight: "2.5px" }}
                                  />
                                )}
                                <i
                                  onClick={() => openModalDeleteItem(item)}
                                  className="fa-regular fa-circle-xmark mx-1 pointer text-danger"
                                  aria-hidden="true"
                                  title="Eliminar"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="col-12">
                      <Paginator
                        first={paginatorFirst}
                        rows={adminFilters.limit}
                        totalRecords={totalExitsAdmin}
                        pageLinkSize={3}
                        rowsPerPageOptions={[10]}
                        onPageChange={pageChange}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Boss selection dialog ─────────────────────────────────────────────── */}
      <Dialog
        header=""
        visible={formType !== ""}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "50vw" }}
        onHide={() => setFormType("")}
      >
        <div className="row">
          {formType && (
            <div className="animated fadeIn col-12">
              <div className="form-group text-center">
                <label>Seleccione su jefe</label>

                <select
                  className="form-control form-control-sm custom-select"
                  value={formCuil}
                  onChange={(e) => setFormCuil(e.target.value)}
                >
                  <option value=""></option>
                  {bosses.map((boss) => (
                    <option key={boss.cuil} value={boss.cuil}>{boss.lastname_name}</option>
                  ))}
                </select>

                {cuilTouched && !formCuil && (
                  <div className="animated fadeIn text-danger text-left d-flex flex-column" role="alert">
                    <small className="m-0 animated fadeIn">* Campo obligatorio</small>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="col-12 d-flex justify-content-end">
            <button
              onClick={create}
              disabled={loadingActionCreate}
              type="button"
              className="btn btn-info mr-2"
            >
              {!loadingActionCreate ? "Aceptar" : "Solicitando salida"}
            </button>
            <button
              onClick={() => setFormType("")}
              type="button"
              className="btn"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Dialog>

      {/* ── Modify dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        header={`Modificar salida de ${itemSelected?.lastname_name ?? ""}`}
        visible={showModalModificateItem}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "90vw" }}
        onHide={closeModalModificateItem}
        footer={
          <div>
            <button
              disabled={loadingActionModificateItem || !modifyForm.status || !modifyForm.type}
              onClick={modificateItem}
              type="button"
              className="btn btn-primary p-button-raised mr-2"
            >
              {!loadingActionModificateItem ? "Modificar" : "Modificando"}
            </button>
            <button
              disabled={loadingActionModificateItem}
              type="button"
              onClick={closeModalModificateItem}
              className="btn btn-light"
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="row">
          <div className="col-12">
            <div className="row animated fadeIn">

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    className="form-control form-control-sm custom-select"
                    value={modifyForm.status}
                    onChange={(e) => setModifyForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="Pending">Pendiente de aprobación</option>
                    <option value="Waiting">En espera</option>
                    <option value="Done">Finalizado</option>
                    <option value="Cancel">Cancelado</option>
                  </select>
                  {modifyTouched && !modifyForm.status && (
                    <div className="animated fadeIn text-danger text-left d-flex flex-column" role="alert">
                      <small className="m-0 animated fadeIn">* Campo obligatorio</small>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="form-group">
                  <label>Tipo de salida</label>
                  <select
                    className="form-control form-control-sm custom-select"
                    value={modifyForm.type}
                    onChange={(e) => setModifyForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value=""></option>
                    {EXIT_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {modifyTouched && !modifyForm.type && (
                    <div className="animated fadeIn text-danger text-left d-flex flex-column" role="alert">
                      <small className="m-0 animated fadeIn">* Campo obligatorio</small>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </Dialog>

      {/* ── Cancel dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        header="¿Cancelar orden de salida?"
        visible={isOpenModalCancelExit}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "65vw" }}
        onHide={closeModalCancelExit}
        footer={
          <div>
            <button
              disabled={loadingActionCancelExit}
              onClick={cancelExit}
              type="button"
              className="btn btn-danger p-button-raised mr-2"
            >
              {!loadingActionCancelExit ? "Si" : "Cancelando"}
            </button>
            <button
              disabled={loadingActionCancelExit}
              type="button"
              onClick={closeModalCancelExit}
              className="btn btn-light"
            >
              No
            </button>
          </div>
        }
      >
        <span />
      </Dialog>

      {/* ── Delete dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        header="¿Eliminar orden de salida?"
        visible={isOpenModalDeleteExitAdmin}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "50vw" }}
        onHide={() => { setIsOpenModalDeleteExitAdmin(false); setItemSelected(null); }}
        footer={
          <div>
            <button
              disabled={loadingActionDeleteItem}
              onClick={deleteItem}
              type="button"
              className="btn btn-danger p-button-raised mr-2"
            >
              {!loadingActionDeleteItem ? "Si" : "Eliminando"}
            </button>
            <button
              disabled={loadingActionDeleteItem}
              type="button"
              onClick={() => { setIsOpenModalDeleteExitAdmin(false); setItemSelected(null); }}
              className="btn btn-light"
            >
              No
            </button>
          </div>
        }
      >
        <span />
      </Dialog>

      {/* ── CreateExitAdminModal ──────────────────────────────────────────────── */}
      <CreateExitAdminModal
        isOpen={isOpenModalCreateExitAdmin}
        onHide={() => setIsOpenModalCreateExitAdmin(false)}
        onCreated={(exitOrder) => {
          setItemsAdmin((p) => [mapItem({ ...exitOrder, _rawType: exitOrder.type, _rawStatus: exitOrder.status }), ...p]);
        }}
      />
    </>
  );
}
