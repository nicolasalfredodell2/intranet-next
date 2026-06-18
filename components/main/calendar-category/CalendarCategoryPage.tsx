"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { getCalendarCategories, createCalendarCategory, updateCalendarCategory, deleteCalendarCategory } from "@/lib/services/calendar-category.service";

export default function CalendarCategoryPage() {
  const toast = useRef<Toast>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [form, setForm] = useState({ name: "", colour: "#2196f3" });
  const [touched, setTouched] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setCategories(await getCalendarCategories()); } catch { toast.current?.show({ severity: "error", summary: "No se pudo cargar las categorías" }); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.name || !form.colour) return;
    setLoadingAction(true);
    try {
      if (categoryToEdit) {
        const resp = await updateCalendarCategory(form, categoryToEdit.id);
        setCategories((prev) => prev.map((c) => c.id === categoryToEdit.id ? resp.category ?? { ...c, ...form } : c));
        toast.current?.show({ severity: "success", summary: "Categoría modificada" });
      } else {
        const resp = await createCalendarCategory(form);
        setCategories((prev) => [...prev, resp.category ?? resp]);
        toast.current?.show({ severity: "success", summary: "Categoría creada" });
      }
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function limpiar() {
    setForm({ name: "", colour: "#2196f3" });
    setCategoryToEdit(null); setTouched(false);
  }

  async function handleDelete() {
    if (!categoryToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteCalendarCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      toast.current?.show({ severity: "success", summary: "Categoría eliminada" });
      setCategoryToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar la categoría" }); }
    finally { setLoadingDelete(false); }
  }

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Categorías de calendario</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Categorías de calendario</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-12 col-lg-5">
            <div className="card">
              <div className="card-header">
                <h5>{categoryToEdit ? "Modificar categoría" : "Nueva categoría"}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group">
                    <label><small>Nombre *</small></label>
                    <input type="text" className="form-control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    {touched && !form.name && <small className="text-danger">* Obligatorio</small>}
                  </div>
                  <div className="form-group">
                    <label><small>Color *</small></label>
                    <div className="d-flex align-items-center gap-2">
                      <input type="color" className="form-control form-control-sm" style={{ width: 60, height: 38, padding: 2 }} value={form.colour} onChange={(e) => setForm((p) => ({ ...p, colour: e.target.value }))} />
                      <input type="text" className="form-control form-control-sm" value={form.colour} onChange={(e) => setForm((p) => ({ ...p, colour: e.target.value }))} placeholder="#2196f3" />
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-6">
                      <button disabled={loadingAction} type="submit" className="btn btn-block btn-info">
                        {categoryToEdit ? (loadingAction ? "Modificando..." : "Modificar") : (loadingAction ? "Creando..." : "Crear")}
                      </button>
                    </div>
                    <div className="col-6">
                      <button type="button" className="btn btn-block btn-muted" onClick={limpiar}>Limpiar</button>
                    </div>
                  </div>
                  {loadingAction && <ProgressBar mode="indeterminate" style={{ height: "4px" }} className="mt-2" />}
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card">
              <div className="card-body">
                {loading && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>COLOR</th>
                      <th>NOMBRE</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="fadeIn animated">
                        <td>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: cat.colour }} />
                        </td>
                        <td>{cat.name}</td>
                        <td>
                          <i className="fa-regular fa-pen-to-square text-info pointer mr-2" onClick={() => { setCategoryToEdit(cat); setForm({ name: cat.name, colour: cat.colour }); setTouched(false); }} />
                          <i className="fa-regular fa-circle-xmark text-danger pointer" onClick={() => setCategoryToDelete(cat)} />
                        </td>
                      </tr>
                    ))}
                    {!loading && categories.length === 0 && <tr><td colSpan={3} className="text-center text-muted">No hay categorías.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {categoryToDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Eliminar categoría?</h4>
              <p><strong>&quot;{categoryToDelete?.name}&quot;</strong></p>
              <div className="row g-2 mt-3">
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-light w-100" onClick={() => setCategoryToDelete(null)}>Cancelar</button></div>
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-danger w-100" onClick={handleDelete}>{loadingDelete ? "..." : "Eliminar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
