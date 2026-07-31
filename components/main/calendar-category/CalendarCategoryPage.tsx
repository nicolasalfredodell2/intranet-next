"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Paginator } from "primereact/paginator";
import { ProgressBar } from "primereact/progressbar";
import { getCalendarCategories, createCalendarCategory, updateCalendarCategory, deleteCalendarCategory } from "@/lib/services/calendar-category.service";

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

interface CategoryForm { name: string; colour: string; icon: string; }
interface CategoryItem { id: number; name: string; description?: string; colour: string; icon?: string; }

function SkeletonRows() {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="license-skeleton-row">
          {[8, 62, 20].map((w, j) => (
            <div key={j} className="license-skeleton-cell" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export const DEFAULT_COLOUR = "#2196f3";
export const DEFAULT_ICON = "pi-calendar";

const SORT_OPTIONS = [
  { label: "Nombre (A-Z)", value: "asc" },
  { label: "Nombre (Z-A)", value: "desc" },
];

export const ICON_OPTIONS = [
  // Calendario y tiempo
  { label: "Calendario", value: "pi-calendar" },
  { label: "Calendario (reloj)", value: "pi-calendar-clock" },
  { label: "Calendario +", value: "pi-calendar-plus" },
  { label: "Calendario -", value: "pi-calendar-minus" },
  { label: "Calendario cancelado", value: "pi-calendar-times" },
  { label: "Reloj", value: "pi-clock" },
  { label: "Cronómetro", value: "pi-stopwatch" },
  { label: "Reloj de arena", value: "pi-hourglass" },
  { label: "Historial", value: "pi-history" },

  // Destacados
  { label: "Estrella", value: "pi-star" },
  { label: "Estrella (relleno)", value: "pi-star-fill" },
  { label: "Media estrella", value: "pi-star-half-fill" },
  { label: "Corazón", value: "pi-heart" },
  { label: "Corazón (relleno)", value: "pi-heart-fill" },
  { label: "Bandera", value: "pi-flag" },
  { label: "Bandera (relleno)", value: "pi-flag-fill" },
  { label: "Marcador", value: "pi-bookmark" },
  { label: "Marcador (relleno)", value: "pi-bookmark-fill" },
  { label: "Chincheta", value: "pi-thumbtack" },
  { label: "Campana", value: "pi-bell" },
  { label: "Campana silenciada", value: "pi-bell-slash" },
  { label: "Megáfono", value: "pi-megaphone" },
  { label: "Entrada/Ticket", value: "pi-ticket" },
  { label: "Etiqueta", value: "pi-tag" },
  { label: "Etiquetas", value: "pi-tags" },

  // Personas
  { label: "Usuario", value: "pi-user" },
  { label: "Usuarios", value: "pi-users" },
  { label: "Usuario +", value: "pi-user-plus" },
  { label: "Usuario -", value: "pi-user-minus" },
  { label: "Usuario (editar)", value: "pi-user-edit" },
  { label: "Libreta de contactos", value: "pi-address-book" },
  { label: "Credencial", value: "pi-id-card" },

  // Institucional / laboral
  { label: "Maletín", value: "pi-briefcase" },
  { label: "Edificio", value: "pi-building" },
  { label: "Institución", value: "pi-building-columns" },
  { label: "Almacén", value: "pi-warehouse" },
  { label: "Tienda", value: "pi-shop" },
  { label: "Carrito de compras", value: "pi-shopping-cart" },
  { label: "Bolsa de compras", value: "pi-shopping-bag" },
  { label: "Billetera", value: "pi-wallet" },
  { label: "Tarjeta de crédito", value: "pi-credit-card" },
  { label: "Recibo", value: "pi-receipt" },
  { label: "Dinero", value: "pi-money-bill" },

  // Educación / ideas
  { label: "Libro", value: "pi-book" },
  { label: "Graduación", value: "pi-graduation-cap" },
  { label: "Idea", value: "pi-lightbulb" },
  { label: "Brújula", value: "pi-compass" },
  { label: "Paleta", value: "pi-palette" },
  { label: "Corona", value: "pi-crown" },
  { label: "Verificado", value: "pi-verified" },
  { label: "Destellos", value: "pi-sparkles" },

  // Lugares / naturaleza
  { label: "Inicio", value: "pi-home" },
  { label: "Ubicación", value: "pi-map-marker" },
  { label: "Mapa", value: "pi-map" },
  { label: "Global", value: "pi-globe" },
  { label: "Sol", value: "pi-sun" },
  { label: "Luna", value: "pi-moon" },
  { label: "Nube", value: "pi-cloud" },

  // Estados / avisos
  { label: "Regalo", value: "pi-gift" },
  { label: "Trofeo", value: "pi-trophy" },
  { label: "Escudo", value: "pi-shield" },
  { label: "Alerta", value: "pi-exclamation-triangle" },
  { label: "Advertencia", value: "pi-exclamation-circle" },
  { label: "Prohibido", value: "pi-ban" },
  { label: "Información", value: "pi-info-circle" },
  { label: "Confirmado", value: "pi-check-circle" },
  { label: "Pregunta", value: "pi-question-circle" },
  { label: "Cancelado", value: "pi-times-circle" },

  // Documentos / medios
  { label: "Archivo", value: "pi-file" },
  { label: "Carpeta", value: "pi-folder" },
  { label: "Carpeta abierta", value: "pi-folder-open" },
  { label: "Imagen", value: "pi-image" },
  { label: "Imágenes", value: "pi-images" },
  { label: "Video", value: "pi-video" },
  { label: "Cámara", value: "pi-camera" },
  { label: "Micrófono", value: "pi-microphone" },
  { label: "Auriculares", value: "pi-headphones" },
  { label: "Impresora", value: "pi-print" },
  { label: "Portapapeles", value: "pi-clipboard" },
  { label: "Sujetapapeles", value: "pi-paperclip" },

  // Comunicación
  { label: "Correo", value: "pi-envelope" },
  { label: "Enviar", value: "pi-send" },
  { label: "Teléfono", value: "pi-phone" },
  { label: "Celular", value: "pi-mobile" },
  { label: "Escritorio", value: "pi-desktop" },
  { label: "Comentario", value: "pi-comment" },
  { label: "Comentarios", value: "pi-comments" },

  // Seguridad
  { label: "Candado", value: "pi-lock" },
  { label: "Candado abierto", value: "pi-lock-open" },
  { label: "Llave", value: "pi-key" },
  { label: "Ojo", value: "pi-eye" },

  // Herramientas / transporte
  { label: "Herramienta", value: "pi-wrench" },
  { label: "Martillo", value: "pi-hammer" },
  { label: "Auto", value: "pi-car" },
  { label: "Camión", value: "pi-truck" },

  // Datos
  { label: "Gráfico de barras", value: "pi-chart-bar" },
  { label: "Gráfico de líneas", value: "pi-chart-line" },
  { label: "Gráfico circular", value: "pi-chart-pie" },
  { label: "Lista", value: "pi-list" },
  { label: "Tabla", value: "pi-table" },
  { label: "Cuadrícula", value: "pi-th-large" },
];

export function iconOptionTemplate(option: { label: string; value: string }) {
  return (
    <div className="d-flex align-items-center" style={{ gap: "8px" }}>
      <i className={`pi ${option.value}`} style={{ fontSize: "0.85rem" }} />
      <span>{option.label}</span>
    </div>
  );
}

export default function CalendarCategoryPage() {
  const toast = useRef<Toast>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [form, setForm] = useState<CategoryForm>({ name: "", colour: "#000000", icon: "" });
  const [touched, setTouched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [paginatorFirst, setPaginatorFirst] = useState(0);
  const [paginatorRows, setPaginatorRows] = useState(10);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [categoryToModify, setCategoryToModify] = useState<CategoryItem | null>(null);
  const [modifyForm, setModifyForm] = useState<CategoryForm>({ name: "", colour: DEFAULT_COLOUR, icon: DEFAULT_ICON });
  const [modifyTouched, setModifyTouched] = useState(false);
  const [loadingModify, setLoadingModify] = useState(false);

  useEffect(() => { load(); }, []);

  useEffect(() => { setPaginatorFirst(0); }, [searchTerm, sortOrder]);

  async function load() {
    if (loading) return;
    setLoading(true);
    try {
      setCategories(await getCalendarCategories());
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar las categorías" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.name || !form.colour) return;
    setLoadingAction(true);
    try {
      const resp = await createCalendarCategory({ description: form.name, colour: form.colour, icon: form.icon });
      setCategories((prev) => [...prev, resp.category ?? resp.important_date_category ?? resp]);
      toast.current?.show({ severity: "success", summary: "Categoría creada" });
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function limpiar() {
    setForm({ name: "", colour: "#000000", icon: "" });
    setTouched(false);
  }

  function abrirModificar(category: CategoryItem) {
    setCategoryToModify(category);
    setModifyForm({ name: category.description ?? category.name, colour: category.colour, icon: category.icon || DEFAULT_ICON });
    setModifyTouched(false);
  }

  function cerrarModificar() {
    setCategoryToModify(null);
    setModifyForm({ name: "", colour: DEFAULT_COLOUR, icon: DEFAULT_ICON });
    setModifyTouched(false);
  }

  async function handleModifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setModifyTouched(true);
    if (!modifyForm.name || !modifyForm.colour || !categoryToModify) return;
    setLoadingModify(true);
    try {
      const resp = await updateCalendarCategory({ description: modifyForm.name, colour: modifyForm.colour, icon: modifyForm.icon }, categoryToModify.id);
      setCategories((prev) => prev.map((c) => (c.id === categoryToModify.id ? resp.category ?? resp.important_date_category ?? { ...c, ...modifyForm } : c)));
      toast.current?.show({ severity: "success", summary: "Categoría modificada" });
      cerrarModificar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingModify(false);
    }
  }

  async function confirmarEliminacion() {
    if (!categoryToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteCalendarCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      toast.current?.show({ severity: "success", summary: "Categoría eliminada" });
      setCategoryToDelete(null);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar la categoría" });
    } finally {
      setLoadingDelete(false);
    }
  }

const filtered = (searchTerm
    ? categories.filter((c) => (c.description ?? c.name)?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [...categories]
  ).sort((a, b) => {
    const cmp = (a.description ?? a.name ?? "").localeCompare(b.description ?? b.name ?? "");
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const modifyDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar categoría</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{categoryToModify?.name}</small>
      </div>
    </div>
  );

  const deleteDialogHeader = (
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

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-tags" style={{ color: "#eab308", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Categorías de calendario</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de categorías de eventos importantes</small>
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
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-plus-circle" style={{ color: "#eab308", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nueva categoría</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Completá los datos para crear una categoría</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
              <div className="row">
                <div className="col-12 col-md-4 mb-3">
                  <label className="profile-field-label">Nombre *</label>
                  <input
                    className="profile-input"
                    type="text"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  {touched && !form.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
                <div className="col-12 col-md-4 mb-3">
                  <label className="profile-field-label">Ícono</label>
                  <Dropdown
                    value={form.icon}
                    options={ICON_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    itemTemplate={iconOptionTemplate}
                    valueTemplate={(option) => (option ? iconOptionTemplate(option) : <span>Seleccioná un ícono</span>)}
                    onChange={(e) => setForm((p) => ({ ...p, icon: e.value }))}
                    placeholder="Seleccioná un ícono"
                    filter
                    filterPlaceholder="Buscar ícono…"
                    emptyFilterMessage="Sin resultados"
                    className="profile-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>
                <div className="col-12 col-md-4 mb-3">
                  <label className="profile-field-label">Color *</label>
                  <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                    <input
                      type="color"
                      value={form.colour}
                      onChange={(e) => setForm((p) => ({ ...p, colour: e.target.value }))}
                      style={{ width: 40, height: 40, padding: 2, border: "1.5px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", flexShrink: 0 }}
                    />
                    <input
                      className="profile-input"
                      type="text"
                      placeholder="#2196f3"
                      value={form.colour}
                      onChange={(e) => setForm((p) => ({ ...p, colour: e.target.value }))}
                    />
                  </div>
                  {touched && !form.colour && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
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
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-list" style={{ color: "#eab308", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Listado</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{categories.length} {categories.length === 1 ? "categoría en total" : "categorías totales"}</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>

            {/* Filter bar */}
            {(categories.length > 0 || searchTerm) && (
              <div className="license-filter-bar mb-3">
                <div className="license-filter-bar-inputs">
                  <div className={`license-filter-input-wrap${searchTerm ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-search license-filter-icon" />
                    <input
                      className="license-filter-input"
                      style={{ paddingLeft: "32px" }}
                      placeholder="Buscar categoría por nombre…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="license-filter-input-wrap license-filter-input-wrap--active">
                    <i className={`pi ${sortOrder === "asc" ? "pi-sort-alpha-down" : "pi-sort-alpha-up"} license-filter-icon`} />
                    <Dropdown
                      value={sortOrder}
                      options={SORT_OPTIONS}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => setSortOrder(e.value)}
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel"
                    />
                  </div>
                </div>
                {searchTerm && (
                  <button type="button" className="license-filter-clear" onClick={() => setSearchTerm("")}>
                    <i className="pi pi-times" /> Limpiar
                  </button>
                )}
              </div>
            )}

            {/* Loading skeleton */}
            {loading ? (
              <SkeletonRows />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["COLOR", "NOMBRE", ""].map((h, i) => (
                        <th key={i} style={{ width: i === 0 ? "1%" : undefined, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", padding: "0 8px 10px", textAlign: i === 2 ? "right" : "left", borderBottom: "1.5px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: "40px", textAlign: "center" }}>
                          <i className="pi pi-inbox" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                            {searchTerm
                              ? `No se encontraron categorías con el nombre "${searchTerm}".`
                              : "No hay categorías disponibles para mostrar."}
                          </p>
                        </td>
                      </tr>
                    )}
                    {filtered.slice(paginatorFirst, paginatorFirst + paginatorRows).map((category) => (
                      <tr
                        key={category.id}
                        className="fadeIn animated"
                        onMouseEnter={() => setHoveredRow(category.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: hoveredRow === category.id ? "rgba(74,108,247,0.06)" : "transparent", transition: "background 0.15s" }}
                      >
                        <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background: category.colour,
                              border: "1.5px solid rgba(0,0,0,0.06)",
                            }}
                          >
                            <i className={`pi ${category.icon || DEFAULT_ICON}`} style={{ fontSize: "0.7rem", color: "#fff" }} />
                          </span>
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <span className="license-cell-primary">{category.description ?? category.name}</span>
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div className="d-flex align-items-center justify-content-end" style={{ gap: "6px" }}>
                            <Tooltip label="Modificar">
                              <button
                                type="button"
                                onClick={() => abrirModificar(category)}
                                className="license-action-btn"
                              >
                                <i className="pi pi-pencil" />
                              </button>
                            </Tooltip>
                            <Tooltip label="Eliminar">
                              <button
                                type="button"
                                onClick={() => setCategoryToDelete(category)}
                                style={{ background: "none", border: "1.5px solid #fecdd3", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#dc3545", height: "30px" }}
                              >
                                <i className="pi pi-trash" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator
                  first={paginatorFirst}
                  rows={paginatorRows}
                  totalRecords={filtered.length}
                  rowsPerPageOptions={[10, 15, 20]}
                  onPageChange={(e) => { setPaginatorFirst(e.first); setPaginatorRows(e.rows); }}
                  rightContent={
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                      {filtered.length} {filtered.length === 1 ? "categoría" : "categorías"}
                    </span>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modify category dialog */}
      <Dialog
        header={modifyDialogHeader}
        visible={!!categoryToModify}
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
                form="modify-category-form"
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
        <form id="modify-category-form" onSubmit={handleModifySubmit} noValidate>
          <div className="mb-3">
            <label className="profile-field-label">Nombre *</label>
            <input
              className="profile-input"
              type="text"
              maxLength={100}
              value={modifyForm.name}
              onChange={(e) => setModifyForm((p) => ({ ...p, name: e.target.value }))}
            />
            {modifyTouched && !modifyForm.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
          <div className="mb-3">
            <label className="profile-field-label">Ícono</label>
            <Dropdown
              value={modifyForm.icon}
              options={ICON_OPTIONS}
              optionLabel="label"
              optionValue="value"
              itemTemplate={iconOptionTemplate}
              valueTemplate={(option) => (option ? iconOptionTemplate(option) : <span>Seleccioná un ícono</span>)}
              onChange={(e) => setModifyForm((p) => ({ ...p, icon: e.value }))}
              placeholder="Seleccioná un ícono"
              filter
              filterPlaceholder="Buscar ícono…"
              emptyFilterMessage="Sin resultados"
              className="profile-dropdown"
              panelClassName="license-filter-dropdown-panel"
            />
          </div>
          <div className="mb-1">
            <label className="profile-field-label">Color *</label>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <input
                type="color"
                value={modifyForm.colour}
                onChange={(e) => setModifyForm((p) => ({ ...p, colour: e.target.value }))}
                style={{ width: 40, height: 40, padding: 2, border: "1.5px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", flexShrink: 0 }}
              />
              <input
                className="profile-input"
                type="text"
                placeholder="#2196f3"
                value={modifyForm.colour}
                onChange={(e) => setModifyForm((p) => ({ ...p, colour: e.target.value }))}
              />
            </div>
            {modifyTouched && !modifyForm.colour && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
        </form>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        header={deleteDialogHeader}
        visible={!!categoryToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setCategoryToDelete(null)}
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
                onClick={() => setCategoryToDelete(null)}
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
          Está a punto de eliminar la categoría <strong>{categoryToDelete?.name}</strong>.
        </p>
      </Dialog>
    </>
  );
}
