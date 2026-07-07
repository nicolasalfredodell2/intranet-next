"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import {
  loadFileCategories, createFileCategory, updateFileCategory, deleteFileCategory,
  createFileSubcategory, updateFileSubcategory, deleteFileSubcategory,
  getSubcategoryUsers,
} from "@/lib/services/files-admin-items.service";

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  return (
    <span
      style={{ display: "inline-flex" }}
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ top: r.top, left: r.left + r.width / 2 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div style={{ position: "fixed", top: pos.top - 10, left: pos.left, transform: "translateX(-50%) translateY(-100%)", background: "#1e293b", color: "#fff", padding: "5px 11px", borderRadius: "7px", fontSize: "0.71rem", fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", letterSpacing: "0.01em" }}>
          {label}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "5px", borderStyle: "solid", borderColor: "#1e293b transparent transparent transparent" }} />
        </div>
      )}
    </span>
  );
}

function SkeletonRows() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
          <div style={{ width: "40%", height: 16, borderRadius: 6, marginBottom: 10, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ width: "70%", height: 12, borderRadius: 6, marginBottom: 16, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ width: "100%", height: 30, borderRadius: 8, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
        </div>
      ))}
    </div>
  );
}

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

export default function FilesAdminItemsPage() {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

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

  const [newSubForm, setNewSubForm] = useState<{ name: string; description: string; item_id: any }>({ name: "", description: "", item_id: "" });
  const [newSubTouched, setNewSubTouched] = useState(false);

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

  function limpiarCatForm() {
    setCatForm({ name: "", description: "" });
    setCatToEdit(null);
    setCatTouched(false);
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
      } else {
        const resp = await createFileCategory({ ...catForm, order: "1" });
        const newCat = { ...resp.data, subitems: [] };
        setItems((p) => [...p, newCat].sort((a, b) => a.name.localeCompare(b.name)));
        toast.current?.show({ severity: "success", summary: "Categoría creada" });
      }
      limpiarCatForm();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally { setLoadingAction(false); }
  }

  function editCategory(cat: any) {
    setCatToEdit(cat);
    setCatForm({ name: cat.name, description: cat.description });
    setCatTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  function closeSubForm() {
    setShowSubForm(null);
    setSubToEdit(null);
    setSubForm({ name: "", description: "" });
    setSubTouched(false);
  }

  async function handleSubSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubTouched(true);
    if (!subForm.name || !subForm.description) return;
    setLoadingAction(true);
    try {
      await updateFileSubcategory({ ...subForm, id: subToEdit.id, item_id: subToEdit.item_id, order: "1" });
      setItems((p) => p.map((cat) => ({
        ...cat,
        subitems: cat.subitems.map((s: any) => s.id === subToEdit.id ? { ...s, ...subForm } : s),
      })));
      toast.current?.show({ severity: "success", summary: "Subcategoría modificada" });
      closeSubForm();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally { setLoadingAction(false); }
  }

  function limpiarNewSubForm() {
    setNewSubForm({ name: "", description: "", item_id: "" });
    setNewSubTouched(false);
  }

  async function handleCreateSub(e: React.FormEvent) {
    e.preventDefault();
    setNewSubTouched(true);
    if (!newSubForm.name || !newSubForm.description || !newSubForm.item_id) return;
    setLoadingAction(true);
    try {
      const resp = await createFileSubcategory({ name: newSubForm.name, description: newSubForm.description, item_id: newSubForm.item_id, order: "1" });
      const newSub = resp.data ?? resp;
      setItems((p) => p.map((cat) => cat.id === newSubForm.item_id
        ? { ...cat, subitems: [...cat.subitems, newSub].sort((a: any, b: any) => a.name.localeCompare(b.name)) }
        : cat
      ));
      toast.current?.show({ severity: "success", summary: "Subcategoría creada" });
      limpiarNewSubForm();
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

  const catDeleteHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar categoría</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  const subDeleteHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar subcategoría</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  const subFormHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar subcategoría</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{showSubForm?.name}</small>
      </div>
    </div>
  );

  const usersDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-users" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Usuarios vinculados</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Agentes con esta subcategoría en su legajo</small>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-folder-open" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Categorías de archivos</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de categorías y subcategorías de legajo</small>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={load}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
        </div>

        {/* Create / modify form card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: catToEdit ? "#eff6ff" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className={`pi ${catToEdit ? "pi-pencil" : "pi-plus-circle"}`} style={{ color: catToEdit ? "#3b82f6" : "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>
                {catToEdit ? "Modificar categoría" : "Nueva categoría"}
              </h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                {catToEdit ? catToEdit.name : "Completá los datos para crear una categoría"}
              </small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={handleCatSubmit} noValidate>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Nombre *</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  {catTouched && !catForm.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Descripción *</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={catForm.description}
                    onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  {catTouched && !catForm.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
              </div>

              <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                <button
                  disabled={loadingAction}
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  <i className={loadingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                  {catToEdit
                    ? (loadingAction ? "Modificando..." : "Modificar")
                    : (loadingAction ? "Creando..." : "Crear categoría")}
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={limpiarCatForm}
                  className="btn btn-light text-muted ml-auto"
                  style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
                >
                  Limpiar
                </button>
              </div>

              {loadingAction && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
            </form>
          </div>
        </div>

        {/* Create subcategory form card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-plus-circle" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nueva subcategoría</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Completá los datos para crear una subcategoría</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={handleCreateSub} noValidate>
              <div className="row">
                <div className="col-12 col-md-4 mb-3">
                  <label className="profile-field-label">Nombre *</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={newSubForm.name}
                    onChange={(e) => setNewSubForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  {newSubTouched && !newSubForm.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
                <div className="col-12 col-md-4 mb-3">
                  <label className="profile-field-label">Descripción *</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={newSubForm.description}
                    onChange={(e) => setNewSubForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  {newSubTouched && !newSubForm.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
                <div className="col-12 col-md-4 mb-3">
                  <label className="profile-field-label">Categoría *</label>
                  <div className={`license-filter-input-wrap${newSubForm.item_id ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-folder license-filter-icon" />
                    <Dropdown
                      value={newSubForm.item_id || null}
                      options={items}
                      optionLabel="name"
                      optionValue="id"
                      onChange={(e) => setNewSubForm((p) => ({ ...p, item_id: e.value ?? "" }))}
                      placeholder="Seleccioná una categoría"
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel"
                      emptyMessage="Sin categorías"
                    />
                  </div>
                  {newSubTouched && !newSubForm.item_id && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
              </div>

              <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                <button
                  disabled={loadingAction}
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  <i className={loadingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                  {loadingAction ? "Creando..." : "Crear subcategoría"}
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={limpiarNewSubForm}
                  className="btn btn-light text-muted ml-auto"
                  style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
                >
                  Limpiar
                </button>
              </div>

              {loadingAction && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
            </form>
          </div>
        </div>

        {/* List card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-list" style={{ color: "#3b82f6", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Listado</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{items.length} {items.length === 1 ? "categoría" : "categorías"}</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>

            {/* Filter bar */}
            {(items.length > 0 || search) && (
              <div className="license-filter-bar mb-3">
                <div className="license-filter-bar-inputs">
                  <div className={`license-filter-input-wrap${search ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-search license-filter-icon" />
                    <input
                      className="license-filter-input"
                      style={{ paddingLeft: "32px" }}
                      placeholder="Buscar categoría por nombre…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                {search && (
                  <button type="button" className="license-filter-clear" onClick={() => setSearch("")}>
                    <i className="pi pi-times" /> Limpiar
                  </button>
                )}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && <SkeletonRows />}

            {/* Categories list */}
            {!loading && (
              <div className="fadeIn animated">
                {filtered.map((cat: any) => (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "12px",
                      marginBottom: "12px",
                      boxShadow: hoveredCategory === cat.id ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
                      transition: "box-shadow 0.15s",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between" style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ minWidth: 0 }}>
                        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.9rem", color: "#1e293b" }}>{cat.name}</p>
                        <p className="mb-0" style={{ fontSize: "0.8rem", color: "#64748b" }}>{cat.description}</p>
                      </div>
                      <div className="d-flex align-items-center" style={{ gap: "6px", flexShrink: 0 }}>
                        <Tooltip label="Modificar">
                          <button type="button" onClick={() => editCategory(cat)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
                            <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Eliminar">
                          <button type="button" onClick={() => setCatToDelete(cat)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                            <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    <div style={{ padding: "8px 16px 16px" }}>
                      {(cat.subitems ?? []).map((sub: any) => (
                        <div key={sub.id} className="d-flex align-items-center justify-content-between" style={{ padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                          <span style={{ fontSize: "0.84rem", color: "#374151" }}>{sub.name}</span>
                          <div className="d-flex align-items-center" style={{ gap: "6px", flexShrink: 0 }}>
                            <Tooltip label="Ver usuarios">
                              <button type="button" onClick={() => openUsers(sub)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                                <i className="pi pi-users" style={{ fontSize: "0.85rem" }} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Modificar">
                              <button
                                type="button"
                                onClick={() => { setSubToEdit({ ...sub, item_id: cat.id }); setSubForm({ name: sub.name, description: sub.description }); setSubTouched(false); setShowSubForm(cat); }}
                                style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}
                              >
                                <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Eliminar">
                              <button type="button" onClick={() => setSubToDelete({ ...sub, item_id: cat.id })} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                                <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                      {(cat.subitems ?? []).length === 0 && (
                        <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "6px 0 0" }}>Sin subcategorías.</p>
                      )}
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-folder-open" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>No hay categorías disponibles para mostrar.</p>
                  </div>
                )}
                {items.length > 0 && filtered.length === 0 && (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-search" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                      No se encontraron categorías con el nombre &quot;{search}&quot;.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub form dialog */}
      <Dialog
        header={subFormHeader}
        visible={!!showSubForm}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(480px, 92vw)" }}
        onHide={closeSubForm}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="sub-category-form"
                disabled={loadingAction}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {subToEdit ? (loadingAction ? "Modificando..." : "Modificar") : (loadingAction ? "Creando..." : "Crear")}
              </button>
              <button
                disabled={loadingAction}
                onClick={closeSubForm}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingAction && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <form id="sub-category-form" onSubmit={handleSubSubmit} noValidate>
          <div className="mb-3">
            <label className="profile-field-label">Nombre *</label>
            <input
              className="profile-input"
              type="text"
              value={subForm.name}
              onChange={(e) => setSubForm((p) => ({ ...p, name: e.target.value }))}
            />
            {subTouched && !subForm.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
          <div className="mb-1">
            <label className="profile-field-label">Descripción *</label>
            <input
              className="profile-input"
              type="text"
              value={subForm.description}
              onChange={(e) => setSubForm((p) => ({ ...p, description: e.target.value }))}
            />
            {subTouched && !subForm.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
        </form>
      </Dialog>

      {/* Users dialog */}
      <Dialog
        header={usersDialogHeader}
        visible={showUsersDialog}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setShowUsersDialog(false)}
      >
        {loadingUsers && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} />}
        {!loadingUsers && subUsers.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.88rem", textAlign: "center", margin: 0 }}>No hay usuarios vinculados.</p>
        )}
        {!loadingUsers && subUsers.length > 0 && (
          <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
            {subUsers.map((u: any) => (
              <span key={u.id} className="profile-boss-chip">
                {u.lastname_name ?? u.name}
              </span>
            ))}
          </div>
        )}
      </Dialog>

      {/* Delete category dialog */}
      <Dialog
        header={catDeleteHeader}
        visible={!!catToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setCatToDelete(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingDeleteCat}
                onClick={handleDeleteCat}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingDeleteCat ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {loadingDeleteCat ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={loadingDeleteCat}
                onClick={() => setCatToDelete(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingDeleteCat && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar la categoría <strong>{catToDelete?.name}</strong>.
        </p>
      </Dialog>

      {/* Delete subcategory dialog */}
      <Dialog
        header={subDeleteHeader}
        visible={!!subToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setSubToDelete(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingDeleteSub}
                onClick={handleDeleteSub}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingDeleteSub ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {loadingDeleteSub ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={loadingDeleteSub}
                onClick={() => setSubToDelete(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingDeleteSub && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar la subcategoría <strong>{subToDelete?.name}</strong>.
        </p>
      </Dialog>
    </>
  );
}