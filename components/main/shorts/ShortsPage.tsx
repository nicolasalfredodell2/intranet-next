"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { ProgressBar } from "primereact/progressbar";
import { listShorts, createShort, modificateShort, deleteShort } from "@/lib/services/shorts.service";

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

const IMG_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 52428800; // 50MB
const VIDEO_LABEL = "50 MB";
const IMG_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

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
        <div key={i} className="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
          <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: 220, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
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

function FileDropzone({ label, file, accept, onFile, onClear, showPreview }: { label: string; file: File | null; accept: string; onFile: (f: File) => void; onClear: () => void; showPreview?: boolean }) {
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
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
      {file && (
        <div className="mt-2 position-relative d-inline-block">
          {showPreview ? (
            <img src={URL.createObjectURL(file)} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} />
          ) : (
            <small className="text-success d-block">{file.name}</small>
          )}
          <button type="button" className="btn btn-danger btn-sm rounded-circle position-absolute" style={{ top: 2, right: 2, width: 22, height: 22, padding: 0, fontSize: 10 }} onClick={(e) => { e.stopPropagation(); onClear(); }}>×</button>
        </div>
      )}
    </div>
  );
}

export default function ShortsPage() {
  const toast = useRef<Toast>(null);
  const today = getToday();

  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingShorts, setLoadingShorts] = useState(false);
  const [touched, setTouched] = useState(false);
  const [shortParaModificar, setShortParaModificar] = useState<any>(null);
  const [shortToDelete, setShortToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<Record<string, "image" | "video">>({});

  const [form, setForm] = useState({ title: "", description: "", published_at: "", unpublished_at: "" });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [modifyForm, setModifyForm] = useState({ title: "", description: "", published_at: "", unpublished_at: "" });
  const [modifyTouched, setModifyTouched] = useState(false);
  const [loadingModify, setLoadingModify] = useState(false);
  const [modifyImgFile, setModifyImgFile] = useState<File | null>(null);
  const [modifyVideoFile, setModifyVideoFile] = useState<File | null>(null);
  const [imgModif, setImgModif] = useState<any>(null);
  const [videoModif, setVideoModif] = useState<any>(null);


  useEffect(() => { load(); }, []);

  async function load() {
    setLoadingShorts(true);
    try { setShorts(await listShorts()); } catch { toast.current?.show({ severity: "error", summary: "No se pudo cargar los shorts" }); }
    finally { setLoadingShorts(false); }
  }

  function handleImg(f: File) {
    if (!IMG_TYPES.includes(f.type)) { toast.current?.show({ severity: "info", summary: `${f.name} no es una imagen válida.` }); return; }
    if (f.size > IMG_MAX) { toast.current?.show({ severity: "info", summary: `${f.name} pesa más de 5MB.` }); return; }
    setImgFile(f);
  }

  function handleVideo(f: File) {
    if (!VIDEO_TYPES.includes(f.type)) { toast.current?.show({ severity: "info", summary: `${f.name} no es un video válido.` }); return; }
    if (f.size > VIDEO_MAX) { toast.current?.show({ severity: "info", summary: `${f.name} supera el tamaño máximo de ${VIDEO_LABEL}.` }); return; }
    setVideoFile(f);
  }

  function handleModifyImg(f: File) {
    if (!IMG_TYPES.includes(f.type)) { toast.current?.show({ severity: "info", summary: `${f.name} no es una imagen válida.` }); return; }
    if (f.size > IMG_MAX) { toast.current?.show({ severity: "info", summary: `${f.name} pesa más de 5MB.` }); return; }
    setModifyImgFile(f);
  }

  function handleModifyVideo(f: File) {
    if (!VIDEO_TYPES.includes(f.type)) { toast.current?.show({ severity: "info", summary: `${f.name} no es un video válido.` }); return; }
    if (f.size > VIDEO_MAX) { toast.current?.show({ severity: "info", summary: `${f.name} supera el tamaño máximo de ${VIDEO_LABEL}.` }); return; }
    setModifyVideoFile(f);
  }

  function isValid(f: typeof form): boolean {
    if (!f.title || !f.description || !f.published_at || !f.unpublished_at) return false;
    if (f.description.length > 300 || f.title.length > 50) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid(form)) return;
    if (!imgFile || !videoFile) {
      if (!imgFile) toast.current?.show({ severity: "info", summary: "Debe agregar una imagen" });
      if (!videoFile) toast.current?.show({ severity: "info", summary: "Debe agregar un video" });
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("published_at", form.published_at);
    fd.append("unpublished_at", form.unpublished_at);
    fd.append("image", imgFile, imgFile.name);
    fd.append("video", videoFile, videoFile.name);

    try {
      const resp = await createShort(fd);
      setShorts((prev) => [...prev, resp.data ?? resp]);
      toast.current?.show({ severity: "success", summary: "Short creado" });
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleModifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setModifyTouched(true);
    if (!isValid(modifyForm) || !shortParaModificar) return;
    setLoadingModify(true);
    const fd = new FormData();
    fd.append("title", modifyForm.title);
    fd.append("description", modifyForm.description);
    fd.append("published_at", modifyForm.published_at);
    fd.append("unpublished_at", modifyForm.unpublished_at);
    if (modifyImgFile) fd.append("image", modifyImgFile, modifyImgFile.name);
    if (modifyVideoFile) fd.append("video", modifyVideoFile, modifyVideoFile.name);

    try {
      const resp = await modificateShort(fd, shortParaModificar.id);
      setShorts((prev) => prev.map((s) => s.id === shortParaModificar.id ? resp ?? s : s));
      toast.current?.show({ severity: "success", summary: "Short modificado" });
      cerrarModificar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingModify(false);
    }
  }

  function abrirModificar(short: any) {
    setShortParaModificar(short);
    setModifyForm({ title: short.title ?? "", description: short.description ?? "", published_at: formatDateForInput(short.published_at), unpublished_at: formatDateForInput(short.unpublished_at) });
    setImgModif(short.image_url ? { image_url: short.image_url } : null);
    setVideoModif(short.video_url ? { video_url: short.video_url } : null);
    setModifyImgFile(null);
    setModifyVideoFile(null);
    setModifyTouched(false);
  }

  function cerrarModificar() {
    setShortParaModificar(null);
    setModifyForm({ title: "", description: "", published_at: "", unpublished_at: "" });
    setImgModif(null); setVideoModif(null);
    setModifyImgFile(null); setModifyVideoFile(null);
    setModifyTouched(false);
  }

  function limpiar() {
    setForm({ title: "", description: "", published_at: "", unpublished_at: "" });
    setImgFile(null); setVideoFile(null); setTouched(false);
  }

  function toggleMedia(id: string) {
    setMediaMode((prev) => ({ ...prev, [id]: (prev[id] ?? "image") === "video" ? "image" : "video" }));
  }

  async function handleDeleteConfirm() {
    if (!shortToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteShort(shortToDelete.id);
      setShorts((prev) => prev.filter((s) => s.id !== shortToDelete.id));
      toast.current?.show({ severity: "success", summary: "Short eliminado" });
      setShortToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar el short" }); }
    finally { setLoadingDelete(false); }
  }

  const SORT_OPTIONS = [
    { label: "Fecha de creación", value: "created_at" },
    { label: "Vigencia", value: "vigencia" },
    { label: "Título (A-Z)", value: "title_asc" },
    { label: "Título (Z-A)", value: "title_desc" },
  ];

  const filtered = (searchTerm
    ? shorts.filter((s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : shorts
  ).slice().sort((a, b) => {
    switch (sortBy) {
      case "title_asc":
        return (a.title ?? "").localeCompare(b.title ?? "", "es", { sensitivity: "base" });
      case "title_desc":
        return (b.title ?? "").localeCompare(a.title ?? "", "es", { sensitivity: "base" });
      case "vigencia":
        return formatDateForInput(a.published_at).localeCompare(formatDateForInput(b.published_at));
      default:
        return formatDateForInput(b.created_at).localeCompare(formatDateForInput(a.created_at));
    }
  });

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar short</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  const modifyDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar short</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{shortParaModificar?.title}</small>
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
              <i className="pi pi-video" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Shorts</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de shorts institucionales</small>
            </div>
            <button
              type="button"
              disabled={loadingShorts}
              onClick={load}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loadingShorts ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
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
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nuevo short</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Completá los datos para crear un short</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Título (máx 50) *</label>
                  <input
                    className="profile-input"
                    type="text"
                    maxLength={50}
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                  {touched && !form.title && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
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
                <div className="col-12 mb-3">
                  <label className="profile-field-label">Descripción (máx 300) *</label>
                  <textarea
                    className="profile-input"
                    maxLength={300}
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  {touched && !form.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12 col-md-6">
                  <label className="profile-field-label">Imagen (máx 5MB)</label>
                  <FileDropzone label="Arrastre o haga click para subir imagen" accept="image/*" file={imgFile} onFile={handleImg} onClear={() => setImgFile(null)} showPreview />
                </div>
                <div className="col-12 col-md-6">
                  <label className="profile-field-label">Video (máx {VIDEO_LABEL})</label>
                  <FileDropzone label="Arrastre o haga click para subir video" accept="video/*" file={videoFile} onFile={handleVideo} onClear={() => setVideoFile(null)} />
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
                  {loading ? "Creando..." : "Crear short"}
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
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{shorts.length} {shorts.length === 1 ? "short" : "shorts"}</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>

            {/* Filter bar */}
            {(shorts.length > 0 || searchTerm) && (
              <div className="license-filter-bar mb-3">
                <div className="license-filter-bar-inputs">
                  <div className={`license-filter-input-wrap${searchTerm ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-search license-filter-icon" />
                    <input
                      className="license-filter-input"
                      style={{ paddingLeft: "32px" }}
                      placeholder="Buscar short por título…"
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
            {loadingShorts && <SkeletonCards />}

            {/* Shorts grid */}
            {!loadingShorts && (
              <div className="row fadeIn animated">
                {filtered.map((short) => (
                  <div key={short.id} className="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                    <div
                      onMouseEnter={() => setHoveredCard(short.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        overflow: "hidden",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: hoveredCard === short.id ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      {(short.image_url || short.video_url) && (
                        <div style={{ position: "relative", width: "100%", height: 220, flexShrink: 0, background: "#000" }}>
                          {(mediaMode[short.id] ?? "image") === "video" && short.video_url ? (
                            <video
                              src={short.video_url}
                              controls
                              onPlay={(e) => {
                                document.querySelectorAll("video").forEach((v) => {
                                  if (v !== e.currentTarget) v.pause();
                                });
                              }}
                              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            />
                          ) : short.image_url ? (
                            <>
                              <img
                                src={short.image_url}
                                alt={short.title}
                                onClick={() => setPreviewImage({ url: short.image_url, name: short.title })}
                                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in", display: "block", transition: "opacity 0.15s", opacity: hoveredCard === short.id ? 0.85 : 1 }}
                              />
                              <div
                                onClick={() => setPreviewImage({ url: short.image_url, name: short.title })}
                                style={{
                                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  opacity: hoveredCard === short.id ? 1 : 0,
                                  transition: "opacity 0.15s",
                                  pointerEvents: hoveredCard === short.id ? "auto" : "none",
                                  cursor: "zoom-in",
                                }}
                              >
                                <span style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(30,41,59,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <i className="pi pi-search-plus" style={{ color: "#fff", fontSize: "1.1rem" }} />
                                </span>
                              </div>
                            </>
                          ) : null}
                          {short.image_url && short.video_url && (
                            <button
                              type="button"
                              onClick={() => toggleMedia(short.id)}
                              className="d-flex align-items-center"
                              style={{
                                position: "absolute", top: 8, right: 8, zIndex: 2,
                                gap: "5px", borderRadius: "20px", fontWeight: 600, fontSize: "0.72rem", padding: "4px 10px",
                                background: "rgba(30,41,59,0.65)", color: "#fff", border: "none",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                              }}
                            >
                              <i className={`pi ${(mediaMode[short.id] ?? "image") === "video" ? "pi-image" : "pi-video"}`} style={{ fontSize: "0.68rem" }} />
                              Ver {(mediaMode[short.id] ?? "image") === "video" ? "imagen" : "video"}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex-grow-1" style={{ padding: "14px" }}>
                        <p className="mb-1 font-weight-bold" style={{ fontSize: "0.9rem", color: "#1e293b" }}>{short.title}</p>
                        <p className="mb-1" style={{ fontSize: "0.82rem", color: "#64748b" }}>
                          {short.description?.slice(0, 80)}{short.description?.length > 80 ? "..." : ""}
                        </p>
                        <p className="mb-0" style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          {formatDateDisplay(short.published_at)} — {formatDateDisplay(short.unpublished_at)}
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between px-3 pb-3 pt-2" style={{ gap: "6px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        <Tooltip label="Cantidad de likes">
                          <span
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#eff6ff", color: "#3b82f6", borderRadius: "20px", padding: "4px 10px", fontSize: "0.78rem", fontWeight: 700 }}
                          >
                            <i className="pi pi-thumbs-up-fill" style={{ fontSize: "0.75rem" }} />
                            {short.likes_count ?? 0}
                          </span>
                        </Tooltip>
                        <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                          <Tooltip label="Modificar">
                            <button
                              type="button"
                              onClick={() => abrirModificar(short)}
                              style={{ background: "none", border: "1.5px solid #dbeafe", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#3b82f6" }}
                            >
                              <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
                            </button>
                          </Tooltip>
                          <Tooltip label="Eliminar">
                            <button
                              type="button"
                              onClick={() => setShortToDelete(short)}
                              style={{ background: "none", border: "1.5px solid #fecdd3", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#dc3545" }}
                            >
                              <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {shorts.length === 0 && (
                  <div className="col-12" style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-video" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>No hay shorts disponibles para mostrar.</p>
                  </div>
                )}
                {shorts.length > 0 && filtered.length === 0 && (
                  <div className="col-12" style={{ padding: "40px", textAlign: "center" }}>
                    <i className="pi pi-search" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                      No se encontraron shorts con el título &quot;{searchTerm}&quot;.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modify short dialog */}
      <Dialog
        header={modifyDialogHeader}
        visible={!!shortParaModificar}
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
                form="modify-short-form"
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
        <form id="modify-short-form" onSubmit={handleModifySubmit} noValidate>
          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label className="profile-field-label">Título (máx 50) *</label>
              <input
                className="profile-input"
                type="text"
                maxLength={50}
                value={modifyForm.title}
                onChange={(e) => setModifyForm((p) => ({ ...p, title: e.target.value }))}
              />
              {modifyTouched && !modifyForm.title && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
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
            <div className="col-12 mb-3">
              <label className="profile-field-label">Descripción (máx 300) *</label>
              <textarea
                className="profile-input"
                maxLength={300}
                rows={3}
                value={modifyForm.description}
                onChange={(e) => setModifyForm((p) => ({ ...p, description: e.target.value }))}
              />
              {modifyTouched && !modifyForm.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-12 col-md-6">
              <label className="profile-field-label">Imagen (máx 5MB)</label>
              {imgModif && (
                <div className="mb-2">
                  <img src={`${imgModif.image_url}`} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} />
                </div>
              )}
              <FileDropzone label="Arrastre o haga click para subir imagen" accept="image/*" file={modifyImgFile} onFile={handleModifyImg} onClear={() => setModifyImgFile(null)} showPreview />
            </div>
            <div className="col-12 col-md-6">
              <label className="profile-field-label">Video (máx {VIDEO_LABEL})</label>
              {videoModif && (
                <small className="text-muted d-block mb-2">Video previo guardado</small>
              )}
              <FileDropzone label="Arrastre o haga click para subir video" accept="video/*" file={modifyVideoFile} onFile={handleModifyVideo} onClear={() => setModifyVideoFile(null)} />
            </div>
          </div>
        </form>
      </Dialog>

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
          <img src={previewImage.url} alt={previewImage.name} style={{ width: "100%", height: "auto", borderRadius: "8px", display: "block" }} />
        )}
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        header={deleteDialogHeader}
        visible={!!shortToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setShortToDelete(null)}
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
                onClick={() => setShortToDelete(null)}
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
          Está a punto de eliminar el short <strong>{shortToDelete?.title}</strong>.
        </p>
      </Dialog>
    </>
  );
}