"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { ProgressBar } from "primereact/progressbar";
import { listBanners, createBanner, modificateBanner, deleteBanner, deleteBannerImage } from "@/lib/services/banners.service";
import { getAllNotes } from "@/lib/services/notes.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/;

function getToday(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function formatDateForInput(s: string | null): string {
  if (!s) return "";
  return s.split(" ")[0].split("T")[0];
}

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

function SkeletonCards() {
  return (
    <div className="row">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="col-12 col-md-6 col-lg-4 mb-3">
          <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: 110, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
            <div style={{ padding: "14px" }}>
              <div style={{ width: "60%", height: 16, borderRadius: 6, marginBottom: 10, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
              <div style={{ width: "90%", height: 12, borderRadius: 6, marginBottom: 16, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
              <div style={{ width: "100%", height: 30, borderRadius: 8, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BannersPage() {
  const toast = useRef<Toast>(null);
  const today = getToday();

  const [banners, setBanners] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [touched, setTouched] = useState(false);
  const [bannerParaModificar, setBannerParaModificar] = useState<any>(null);
  const [bannerToDelete, setBannerToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", published_at: "", unpublished_at: "",
    is_internal: false, is_external: false,
    external_url: "", note_id: "",
  });

  const [fileHorizontal, setFileHorizontal] = useState<File | null>(null);
  const [fileVertical, setFileVertical] = useState<File | null>(null);
  const [fileHorizModif, setFileHorizModif] = useState<any>(null);
  const [fileVertModif, setFileVertModif] = useState<any>(null);
  const [isDeletingHoriz, setIsDeletingHoriz] = useState(false);
  const [isDeletingVert, setIsDeletingVert] = useState(false);

  const minUnpublished = form.published_at || today;
  const maxPublished = form.unpublished_at || "";

  useEffect(() => {
    loadBanners();
    loadNotes();
  }, []);

  async function loadBanners() {
    setLoadingBanners(true);
    try { setBanners(await listBanners()); } catch { toast.current?.show({ severity: "error", summary: "No se pudo cargar los banners" }); }
    finally { setLoadingBanners(false); }
  }

  async function loadNotes() {
    try { const r = await getAllNotes(); setNotes(r.data ?? []); } catch { /* silently fail */ }
  }

  function handleFileHoriz(f: File) {
    if (!ACCEPTED.includes(f.type)) { toast.current?.show({ severity: "info", summary: `${f.name} no es válido.` }); return; }
    if (f.size > MAX_SIZE) { toast.current?.show({ severity: "info", summary: `${f.name} pesa más de 5MB.` }); return; }
    setFileHorizontal(f);
  }

  function handleFileVert(f: File) {
    if (!ACCEPTED.includes(f.type)) { toast.current?.show({ severity: "info", summary: `${f.name} no es válido.` }); return; }
    if (f.size > MAX_SIZE) { toast.current?.show({ severity: "info", summary: `${f.name} pesa más de 5MB.` }); return; }
    setFileVertical(f);
  }

  async function handleDeleteImage(tipo: "horizontal" | "vertical") {
    if (!bannerParaModificar) return;
    const imageId = tipo === "horizontal" ? fileHorizModif?.id : fileVertModif?.id;
    if (!imageId) return;
    if (tipo === "horizontal") setIsDeletingHoriz(true); else setIsDeletingVert(true);
    try {
      await deleteBannerImage(bannerParaModificar.id, imageId);
      if (tipo === "horizontal") setFileHorizModif(null); else setFileVertModif(null);
      toast.current?.show({ severity: "success", summary: "Imagen eliminada" });
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar la imagen" }); }
    finally { if (tipo === "horizontal") setIsDeletingHoriz(false); else setIsDeletingVert(false); }
  }

  function isValid(): boolean {
    if (!form.name || !form.published_at || !form.unpublished_at) return false;
    if (form.is_external && form.external_url && !URL_PATTERN.test(form.external_url)) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid()) return;
    if (!bannerParaModificar && (!fileHorizontal || !fileVertical)) {
      toast.current?.show({ severity: "info", summary: "Debe agregar ambas imágenes (horizontal y vertical)" });
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("published_at", form.published_at);
    fd.append("unpublished_at", form.unpublished_at);
    if (form.external_url) fd.append("external_url", form.external_url);
    if (form.note_id) fd.append("note_id", form.note_id);
    if (fileHorizontal) fd.append("img_horizontal", fileHorizontal, fileHorizontal.name);
    if (fileVertical) fd.append("img_vertical", fileVertical, fileVertical.name);

    try {
      if (bannerParaModificar) {
        const resp = await modificateBanner(fd, bannerParaModificar.id);
        setBanners((prev) => prev.map((b) => b.id === bannerParaModificar.id ? resp.banner ?? b : b));
        if (resp.image_horizontal) setFileHorizModif({ path_url: resp.image_horizontal.path_url, id: resp.image_horizontal.id });
        if (resp.image_vertical) setFileVertModif({ path_url: resp.image_vertical.path_url, id: resp.image_vertical.id });
        toast.current?.show({ severity: "success", summary: "Banner modificado" });
      } else {
        const resp = await createBanner(fd);
        setBanners((prev) => [...prev, resp.banner]);
        toast.current?.show({ severity: "success", summary: "Banner creado" });
      }
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  function llenarFormulario(banner: any) {
    setBannerParaModificar(banner);
    setForm({
      name: banner.name ?? "",
      published_at: formatDateForInput(banner.published_at),
      unpublished_at: formatDateForInput(banner.unpublished_at),
      is_internal: !!banner.note_id,
      is_external: !!banner.external_url,
      external_url: banner.external_url ?? "",
      note_id: banner.note_id ?? "",
    });
    setFileHorizModif(banner.image_horizontal ? { path_url: banner.image_horizontal_url, id: banner.image_horizontal.id } : null);
    setFileVertModif(banner.image_vertical ? { path_url: banner.image_vertical_url, id: banner.image_vertical.id } : null);
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiar() {
    setForm({ name: "", published_at: "", unpublished_at: "", is_internal: false, is_external: false, external_url: "", note_id: "" });
    setFileHorizontal(null); setFileVertical(null); setFileHorizModif(null); setFileVertModif(null);
    setBannerParaModificar(null); setTouched(false);
  }

  async function handleDeleteConfirm() {
    if (!bannerToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteBanner(bannerToDelete.id);
      setBanners((prev) => prev.filter((b) => b.id !== bannerToDelete.id));
      toast.current?.show({ severity: "success", summary: "Banner eliminado" });
      setBannerToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar el banner" }); }
    finally { setLoadingDelete(false); }
  }

  const filtered = (searchTerm
    ? banners.filter((b) => b.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : banners
  ).slice().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" }));

  const FileDropzone = ({ label, file, onFile, onClear }: { label: string; file: File | null; onFile: (f: File) => void; onClear: () => void }) => {
    const [drag, setDrag] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    return (
      <div className={`dropzone-area${drag ? " drag-over" : ""} text-center`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
        onClick={() => !file && ref.current?.click()}
      >
        <small className="text-muted">{label}</small>
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
        {file && (
          <div className="mt-2 position-relative d-inline-block">
            <img src={URL.createObjectURL(file)} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} />
            <button type="button" className="btn btn-danger btn-sm rounded-circle position-absolute" style={{ top: 2, right: 2, width: 22, height: 22, padding: 0, fontSize: 10 }} onClick={(e) => { e.stopPropagation(); onClear(); }}>×</button>
          </div>
        )}
      </div>
    );
  };

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar banner</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-images" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Banners</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de banners institucionales</small>
            </div>
            <button
              type="button"
              disabled={loadingBanners}
              onClick={loadBanners}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loadingBanners ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
        </div>

        {/* Create / modify form card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: bannerParaModificar ? "#eff6ff" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className={`pi ${bannerParaModificar ? "pi-pencil" : "pi-plus-circle"}`} style={{ color: bannerParaModificar ? "#3b82f6" : "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>
                {bannerParaModificar ? "Modificar banner" : "Nuevo banner"}
              </h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                {bannerParaModificar ? bannerParaModificar.name : "Completá los datos para crear un banner"}
              </small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Nombre *</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  {touched && !form.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
                <div className="col-6 col-md-3 mb-3">
                  <label className="profile-field-label">Fecha desde *</label>
                  <input
                    className="profile-input"
                    type="date"
                    min={today}
                    max={maxPublished}
                    value={form.published_at}
                    onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))}
                  />
                  {touched && !form.published_at && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
                <div className="col-6 col-md-3 mb-3">
                  <label className="profile-field-label">Fecha hasta *</label>
                  <input
                    className="profile-input"
                    type="date"
                    min={minUnpublished}
                    value={form.unpublished_at}
                    onChange={(e) => setForm((p) => ({ ...p, unpublished_at: e.target.value }))}
                  />
                  {touched && !form.unpublished_at && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12">
                  <div className="d-flex" style={{ gap: "16px" }}>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="chkInternal" checked={form.is_internal}
                        onChange={(e) => setForm((p) => ({ ...p, is_internal: e.target.checked, is_external: e.target.checked ? false : p.is_external, external_url: e.target.checked ? "" : p.external_url, note_id: e.target.checked ? p.note_id : "" }))} />
                      <label className="form-check-label" htmlFor="chkInternal">Nota Interna</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="chkExternal" checked={form.is_external}
                        onChange={(e) => setForm((p) => ({ ...p, is_external: e.target.checked, is_internal: e.target.checked ? false : p.is_internal, note_id: e.target.checked ? "" : p.note_id, external_url: e.target.checked ? p.external_url : "" }))} />
                      <label className="form-check-label" htmlFor="chkExternal">URL Externa</label>
                    </div>
                  </div>
                </div>
                {form.is_internal && (
                  <div className="col-12 col-md-6 mt-2 fadeIn animated">
                    <label className="profile-field-label">Nota</label>
                    <div className={`license-filter-input-wrap${form.note_id ? " license-filter-input-wrap--active" : ""}`}>
                      <i className="pi pi-file license-filter-icon" />
                      <Dropdown
                        value={form.note_id || null}
                        options={notes}
                        optionLabel="title"
                        optionValue="id"
                        onChange={(e) => setForm((p) => ({ ...p, note_id: e.value ?? "" }))}
                        placeholder="Seleccioná una nota"
                        className="license-filter-dropdown"
                        panelClassName="license-filter-dropdown-panel"
                        showClear={!!form.note_id}
                        emptyMessage="Sin notas"
                      />
                    </div>
                  </div>
                )}
                {form.is_external && (
                  <div className="col-12 col-md-6 mt-2 fadeIn animated">
                    <label className="profile-field-label">URL Externa</label>
                    <input className="profile-input" type="text" placeholder="https://..." value={form.external_url} onChange={(e) => setForm((p) => ({ ...p, external_url: e.target.value }))} />
                    {touched && form.is_external && form.external_url && !URL_PATTERN.test(form.external_url) && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* URL no válida</small>}
                  </div>
                )}
              </div>

              <div className="row mb-3">
                <div className="col-12 col-md-6">
                  <label className="profile-field-label">Imagen horizontal</label>
                  {bannerParaModificar && fileHorizModif && (
                    <div className="mb-2 d-flex align-items-center" style={{ gap: "8px" }}>
                      <img src={`${API_URL}${fileHorizModif.path_url}`} alt="" style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 4 }} />
                      {!isDeletingHoriz && <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteImage("horizontal")}>Quitar</button>}
                      {isDeletingHoriz && <i className="pi pi-spin pi-spinner" />}
                    </div>
                  )}
                  <FileDropzone label="Arrastre o haga click para subir imagen horizontal" file={fileHorizontal} onFile={handleFileHoriz} onClear={() => setFileHorizontal(null)} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="profile-field-label">Imagen vertical</label>
                  {bannerParaModificar && fileVertModif && (
                    <div className="mb-2 d-flex align-items-center" style={{ gap: "8px" }}>
                      <img src={`${API_URL}${fileVertModif.path_url}`} alt="" style={{ width: 50, height: 80, objectFit: "cover", borderRadius: 4 }} />
                      {!isDeletingVert && <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteImage("vertical")}>Quitar</button>}
                      {isDeletingVert && <i className="pi pi-spin pi-spinner" />}
                    </div>
                  )}
                  <FileDropzone label="Arrastre o haga click para subir imagen vertical" file={fileVertical} onFile={handleFileVert} onClear={() => setFileVertical(null)} />
                </div>
              </div>

              <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                <button
                  disabled={loading}
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                  {bannerParaModificar
                    ? (loading ? "Modificando..." : "Modificar")
                    : (loading ? "Creando..." : "Crear banner")}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={limpiar}
                  className="btn btn-light text-muted ml-auto"
                  style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
                >
                  Limpiar
                </button>
              </div>

              {loading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
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
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{banners.length} {banners.length === 1 ? "banner en total" : "banners totales"}</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>

            {/* Filter bar */}
            {(banners.length > 0 || searchTerm) && (
              <div className="license-filter-bar mb-3">
                <div className="license-filter-bar-inputs">
                  <div className={`license-filter-input-wrap${searchTerm ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-search license-filter-icon" />
                    <input
                      className="license-filter-input"
                      style={{ paddingLeft: "32px" }}
                      placeholder="Buscar banner por nombre…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
            {loadingBanners && <SkeletonCards />}

            {/* Banners grid */}
            {!loadingBanners && (
              <div className="row fadeIn animated">
                {filtered.map((banner) => (
                  <div key={banner.id} className="col-12 col-md-6 col-lg-4 mb-3">
                    <div
                      onMouseEnter={() => setHoveredCard(banner.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        overflow: "hidden",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: hoveredCard === banner.id ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      {banner.image_horizontal_url && (
                        <img src={`${API_URL}${banner.image_horizontal_url}`} alt={banner.name} style={{ width: "100%", height: 110, objectFit: "cover" }} />
                      )}
                      <div className="flex-grow-1" style={{ padding: "14px" }}>
                        <p className="mb-1 font-weight-bold" style={{ fontSize: "0.9rem", color: "#1e293b" }}>{banner.name}</p>
                        <p className="mb-0" style={{ fontSize: "0.82rem", color: "#64748b" }}>
                          {formatDateForInput(banner.published_at)} — {formatDateForInput(banner.unpublished_at)}
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-end px-3 pb-3 pt-2" style={{ gap: "6px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        <Tooltip label="Modificar">
                          <button
                            type="button"
                            onClick={() => llenarFormulario(banner)}
                            style={{ background: "none", border: "1.5px solid #dbeafe", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#3b82f6" }}
                          >
                            <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Eliminar">
                          <button
                            type="button"
                            onClick={() => setBannerToDelete(banner)}
                            style={{ background: "none", border: "1.5px solid #fecdd3", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#dc3545" }}
                          >
                            <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}

                {banners.length === 0 && (
                  <div className="col-12" style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-images" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>No hay banners disponibles para mostrar.</p>
                  </div>
                )}
                {banners.length > 0 && filtered.length === 0 && (
                  <div className="col-12" style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-search" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                      No se encontraron banners con el nombre &quot;{searchTerm}&quot;.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        header={deleteDialogHeader}
        visible={!!bannerToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setBannerToDelete(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingDelete}
                onClick={handleDeleteConfirm}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingDelete ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {loadingDelete ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={loadingDelete}
                onClick={() => setBannerToDelete(null)}
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
          Está a punto de eliminar el banner <strong>{bannerToDelete?.name}</strong>.
        </p>
      </Dialog>
    </>
  );
}
