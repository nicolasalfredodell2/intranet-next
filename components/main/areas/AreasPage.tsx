"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { listAreas, createArea, modificateArea, deleteArea, disableArea } from "@/lib/services/areas.service";
import AreaInfoModal from "./AreaInfoModal";

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

interface AreaForm { title: string; description: string; }
interface AreaItem { id: string; title: string; description: string; }

function SkeletonCards() {
  return (
    <div className="row">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="col-12 col-md-6 col-lg-4 mb-3">
          <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
            <div style={{ width: "60%", height: 16, borderRadius: 6, marginBottom: 10, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
            <div style={{ width: "90%", height: 12, borderRadius: 6, marginBottom: 16, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
            <div style={{ width: "100%", height: 30, borderRadius: 8, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AreasPage() {
  const toast = useRef<Toast>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [form, setForm] = useState<AreaForm>({ title: "", description: "" });
  const [touched, setTouched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const [areaToDelete, setAreaToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [areaToDisable, setAreaToDisable] = useState<any>(null);
  const [loadingDisable, setLoadingDisable] = useState(false);
  const [areaForInfo, setAreaForInfo] = useState<any>(null);

  const [areaToModify, setAreaToModify] = useState<AreaItem | null>(null);
  const [modifyForm, setModifyForm] = useState<AreaForm>({ title: "", description: "" });
  const [modifyTouched, setModifyTouched] = useState(false);
  const [loadingModify, setLoadingModify] = useState(false);

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
      const resp = await createArea(form);
      setAreas((prev) => [...prev, resp.data]);
      toast.current?.show({ severity: "success", summary: "Area creada" });
      setForm({ title: "", description: "" });
      setTouched(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function limpiar() {
    setForm({ title: "", description: "" });
    setTouched(false);
  }

  function abrirModificar(area: AreaItem) {
    setAreaToModify(area);
    setModifyForm({ title: area.title, description: area.description });
    setModifyTouched(false);
  }

  function cerrarModificar() {
    setAreaToModify(null);
    setModifyForm({ title: "", description: "" });
    setModifyTouched(false);
  }

  async function handleModifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setModifyTouched(true);
    if (!modifyForm.title || !modifyForm.description || !areaToModify) return;
    setLoadingModify(true);
    try {
      const resp = await modificateArea(modifyForm, areaToModify.id);
      setAreas((prev) => prev.map((a) => a.id === areaToModify.id ? resp.data : a));
      toast.current?.show({ severity: "success", summary: "Area modificada" });
      cerrarModificar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingModify(false);
    }
  }

  async function confirmarEliminacion() {
    if (!areaToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteArea(areaToDelete.id);
      setAreas((prev) => prev.filter((a) => a.id !== areaToDelete.id));
      toast.current?.show({ severity: "success", summary: "Area eliminada" });
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
      setAreaToDisable(null);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo deshabilitar el area" });
    } finally {
      setLoadingDisable(false);
    }
  }

  const filtered = (searchTerm
    ? areas.filter((a) => a.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : areas
  ).slice().sort((a, b) => {
    const cmp = (a.title ?? "").localeCompare(b.title ?? "", "es", { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const modifyDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar área</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{areaToModify?.title}</small>
      </div>
    </div>
  );

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar área</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  const disableDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-eye-slash" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Deshabilitar área</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Dejará de mostrarse en el sitio institucional</small>
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
              <i className="pi pi-sitemap" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Áreas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de áreas institucionales</small>
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

        {/* Create form card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-plus-circle" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nueva área</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Completá los datos para crear un área</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Título *</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                  {touched && !form.title && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Descripción *</label>
                  <textarea
                    className="profile-input"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  {touched && !form.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
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
                  {loadingAction ? "Creando..." : "Crear área"}
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={limpiar}
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
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{areas.length} {areas.length === 1 ? "área en total" : "áreas totales"}</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>

            {/* Filter bar */}
            {(areas.length > 0 || searchTerm) && (
              <div className="license-filter-bar mb-3">
                <div className="license-filter-bar-inputs">
                  <div className={`license-filter-input-wrap${searchTerm ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-search license-filter-icon" />
                    <input
                      className="license-filter-input"
                      style={{ paddingLeft: "32px" }}
                      placeholder="Buscar área por título…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSortDir((p) => (p === "asc" ? "desc" : "asc"))}
                    title={sortDir === "asc" ? "Orden alfabético A-Z" : "Orden alfabético Z-A"}
                    className="d-flex align-items-center"
                    style={{ gap: "5px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <i className={`pi ${sortDir === "asc" ? "pi-sort-alpha-down" : "pi-sort-alpha-up"}`} style={{ fontSize: "0.8rem" }} />
                    {sortDir === "asc" ? "A-Z" : "Z-A"}
                  </button>
                </div>
                {searchTerm && (
                  <button type="button" className="license-filter-clear" onClick={() => setSearchTerm("")}>
                    <i className="pi pi-times" /> Limpiar
                  </button>
                )}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && <SkeletonCards />}

            {/* Areas grid */}
            {!loading && (
              <div className="row fadeIn animated">
                {filtered.map((area) => (
                  <div key={area.id} className="col-12 col-md-6 col-lg-4 mb-3">
                    <div
                      onMouseEnter={() => setHoveredCard(area.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "16px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: hoveredCard === area.id ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      <div className="flex-grow-1" style={{ marginBottom: "14px" }}>
                        <p className="mb-1 font-weight-bold" style={{ fontSize: "0.9rem", color: "#1e293b" }}>{area.title}</p>
                        <p className="mb-0" style={{ fontSize: "0.82rem", color: "#64748b" }}>{area.description}</p>
                      </div>
                      <div className="d-flex align-items-center justify-content-end pt-2" style={{ gap: "6px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        <Tooltip label="Información">
                          <button
                            type="button"
                            onClick={() => setAreaForInfo(area)}
                            style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#4a6cf7" }}
                          >
                            <i className="pi pi-info-circle" style={{ fontSize: "0.9rem" }} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Modificar">
                          <button
                            type="button"
                            onClick={() => abrirModificar(area)}
                            style={{ background: "none", border: "1.5px solid #dbeafe", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#3b82f6" }}
                          >
                            <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Deshabilitar">
                          <button
                            type="button"
                            onClick={() => setAreaToDisable(area)}
                            style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#64748b" }}
                          >
                            <i className="pi pi-eye-slash" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Eliminar">
                          <button
                            type="button"
                            onClick={() => setAreaToDelete(area)}
                            style={{ background: "none", border: "1.5px solid #fecdd3", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#dc3545" }}
                          >
                            <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}

                {areas.length === 0 && (
                  <div className="col-12" style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-sitemap" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>No hay áreas disponibles para mostrar.</p>
                  </div>
                )}
                {areas.length > 0 && filtered.length === 0 && (
                  <div className="col-12" style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-search" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                      No se encontraron áreas con el título &quot;{searchTerm}&quot;.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modify area dialog */}
      <Dialog
        header={modifyDialogHeader}
        visible={!!areaToModify}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(480px, 92vw)" }}
        onHide={cerrarModificar}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="modify-area-form"
                disabled={loadingModify}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingModify ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingModify ? "Modificando..." : "Modificar"}
              </button>
              <button
                disabled={loadingModify}
                onClick={cerrarModificar}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingModify && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <form id="modify-area-form" onSubmit={handleModifySubmit} noValidate>
          <div className="mb-3">
            <label className="profile-field-label">Título *</label>
            <input
              className="profile-input"
              type="text"
              value={modifyForm.title}
              onChange={(e) => setModifyForm((p) => ({ ...p, title: e.target.value }))}
            />
            {modifyTouched && !modifyForm.title && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
          <div className="mb-1">
            <label className="profile-field-label">Descripción *</label>
            <textarea
              className="profile-input"
              rows={3}
              value={modifyForm.description}
              onChange={(e) => setModifyForm((p) => ({ ...p, description: e.target.value }))}
            />
            {modifyTouched && !modifyForm.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
        </form>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        header={deleteDialogHeader}
        visible={!!areaToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setAreaToDelete(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingDelete}
                onClick={confirmarEliminacion}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingDelete ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {loadingDelete ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={loadingDelete}
                onClick={() => setAreaToDelete(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingDelete && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar el área <strong>{areaToDelete?.title}</strong>.
        </p>
      </Dialog>

      {/* Disable confirmation dialog */}
      <Dialog
        header={disableDialogHeader}
        visible={!!areaToDisable}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setAreaToDisable(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingDisable}
                onClick={confirmarDeshabilitacion}
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingDisable ? "pi pi-spin pi-spinner" : "pi pi-eye-slash"} style={{ fontSize: "0.78rem" }} />
                {loadingDisable ? "Deshabilitando..." : "Sí, deshabilitar"}
              </button>
              <button
                disabled={loadingDisable}
                onClick={() => setAreaToDisable(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingDisable && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de deshabilitar el área <strong>{areaToDisable?.title}</strong>.
        </p>
      </Dialog>

      {/* Area info dialog */}
      {areaForInfo && (
        <AreaInfoModal area={areaForInfo} onClose={() => setAreaForInfo(null)} />
      )}
    </>
  );
}