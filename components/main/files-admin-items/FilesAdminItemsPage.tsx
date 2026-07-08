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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [catTouched, setCatTouched] = useState(false);
  const [catToEdit, setCatToEdit] = useState<any>(null);
  const [modifyCatForm, setModifyCatForm] = useState({ name: "", description: "" });
  const [modifyCatTouched, setModifyCatTouched] = useState(false);
  const [loadingModifyCat, setLoadingModifyCat] = useState(false);
  const [catToDelete, setCatToDelete] = useState<any>(null);
  const [loadingDeleteCat, setLoadingDeleteCat] = useState(false);

  const [subToEdit, setSubToEdit] = useState<any>(null);
  const [modifySubForm, setModifySubForm] = useState<{ name: string; description: string; item_id: any }>({ name: "", description: "", item_id: "" });
  const [modifySubTouched, setModifySubTouched] = useState(false);
  const [loadingModifySub, setLoadingModifySub] = useState(false);
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
    setCatTouched(false);
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCatTouched(true);
    if (!catForm.name || !catForm.description) return;
    setLoadingAction(true);
    try {
      const resp = await createFileCategory({ ...catForm, order: "1" });
      const newCat = { ...resp.data, subitems: [] };
      setItems((p) => [...p, newCat].sort((a, b) => a.name.localeCompare(b.name)));
      toast.current?.show({ severity: "success", summary: "Categoría creada" });
      limpiarCatForm();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally { setLoadingAction(false); }
  }

  async function handleModifyCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModifyCatTouched(true);
    if (!modifyCatForm.name || !modifyCatForm.description || !catToEdit) return;
    setLoadingModifyCat(true);
    try {
      await updateFileCategory({ ...modifyCatForm, id: catToEdit.id, order: "1" });
      setItems((p) => p.map((c) => c.id === catToEdit.id ? { ...c, ...modifyCatForm } : c));
      toast.current?.show({ severity: "success", summary: "Categoría modificada" });
      cerrarModificarCat();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally { setLoadingModifyCat(false); }
  }

  function abrirModificarCat(cat: any) {
    setCatToEdit(cat);
    setModifyCatForm({ name: cat.name, description: cat.description });
    setModifyCatTouched(false);
  }

  function cerrarModificarCat() {
    setCatToEdit(null);
    setModifyCatForm({ name: "", description: "" });
    setModifyCatTouched(false);
  }

  function toggleExpanded(id: string) {
    setExpandedCategories((p) => ({ ...p, [id]: !p[id] }));
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

  function limpiarNewSubForm() {
    setNewSubForm({ name: "", description: "", item_id: "" });
    setNewSubTouched(false);
  }

  function abrirModificarSub(sub: any, cat: any) {
    setSubToEdit({ ...sub, item_id: cat.id });
    setModifySubForm({ name: sub.name, description: sub.description, item_id: cat.id });
    setModifySubTouched(false);
  }

  function cerrarModificarSub() {
    setSubToEdit(null);
    setModifySubForm({ name: "", description: "", item_id: "" });
    setModifySubTouched(false);
  }

  async function handleSubSubmit(e: React.FormEvent) {
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

  async function handleModifySubSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModifySubTouched(true);
    if (!modifySubForm.name || !modifySubForm.description || !modifySubForm.item_id || !subToEdit) return;
    setLoadingModifySub(true);
    try {
      await updateFileSubcategory({ name: modifySubForm.name, description: modifySubForm.description, id: subToEdit.id, item_id: modifySubForm.item_id, order: "1" });
      setItems((p) => p.map((cat) => {
        if (cat.id === subToEdit.item_id && cat.id !== modifySubForm.item_id) {
          return { ...cat, subitems: cat.subitems.filter((s: any) => s.id !== subToEdit.id) };
        }
        if (cat.id === modifySubForm.item_id) {
          const updatedSub = { ...subToEdit, name: modifySubForm.name, description: modifySubForm.description };
          const withoutSub = cat.subitems.filter((s: any) => s.id !== subToEdit.id);
          return { ...cat, subitems: [...withoutSub, updatedSub].sort((a: any, b: any) => a.name.localeCompare(b.name)) };
        }
        return cat;
      }));
      toast.current?.show({ severity: "success", summary: "Subcategoría modificada" });
      cerrarModificarSub();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally { setLoadingModifySub(false); }
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

  const modifyCatHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar categoría</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{catToEdit?.name}</small>
      </div>
    </div>
  );

  const modifySubHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar subcategoría</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{subToEdit?.name}</small>
      </div>
    </div>
  );

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

        {/* Create category form card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-plus-circle" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nueva categoría</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Completá los datos para crear una categoría</small>
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
                  {loadingAction ? "Creando..." : "Crear categoría"}
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
            <form className="animated fadeIn" onSubmit={handleSubSubmit} noValidate>
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
                  <div
                    className={`license-filter-input-wrap${newSubForm.item_id ? " license-filter-input-wrap--active" : ""}`}
                    style={{ padding: "9px 13px", border: "1.5px solid #e2e8f0" }}
                  >
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
                <div className="row">
                {filtered.map((cat: any) => (
                  <div key={cat.id} className="col-12 col-md-4 mb-3">
                  <div
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "12px",
                      height: "100%",
                      boxShadow: hoveredCategory === cat.id ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
                      transition: "box-shadow 0.15s",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between" style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ minWidth: 0 }}>
                        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: 700 }}>{cat.name}</p>
                        <p className="mb-0" style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>{cat.description}</p>
                      </div>
                      <div className="d-flex align-items-center" style={{ gap: "6px", flexShrink: 0 }}>
                        <Tooltip label="Modificar">
                          <button type="button" onClick={() => abrirModificarCat(cat)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
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

                    <div style={{ padding: "10px 16px 14px" }}>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(cat.id)}
                        className="d-flex align-items-center justify-content-between w-100"
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}
                      >
                        <span className="d-flex align-items-center" style={{ gap: "6px" }}>
                          <i className="pi pi-sitemap" style={{ fontSize: "0.75rem" }} />
                          Subcategorías ({(cat.subitems ?? []).length})
                        </span>
                        <i className={`pi ${expandedCategories[cat.id] ? "pi-chevron-up" : "pi-chevron-down"}`} style={{ fontSize: "0.7rem" }} />
                      </button>

                      {expandedCategories[cat.id] && (
                        <div className="animated fadeIn" style={{ marginTop: "8px", paddingLeft: "10px", borderLeft: "2px solid #eef1ff" }}>
                          {(cat.subitems ?? []).map((sub: any) => (
                            <div key={sub.id} className="d-flex align-items-center justify-content-between" style={{ padding: "8px 8px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                              <div style={{ minWidth: 0 }}>
                                <p className="mb-0" style={{ fontSize: "0.84rem", color: "#374151", fontWeight: 700 }}>{sub.name}</p>
                                {sub.description && <p className="mb-0" style={{ fontSize: "0.76rem", color: "#94a3b8", fontStyle: "italic" }}>{sub.description}</p>}
                              </div>
                              <div className="d-flex align-items-center" style={{ gap: "6px", flexShrink: 0 }}>
                                <Tooltip label="Ver usuarios">
                                  <button type="button" onClick={() => openUsers(sub)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #e2e8f0", color: "#64748b" }}>
                                    <i className="pi pi-users" style={{ fontSize: "0.85rem" }} />
                                  </button>
                                </Tooltip>
                                <Tooltip label="Modificar">
                                  <button
                                    type="button"
                                    onClick={() => abrirModificarSub(sub, cat)}
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
                      )}
                    </div>
                  </div>
                  </div>
                ))}
                </div>

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

      {/* Modify category dialog */}
      <Dialog
        header={modifyCatHeader}
        visible={!!catToEdit}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "min(520px, 94vw)" }}
        onHide={cerrarModificarCat}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="modify-cat-form"
                disabled={loadingModifyCat}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingModifyCat ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingModifyCat ? "Modificando..." : "Modificar"}
              </button>
              <button
                type="button"
                disabled={loadingModifyCat}
                onClick={cerrarModificarCat}
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingModifyCat && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <form id="modify-cat-form" onSubmit={handleModifyCatSubmit} noValidate>
          <div className="row">
            <div className="col-12 mb-3">
              <label className="profile-field-label">Nombre *</label>
              <input
                className="profile-input"
                type="text"
                value={modifyCatForm.name}
                onChange={(e) => setModifyCatForm((p) => ({ ...p, name: e.target.value }))}
              />
              {modifyCatTouched && !modifyCatForm.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 mb-3">
              <label className="profile-field-label">Descripción *</label>
              <input
                className="profile-input"
                type="text"
                value={modifyCatForm.description}
                onChange={(e) => setModifyCatForm((p) => ({ ...p, description: e.target.value }))}
              />
              {modifyCatTouched && !modifyCatForm.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
          </div>
        </form>
      </Dialog>

      {/* Modify subcategory dialog */}
      <Dialog
        header={modifySubHeader}
        visible={!!subToEdit}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "min(520px, 94vw)" }}
        onHide={cerrarModificarSub}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="modify-sub-form"
                disabled={loadingModifySub}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingModifySub ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingModifySub ? "Modificando..." : "Modificar"}
              </button>
              <button
                type="button"
                disabled={loadingModifySub}
                onClick={cerrarModificarSub}
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingModifySub && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <form id="modify-sub-form" onSubmit={handleModifySubSubmit} noValidate>
          <div className="row">
            <div className="col-12 mb-3">
              <label className="profile-field-label">Nombre *</label>
              <input
                className="profile-input"
                type="text"
                value={modifySubForm.name}
                onChange={(e) => setModifySubForm((p) => ({ ...p, name: e.target.value }))}
              />
              {modifySubTouched && !modifySubForm.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 mb-3">
              <label className="profile-field-label">Descripción *</label>
              <input
                className="profile-input"
                type="text"
                value={modifySubForm.description}
                onChange={(e) => setModifySubForm((p) => ({ ...p, description: e.target.value }))}
              />
              {modifySubTouched && !modifySubForm.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 mb-3">
              <label className="profile-field-label">Categoría *</label>
              <div
                className={`license-filter-input-wrap${modifySubForm.item_id ? " license-filter-input-wrap--active" : ""}`}
                style={{ padding: "9px 13px", border: "1.5px solid #e2e8f0" }}
              >
                <i className="pi pi-folder license-filter-icon" />
                <Dropdown
                  value={modifySubForm.item_id || null}
                  options={items}
                  optionLabel="name"
                  optionValue="id"
                  onChange={(e) => setModifySubForm((p) => ({ ...p, item_id: e.value ?? "" }))}
                  placeholder="Seleccioná una categoría"
                  className="license-filter-dropdown"
                  panelClassName="license-filter-dropdown-panel"
                  emptyMessage="Sin categorías"
                />
              </div>
              {modifySubTouched && !modifySubForm.item_id && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
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