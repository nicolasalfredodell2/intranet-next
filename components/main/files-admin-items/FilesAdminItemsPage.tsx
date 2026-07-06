"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import {
  loadFileCategories, createFileCategory, updateFileCategory, deleteFileCategory,
  createFileSubcategory, updateFileSubcategory, deleteFileSubcategory,
  getSubcategoryUsers,
} from "@/lib/services/files-admin-items.service";

export default function FilesAdminItemsPage() {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");

  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [catTouched, setCatTouched] = useState(false);
  const [catToEdit, setCatToEdit] = useState<any>(null);
  const [catToDelete, setCatToDelete] = useState<any>(null);
  const [loadingDeleteCat, setLoadingDeleteCat] = useState(false);

  const [showSubForm, setShowSubForm] = useState<any>(null);
  const [subForm, setSubForm] = useState({ name: "", description: "" });
  const [subTouched, setSubTouched] = useState(false);
  const [subToEdit, setSubToEdit] = useState<any>(null);
  const [subToDelete, setSubToDelete] = useState<any>(null);
  const [loadingDeleteSub, setLoadingDeleteSub] = useState(false);

  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await loadFileCategories();
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      sorted.forEach((cat: any) => cat.subitems = [...(cat.subitems ?? [])].sort((a, b) => a.name.localeCompare(b.name)));
      setItems(sorted);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo cargar las categorías" }); }
    finally { setLoading(false); }
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCatTouched(true);
    if (!catForm.name || !catForm.description) return;
    setLoadingAction(true);
    try {
      if (catToEdit) {
        await updateFileCategory({ ...catForm, id: catToEdit.id, order: "1" });
        setItems((p) => p.map((c) => c.id === catToEdit.id ? { ...c, ...catForm } : c));
        toast.current?.show({ severity: "success", summary: "Categoría modificada" });
        setCatToEdit(null);
      } else {
        const resp = await createFileCategory({ ...catForm, order: "1" });
        const newCat = { ...resp.data, subitems: [] };
        setItems((p) => [...p, newCat].sort((a, b) => a.name.localeCompare(b.name)));
        toast.current?.show({ severity: "success", summary: "Categoría creada" });
      }
      setCatForm({ name: "", description: "" }); setCatTouched(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally { setLoadingAction(false); }
  }

  async function handleDeleteCat() {
    if (!catToDelete) return;
    setLoadingDeleteCat(true);
    try {
      await deleteFileCategory(catToDelete.id);
      setItems((p) => p.filter((c) => c.id !== catToDelete.id));
      toast.current?.show({ severity: "success", summary: "Categoría eliminada" });
      setCatToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar" }); }
    finally { setLoadingDeleteCat(false); }
  }

  async function handleSubSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubTouched(true);
    if (!subForm.name || !subForm.description) return;
    setLoadingAction(true);
    try {
      if (subToEdit) {
        await updateFileSubcategory({ ...subForm, id: subToEdit.id, item_id: subToEdit.item_id, order: "1" });
        setItems((p) => p.map((cat) => ({
          ...cat,
          subitems: cat.subitems.map((s: any) => s.id === subToEdit.id ? { ...s, ...subForm } : s),
        })));
        toast.current?.show({ severity: "success", summary: "Subcategoría modificada" });
        setSubToEdit(null);
      } else {
        const resp = await createFileSubcategory({ ...subForm, item_id: showSubForm.id, order: "1" });
        const newSub = resp.data ?? resp;
        setItems((p) => p.map((cat) => cat.id === showSubForm.id
          ? { ...cat, subitems: [...cat.subitems, newSub].sort((a: any, b: any) => a.name.localeCompare(b.name)) }
          : cat
        ));
        toast.current?.show({ severity: "success", summary: "Subcategoría creada" });
      }
      setSubForm({ name: "", description: "" }); setSubTouched(false); setShowSubForm(null);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally { setLoadingAction(false); }
  }

  async function handleDeleteSub() {
    if (!subToDelete) return;
    setLoadingDeleteSub(true);
    try {
      await deleteFileSubcategory(subToDelete.id);
      setItems((p) => p.map((cat) => ({ ...cat, subitems: cat.subitems.filter((s: any) => s.id !== subToDelete.id) })));
      toast.current?.show({ severity: "success", summary: "Subcategoría eliminada" });
      setSubToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar" }); }
    finally { setLoadingDeleteSub(false); }
  }

  async function openUsers(sub: any) {
    setLoadingUsers(true);
    setShowUsersDialog(true);
    setSubUsers([]);
    try {
      setSubUsers(await getSubcategoryUsers(sub.id));
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo cargar los usuarios" }); }
    finally { setLoadingUsers(false); }
  }

  const filtered = search
    ? items.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Gestión de categorías de archivos</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Categorías de archivos</li>
            </ol>
          </div>
        </div>

        <div className="row">
          {/* Create/Edit form */}
          <div className="col-12 col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5>{catToEdit ? "Modificar categoría" : "Nueva categoría"}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleCatSubmit} noValidate>
                  <div className="form-group">
                    <label><small>Nombre *</small></label>
                    <input type="text" className="form-control" value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} />
                    {catTouched && !catForm.name && <small className="text-danger">* Obligatorio</small>}
                  </div>
                  <div className="form-group">
                    <label><small>Descripción *</small></label>
                    <textarea className="form-control" value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} />
                    {catTouched && !catForm.description && <small className="text-danger">* Obligatorio</small>}
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <button disabled={loadingAction} type="submit" className="btn btn-block btn-info">
                        {catToEdit ? (loadingAction ? "Modificando..." : "Modificar") : (loadingAction ? "Creando..." : "Crear")}
                      </button>
                    </div>
                    <div className="col-6">
                      <button type="button" className="btn btn-block btn-light" onClick={() => { setCatForm({ name: "", description: "" }); setCatToEdit(null); setCatTouched(false); }}>
                        Limpiar
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="col-12 col-lg-8">
            <div className="card">
              <div className="card-body">
                <input type="text" className="form-control form-control-sm mb-3" placeholder="Filtrar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
                {loading && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}

                {filtered.map((cat: any) => (
                  <div key={cat.id} className="card border mb-3 fadeIn animated">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <strong>{cat.name}</strong>
                      <div>
                        <i className="fa-regular fa-pen-to-square text-info pointer mr-2" onClick={() => { setCatToEdit(cat); setCatForm({ name: cat.name, description: cat.description }); setCatTouched(false); }} />
                        <i className="fa-regular fa-circle-xmark text-danger pointer" onClick={() => setCatToDelete(cat)} />
                      </div>
                    </div>
                    <div className="card-body p-2">
                      {(cat.subitems ?? []).map((sub: any) => (
                        <div key={sub.id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                          <span className="small">{sub.name}</span>
                          <div>
                            <i className="mdi mdi-account-multiple-outline text-secondary pointer mr-2" title="Ver usuarios" onClick={() => openUsers(sub)} />
                            <i className="fa-regular fa-pen-to-square text-info pointer mr-2" onClick={() => { setSubToEdit({ ...sub, item_id: cat.id }); setSubForm({ name: sub.name, description: sub.description }); setSubTouched(false); setShowSubForm(cat); }} />
                            <i className="fa-regular fa-circle-xmark text-danger pointer" onClick={() => setSubToDelete({ ...sub, item_id: cat.id })} />
                          </div>
                        </div>
                      ))}
                      <button type="button" className="btn btn-sm btn-outline-info mt-2" onClick={() => { setShowSubForm(cat); setSubForm({ name: "", description: "" }); setSubTouched(false); setSubToEdit(null); }}>
                        <i className="mdi mdi-plus" /> Agregar subcategoría
                      </button>
                    </div>
                  </div>
                ))}
                {!loading && filtered.length === 0 && <p className="text-center text-muted">No hay categorías.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub form dialog */}
      <Dialog header={subToEdit ? "Modificar subcategoría" : `Nueva subcategoría en "${showSubForm?.name}"`} visible={!!showSubForm} modal draggable={false} resizable={false} style={{ width: "420px" }} onHide={() => { setShowSubForm(null); setSubToEdit(null); }}>
        <form onSubmit={handleSubSubmit} noValidate>
          <div className="form-group">
            <label><small>Nombre *</small></label>
            <input type="text" className="form-control" value={subForm.name} onChange={(e) => setSubForm((p) => ({ ...p, name: e.target.value }))} />
            {subTouched && !subForm.name && <small className="text-danger">* Obligatorio</small>}
          </div>
          <div className="form-group">
            <label><small>Descripción *</small></label>
            <textarea className="form-control" value={subForm.description} onChange={(e) => setSubForm((p) => ({ ...p, description: e.target.value }))} />
            {subTouched && !subForm.description && <small className="text-danger">* Obligatorio</small>}
          </div>
          <button disabled={loadingAction} type="submit" className="btn btn-info btn-block mt-2">
            {subToEdit ? (loadingAction ? "Modificando..." : "Modificar") : (loadingAction ? "Creando..." : "Crear")}
          </button>
        </form>
      </Dialog>

      {/* Users dialog */}
      <Dialog header="Usuarios vinculados" visible={showUsersDialog} modal draggable={false} resizable={false} style={{ width: "420px" }} onHide={() => setShowUsersDialog(false)}>
        {loadingUsers && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
        {!loadingUsers && subUsers.length === 0 && <p className="text-muted text-center">No hay usuarios vinculados.</p>}
        <ul className="list-group">
          {subUsers.map((u: any) => (
            <li key={u.id} className="list-group-item py-1">
              <small>{u.lastname_name ?? u.name}</small>
            </li>
          ))}
        </ul>
      </Dialog>

      {/* Delete cat modal */}
      {catToDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Eliminar categoría?</h4>
              <p><strong>&quot;{catToDelete?.name}&quot;</strong></p>
              <div className="row g-2 mt-3">
                <div className="col-6"><button disabled={loadingDeleteCat} className="btn btn-light w-100" onClick={() => setCatToDelete(null)}>Cancelar</button></div>
                <div className="col-6"><button disabled={loadingDeleteCat} className="btn btn-danger w-100" onClick={handleDeleteCat}>{loadingDeleteCat ? "..." : "Eliminar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete sub modal */}
      {subToDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Eliminar subcategoría?</h4>
              <p><strong>&quot;{subToDelete?.name}&quot;</strong></p>
              <div className="row g-2 mt-3">
                <div className="col-6"><button disabled={loadingDeleteSub} className="btn btn-light w-100" onClick={() => setSubToDelete(null)}>Cancelar</button></div>
                <div className="col-6"><button disabled={loadingDeleteSub} className="btn btn-danger w-100" onClick={handleDeleteSub}>{loadingDeleteSub ? "..." : "Eliminar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
