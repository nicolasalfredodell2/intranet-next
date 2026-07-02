"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { listAreas, createArea, modificateArea, deleteArea, disableArea } from "@/lib/services/areas.service";
import AreaInfoModal from "./AreaInfoModal";

interface AreaForm { title: string; description: string; }

export default function AreasPage() {
  const toast = useRef<Toast>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [form, setForm] = useState<AreaForm>({ title: "", description: "" });
  const [touched, setTouched] = useState(false);
  const [areaParaModificar, setAreaParaModificar] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [areaToDisable, setAreaToDisable] = useState<any>(null);
  const [loadingDisable, setLoadingDisable] = useState(false);
  const [areaForInfo, setAreaForInfo] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (loading) return;
    setLoading(true);
    try {
      setAreas(await listAreas());
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar las areas" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.title || !form.description) return;
    setLoadingAction(true);
    try {
      if (areaParaModificar) {
        const resp = await modificateArea(form, areaParaModificar.id);
        setAreas((prev) => prev.map((a) => a.id === areaParaModificar.id ? resp.data : a));
        toast.current?.show({ severity: "success", summary: "Area modificada" });
      } else {
        const resp = await createArea(form);
        setAreas((prev) => [...prev, resp.data]);
        toast.current?.show({ severity: "success", summary: "Area creada" });
      }
      setForm({ title: "", description: "" });
      setAreaParaModificar(null);
      setTouched(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function llenarFormulario(area: any) {
    setAreaParaModificar(area);
    setForm({ title: area.title, description: area.description });
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiar() {
    setForm({ title: "", description: "" });
    setAreaParaModificar(null);
    setTouched(false);
  }

  async function confirmarEliminacion() {
    if (!areaToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteArea(areaToDelete.id);
      setAreas((prev) => prev.filter((a) => a.id !== areaToDelete.id));
      toast.current?.show({ severity: "success", summary: "Area eliminada" });
      setShowDeleteModal(false);
      setAreaToDelete(null);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar el area" });
    } finally {
      setLoadingDelete(false);
    }
  }

  async function confirmarDeshabilitacion() {
    if (!areaToDisable) return;
    setLoadingDisable(true);
    try {
      await disableArea(areaToDisable.id);
      setAreas((prev) => prev.filter((a) => a.id !== areaToDisable.id));
      toast.current?.show({ severity: "success", summary: "Area deshabilitada" });
      setShowDisableModal(false);
      setAreaToDisable(null);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo deshabilitar el area" });
    } finally {
      setLoadingDisable(false);
    }
  }

  const filtered = searchTerm
    ? areas.filter((a) => a.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : areas;

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">{areaParaModificar ? "Modificación de area" : "Subida de area"}</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">{areaParaModificar ? "Modificación de area" : "Subida de area"}</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
                  <div className="fadeIn animated form-group">
                    <label className="col-md-12"><small>Título *</small></label>
                    <div className="col-md-12">
                      <input
                        type="text"
                        className="form-control form-control-line form-control-sm"
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      />
                      {touched && !form.title && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                    </div>
                  </div>

                  <div className="fadeIn animated form-group">
                    <label className="col-md-12"><small>Descripción *</small></label>
                    <div className="col-md-12">
                      <input
                        type="text"
                        className="form-control form-control-line form-control-sm"
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      />
                      {touched && !form.description && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                    </div>
                  </div>

                  <div className="fadeIn animated form-group mt-5">
                    <div className="row">
                      <div className="col-6">
                        {!loading && (
                          <button disabled={loadingAction} type="submit" className="btn btn-block btn-info">
                            {areaParaModificar
                              ? (loadingAction ? "MODIFICANDO" : "MODIFICAR")
                              : (loadingAction ? "CREANDO AREA" : "CREAR AREA")}
                          </button>
                        )}
                      </div>
                      <div className="col-6">
                        <button type="button" disabled={loadingAction} className="btn btn-block btn-muted" onClick={limpiar}>Limpiar</button>
                      </div>
                    </div>
                  </div>

                  {(loadingAction || loading) && (
                    <div className="row mt-2">
                      <div className="col-12">
                        <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* List section */}
        <div className="container-fluid py-4">
          {(areas.length > 0 || searchTerm) && (
            <div className="row mb-4 fadeIn animated">
              <div className="col-12 col-md-6 mx-auto mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar área por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="row">
            {filtered.map((area) => (
              <div key={area.id} className="col-12 col-md-6 col-lg-4 fadeIn animated mb-4">
                <div className="card h-100">
                  <div className="card-body d-flex flex-column p-4">
                    <div className="mb-4">
                      <h5>{area.title}</h5>
                      <p className="text-muted">{area.description}</p>
                    </div>
                    <div className="mt-auto pt-3 border-top d-flex flex-wrap justify-content-between" style={{ gap: "6px" }}>
                      <button onClick={() => setAreaForInfo(area)} className="btn btn-sm btn-primary">
                        <i className="mdi mdi-information-outline" /> Info
                      </button>
                      <button onClick={() => llenarFormulario(area)} className="btn btn-sm btn-info">
                        <i className="mdi mdi-pencil-outline" /> Editar
                      </button>
                      <button onClick={() => { setAreaToDisable(area); setShowDisableModal(true); }} className="btn btn-sm btn-secondary">
                        <i className="mdi mdi-eye-off-outline" /> Deshabilitar
                      </button>
                      <button onClick={() => { setAreaToDelete(area); setShowDeleteModal(true); }} className="btn btn-sm btn-danger">
                        <i className="mdi mdi-trash-can-outline" /> Borrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="text-center py-5 fadeIn animated">
              <i className="pi pi-spin pi-spinner mr-2" /> Cargando áreas...
            </div>
          )}
          {areas.length === 0 && !loading && (
            <div className="text-center py-5 fadeIn animated text-muted">No hay áreas disponibles para mostrar</div>
          )}
          {areas.length > 0 && filtered.length === 0 && !loading && (
            <div className="text-center py-5 fadeIn animated text-muted">
              No se encontraron áreas con el título &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Confirmar eliminación?</h4>
              <p className="text-muted">Está a punto de eliminar el area <strong>&quot;{areaToDelete?.title}&quot;</strong>. Esta acción no se puede deshacer.</p>
              <div className="row g-2 mt-4">
                <div className="col-6">
                  <button disabled={loadingDelete} className="btn btn-light w-100" onClick={() => { setShowDeleteModal(false); setAreaToDelete(null); }}>Cancelar</button>
                </div>
                <div className="col-6">
                  <button disabled={loadingDelete} className="btn btn-danger w-100" onClick={confirmarEliminacion}>
                    {loadingDelete ? "Eliminando..." : "Sí, eliminar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable confirmation dialog */}
      {showDisableModal && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-info mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Confirmar deshabilitación?</h4>
              <p className="text-muted">Está a punto de deshabilitar el area <strong>&quot;{areaToDisable?.title}&quot;</strong>.</p>
              <div className="row g-2 mt-4">
                <div className="col-6">
                  <button disabled={loadingDisable} className="btn btn-light w-100" onClick={() => { setShowDisableModal(false); setAreaToDisable(null); }}>Cancelar</button>
                </div>
                <div className="col-6">
                  <button disabled={loadingDisable} className="btn btn-info w-100" onClick={confirmarDeshabilitacion}>
                    {loadingDisable ? "Deshabilitando..." : "Sí, deshabilitar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Area info dialog */}
      {areaForInfo && (
        <AreaInfoModal area={areaForInfo} onClose={() => setAreaForInfo(null)} />
      )}
    </>
  );
}
