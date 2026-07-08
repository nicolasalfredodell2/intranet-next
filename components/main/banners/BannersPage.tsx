"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { ProgressBar } from "primereact/progressbar";
import { listBanners, createBanner, modificateBanner, deleteBanner, deleteBannerImage } from "@/lib/services/banners.service";
import { getAllNotes } from "@/lib/services/notes.service";

addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Limpiar",
});

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/;

function getToday(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateForInput(s: string | null): string {
  if (!s) return "";
  return s.split(" ")[0].split("T")[0];
}

function formatDateDisplay(s: string | null): string {
  const iso = formatDateForInput(s);
  if (!iso) return "--";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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
            <div style={{ width: "100%", height: 180, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
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

function FileDropzone({ label, file, onFile, onClear }: { label: string; file: File | null; onFile: (f: File) => void; onClear: () => void }) {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(file)} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} />
          <button type="button" className="btn btn-danger btn-sm rounded-circle position-absolute" style={{ top: 2, right: 2, width: 22, height: 22, padding: 0, fontSize: 10 }} onClick={(e) => { e.stopPropagation(); onClear(); }}>×</button>
        </div>
      )}
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
  const [previewImage, setPreviewImage] = useState<{ horizontal: string; vertical: string; name: string; orientation: "horizontal" | "vertical" } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", published_at: "", unpublished_at: "",
    is_internal: false, is_external: false,
    external_url: "", note_id: "",
  });

  const [fileHorizontal, setFileHorizontal] = useState<File | null>(null);
  const [fileVertical, setFileVertical] = useState<File | null>(null);

  const [modifyForm, setModifyForm] = useState({
    name: "", published_at: "", unpublished_at: "",
    is_internal: false, is_external: false,
    external_url: "", note_id: "",
  });
  const [modifyTouched, setModifyTouched] = useState(false);
  const [loadingModify, setLoadingModify] = useState(false);
  const [modifyFileHorizontal, setModifyFileHorizontal] = useState<File | null>(null);
  const [modifyFileVertical, setModifyFileVertical] = useState<File | null>(null);
  const [fileHorizModif, setFileHorizModif] = useState<any>(null);
  const [fileVertModif, setFileVertModif] = useState<any>(null);
  const [isDeletingHoriz, setIsDeletingHoriz] = useState(false);
  const [isDeletingVert, setIsDeletingVert] = useState(false);


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

  function handleModifyFileHoriz(f: File) {
    if (!ACCEPTED.includes(f.type)) { toast.current?.show({ severity: "info", summary: `${f.name} no es válido.` }); return; }
    if (f.size > MAX_SIZE) { toast.current?.show({ severity: "info", summary: `${f.name} pesa más de 5MB.` }); return; }
    setModifyFileHorizontal(f);
  }

  function handleModifyFileVert(f: File) {
    if (!ACCEPTED.includes(f.type)) { toast.current?.show({ severity: "info", summary: `${f.name} no es válido.` }); return; }
    if (f.size > MAX_SIZE) { toast.current?.show({ severity: "info", summary: `${f.name} pesa más de 5MB.` }); return; }
    setModifyFileVertical(f);
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

  function isValid(f: typeof form): boolean {
    if (!f.name || !f.published_at || !f.unpublished_at) return false;
    if (f.is_external && f.external_url && !URL_PATTERN.test(f.external_url)) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid(form)) return;
    if (!fileHorizontal || !fileVertical) {
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
    fd.append("img_horizontal", fileHorizontal, fileHorizontal.name);
    fd.append("img_vertical", fileVertical, fileVertical.name);

    try {
      const resp = await createBanner(fd);
      setBanners((prev) => [...prev, resp.banner]);
      toast.current?.show({ severity: "success", summary: "Banner creado" });
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  function limpiar() {
    setForm({ name: "", published_at: "", unpublished_at: "", is_internal: false, is_external: false, external_url: "", note_id: "" });
    setFileHorizontal(null); setFileVertical(null); setTouched(false);
  }

  function abrirModificar(banner: any) {
    setBannerParaModificar(banner);
    setModifyForm({
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
    setModifyFileHorizontal(null);
    setModifyFileVertical(null);
    setModifyTouched(false);
  }

  function cerrarModificar() {
    setBannerParaModificar(null);
    setModifyForm({ name: "", published_at: "", unpublished_at: "", is_internal: false, is_external: false, external_url: "", note_id: "" });
    setModifyFileHorizontal(null);
    setModifyFileVertical(null);
    setFileHorizModif(null);
    setFileVertModif(null);
    setModifyTouched(false);
  }

  async function handleModifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setModifyTouched(true);
    if (!isValid(modifyForm) || !bannerParaModificar) return;
    setLoadingModify(true);
    const fd = new FormData();
    fd.append("name", modifyForm.name);
    fd.append("published_at", modifyForm.published_at);
    fd.append("unpublished_at", modifyForm.unpublished_at);
    if (modifyForm.external_url) fd.append("external_url", modifyForm.external_url);
    if (modifyForm.note_id) fd.append("note_id", modifyForm.note_id);
    if (modifyFileHorizontal) fd.append("img_horizontal", modifyFileHorizontal, modifyFileHorizontal.name);
    if (modifyFileVertical) fd.append("img_vertical", modifyFileVertical, modifyFileVertical.name);

    try {
      const resp = await modificateBanner(fd, bannerParaModificar.id);
      setBanners((prev) => prev.map((b) => b.id === bannerParaModificar.id ? resp.banner ?? b : b));
      toast.current?.show({ severity: "success", summary: "Banner modificado" });
      cerrarModificar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingModify(false);
    }
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

  const SORT_OPTIONS = [
    { label: "Nombre (A-Z)", value: "name_asc" },
    { label: "Nombre (Z-A)", value: "name_desc" },
    { label: "Vigencia", value: "vigencia" },
    { label: "Fecha de creación", value: "created_at" },
  ];

  const filtered = (searchTerm
    ? banners.filter((b) => b.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : banners
  ).slice().sort((a, b) => {
    switch (sortBy) {
      case "name_asc":
        return (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" });
      case "name_desc":
        return (b.name ?? "").localeCompare(a.name ?? "", "es", { sensitivity: "base" });
      case "created_at":
        return formatDateForInput(b.created_at).localeCompare(formatDateForInput(a.created_at));
      default:
        return formatDateForInput(a.published_at).localeCompare(formatDateForInput(b.published_at));
    }
  });

  const modifyDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar banner</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{bannerParaModificar?.name}</small>
      </div>
    </div>
  );

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
      <AppToast ref={toast} position="bottom-center" />

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

        {/* Create form card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-plus-circle" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nuevo banner</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Completá los datos para crear un banner</small>
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
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  {touched && !form.name && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Vigencia (desde - hasta) *</label>
                  <div className={`license-filter-input-wrap${form.published_at || form.unpublished_at ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-calendar license-filter-icon" />
                    <Calendar
                      value={form.published_at
                        ? [new Date(`${form.published_at}T00:00:00`), form.unpublished_at ? new Date(`${form.unpublished_at}T00:00:00`) : null]
                        : null}
                      onChange={(e) => {
                        const [start, end] = (e.value as (Date | null)[] | null) ?? [null, null];
                        setForm((p) => ({
                          ...p,
                          published_at: start ? toDateInputValue(start) : "",
                          unpublished_at: end ? toDateInputValue(end) : "",
                        }));
                      }}
                      selectionMode="range"
                      readOnlyInput
                      dateFormat="dd/mm/yy"
                      locale="es"
                      showButtonBar
                      minDate={new Date(`${today}T00:00:00`)}
                      placeholder="Seleccioná el rango de fechas"
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                    />
                  </div>
                  {touched && (!form.published_at || !form.unpublished_at) && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12 col-md-6">
                  <label className="profile-field-label">Imagen horizontal</label>
                  <FileDropzone label="Arrastre o haga click para subir imagen horizontal" file={fileHorizontal} onFile={handleFileHoriz} onClear={() => setFileHorizontal(null)} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="profile-field-label">Imagen vertical</label>
                  <FileDropzone label="Arrastre o haga click para subir imagen vertical" file={fileVertical} onFile={handleFileVert} onClear={() => setFileVertical(null)} />
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

              <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                <button
                  disabled={loading}
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                  {loading ? "Creando..." : "Crear banner"}
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
                  <div className="license-filter-input-wrap license-filter-input-wrap--active">
                    <i className="pi pi-sort-alt license-filter-icon" />
                    <Dropdown
                      value={sortBy}
                      options={SORT_OPTIONS}
                      onChange={(e) => setSortBy(e.value)}
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
                        <div style={{ position: "relative", width: "100%", height: 180, flexShrink: 0 }}>
                          <img
                            src={`${banner.image_horizontal_url}`}
                            alt={banner.name}
                            onClick={() => setPreviewImage({ horizontal: banner.image_horizontal_url, vertical: banner.image_vertical_url, name: banner.name, orientation: "horizontal" })}
                            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in", display: "block", transition: "opacity 0.15s", opacity: hoveredCard === banner.id ? 0.85 : 1 }}
                          />
                          <div
                            onClick={() => setPreviewImage({ horizontal: banner.image_horizontal_url, vertical: banner.image_vertical_url, name: banner.name, orientation: "horizontal" })}
                            style={{
                              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              opacity: hoveredCard === banner.id ? 1 : 0,
                              transition: "opacity 0.15s",
                              pointerEvents: hoveredCard === banner.id ? "auto" : "none",
                              cursor: "zoom-in",
                            }}
                          >
                            <span style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(30,41,59,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <i className="pi pi-search-plus" style={{ color: "#fff", fontSize: "1.1rem" }} />
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex-grow-1" style={{ padding: "14px" }}>
                        <p className="mb-1 font-weight-bold" style={{ fontSize: "0.9rem", color: "#1e293b" }}>{banner.name}</p>
                        <p className="mb-0" style={{ fontSize: "0.82rem", color: "#64748b" }}>
                          {formatDateDisplay(banner.published_at)} — {formatDateDisplay(banner.unpublished_at)}
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-end px-3 pb-3 pt-2" style={{ gap: "6px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        {(banner.note_id || banner.external_url) && (
                          <Tooltip label={banner.note_id ? "Ver nota interna" : "Ver enlace externo"}>
                            <button
                              type="button"
                              onClick={() => {
                                const url = banner.note_id ? `/institucional/noticia/${banner.note_id}` : banner.external_url;
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                              style={{ background: "none", border: "1.5px solid #d1fae5", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#059669" }}
                            >
                              <i className="pi pi-external-link" style={{ fontSize: "0.85rem" }} />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip label="Modificar">
                          <button
                            type="button"
                            onClick={() => abrirModificar(banner)}
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

      {/* Image preview dialog */}
      <Dialog
        header={previewImage?.name}
        visible={!!previewImage}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ width: "min(90vw, 900px)" }}
        onHide={() => setPreviewImage(null)}
      >
        {previewImage && (
          <div style={{ display: "grid" }}>
            <img
              src={previewImage.orientation === "horizontal" ? previewImage.horizontal : previewImage.vertical}
              alt={previewImage.name}
              style={{ gridArea: "1 / 1", width: "100%", height: "auto", borderRadius: "8px", display: "block" }}
            />
            {previewImage.horizontal && previewImage.vertical && (
              <div style={{ gridArea: "1 / 1", position: "sticky", top: "14px", alignSelf: "start", justifySelf: "center", zIndex: 2 }}>
                <button
                  type="button"
                  onClick={() => setPreviewImage((p) => p ? { ...p, orientation: p.orientation === "horizontal" ? "vertical" : "horizontal" } : p)}
                  className="d-flex align-items-center"
                  style={{
                    gap: "6px", borderRadius: "20px", fontWeight: 600, fontSize: "0.82rem", padding: "6px 16px",
                    background: "rgba(30,41,59,0.65)", color: "#fff", border: "none",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                  }}
                >
                  <i className="pi pi-sync" style={{ fontSize: "0.78rem" }} />
                  Ver {previewImage.orientation === "horizontal" ? "vertical" : "horizontal"}
                </button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Modify banner dialog */}
      <Dialog
        header={modifyDialogHeader}
        visible={!!bannerParaModificar}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "min(720px, 94vw)" }}
        onHide={cerrarModificar}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="modify-banner-form"
                disabled={loadingModify}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingModify ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingModify ? "Modificando..." : "Modificar"}
              </button>
              <button
                type="button"
                disabled={loadingModify}
                onClick={cerrarModificar}
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
        <form id="modify-banner-form" onSubmit={handleModifySubmit} noValidate>
          <div className="row">
            <div className="col-12 col-md-6 mb-3">
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
            <div className="col-12 col-md-6 mb-3">
              <label className="profile-field-label">Vigencia (desde - hasta) *</label>
              <div className={`license-filter-input-wrap${modifyForm.published_at || modifyForm.unpublished_at ? " license-filter-input-wrap--active" : ""}`}>
                <i className="pi pi-calendar license-filter-icon" />
                <Calendar
                  value={modifyForm.published_at
                    ? [new Date(`${modifyForm.published_at}T00:00:00`), modifyForm.unpublished_at ? new Date(`${modifyForm.unpublished_at}T00:00:00`) : null]
                    : null}
                  onChange={(e) => {
                    const [start, end] = (e.value as (Date | null)[] | null) ?? [null, null];
                    setModifyForm((p) => ({
                      ...p,
                      published_at: start ? toDateInputValue(start) : "",
                      unpublished_at: end ? toDateInputValue(end) : "",
                    }));
                  }}
                  selectionMode="range"
                  readOnlyInput
                  dateFormat="dd/mm/yy"
                  locale="es"
                  showButtonBar
                  placeholder="Seleccioná el rango de fechas"
                  className="license-filter-dropdown"
                  panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                />
              </div>
              {modifyTouched && (!modifyForm.published_at || !modifyForm.unpublished_at) && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-12 col-md-6">
              <label className="profile-field-label">Imagen horizontal</label>
              {fileHorizModif && (
                <div className="mb-2 d-flex align-items-center" style={{ gap: "8px" }}>
                  <img src={`${fileHorizModif.path_url}`} alt="" style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 4 }} />
                  {!isDeletingHoriz && <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteImage("horizontal")}>Quitar</button>}
                  {isDeletingHoriz && <i className="pi pi-spin pi-spinner" />}
                </div>
              )}
              <FileDropzone label="Arrastre o haga click para subir imagen horizontal" file={modifyFileHorizontal} onFile={handleModifyFileHoriz} onClear={() => setModifyFileHorizontal(null)} />
            </div>
            <div className="col-12 col-md-6">
              <label className="profile-field-label">Imagen vertical</label>
              {fileVertModif && (
                <div className="mb-2 d-flex align-items-center" style={{ gap: "8px" }}>
                  <img src={`${fileVertModif.path_url}`} alt="" style={{ width: 50, height: 80, objectFit: "cover", borderRadius: 4 }} />
                  {!isDeletingVert && <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteImage("vertical")}>Quitar</button>}
                  {isDeletingVert && <i className="pi pi-spin pi-spinner" />}
                </div>
              )}
              <FileDropzone label="Arrastre o haga click para subir imagen vertical" file={modifyFileVertical} onFile={handleModifyFileVert} onClear={() => setModifyFileVertical(null)} />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="d-flex" style={{ gap: "16px" }}>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="chkModifyInternal" checked={modifyForm.is_internal}
                    onChange={(e) => setModifyForm((p) => ({ ...p, is_internal: e.target.checked, is_external: e.target.checked ? false : p.is_external, external_url: e.target.checked ? "" : p.external_url, note_id: e.target.checked ? p.note_id : "" }))} />
                  <label className="form-check-label" htmlFor="chkModifyInternal">Nota Interna</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="chkModifyExternal" checked={modifyForm.is_external}
                    onChange={(e) => setModifyForm((p) => ({ ...p, is_external: e.target.checked, is_internal: e.target.checked ? false : p.is_internal, note_id: e.target.checked ? "" : p.note_id, external_url: e.target.checked ? p.external_url : "" }))} />
                  <label className="form-check-label" htmlFor="chkModifyExternal">URL Externa</label>
                </div>
              </div>
            </div>
            {modifyForm.is_internal && (
              <div className="col-12 col-md-6 mt-2 fadeIn animated">
                <label className="profile-field-label">Nota</label>
                <div className={`license-filter-input-wrap${modifyForm.note_id ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-file license-filter-icon" />
                  <Dropdown
                    value={modifyForm.note_id || null}
                    options={notes}
                    optionLabel="title"
                    optionValue="id"
                    onChange={(e) => setModifyForm((p) => ({ ...p, note_id: e.value ?? "" }))}
                    placeholder="Seleccioná una nota"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                    showClear={!!modifyForm.note_id}
                    emptyMessage="Sin notas"
                  />
                </div>
              </div>
            )}
            {modifyForm.is_external && (
              <div className="col-12 col-md-6 mt-2 fadeIn animated">
                <label className="profile-field-label">URL Externa</label>
                <input className="profile-input" type="text" placeholder="https://..." value={modifyForm.external_url} onChange={(e) => setModifyForm((p) => ({ ...p, external_url: e.target.value }))} />
                {modifyTouched && modifyForm.is_external && modifyForm.external_url && !URL_PATTERN.test(modifyForm.external_url) && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* URL no válida</small>}
              </div>
            )}
          </div>
        </form>
      </Dialog>

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
