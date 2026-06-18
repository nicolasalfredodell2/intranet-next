"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
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

export default function BannersPage() {
  const toast = useRef<Toast>(null);
  const today = getToday();

  const [banners, setBanners] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [touched, setTouched] = useState(false);
  const [bannerParaModificar, setBannerParaModificar] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

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

  const horizRef = useRef<HTMLInputElement>(null);
  const vertRef = useRef<HTMLInputElement>(null);

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
      setShowDeleteModal(false); setBannerToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar el banner" }); }
    finally { setLoadingDelete(false); }
  }

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

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">{bannerParaModificar ? "Modificación de banner" : "Subida de banner"}</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Banners</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
                  <div className="row">
                    <div className="form-group col-12 col-md-6">
                      <label><small>Nombre *</small></label>
                      <input type="text" className="form-control form-control-sm" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                      {touched && !form.name && <small className="text-danger">* Obligatorio</small>}
                    </div>
                    <div className="form-group col-6 col-md-3">
                      <label><small>Fecha desde *</small></label>
                      <input type="date" className="form-control form-control-sm" min={today} max={maxPublished} value={form.published_at} onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))} />
                      {touched && !form.published_at && <small className="text-danger">* Obligatorio</small>}
                    </div>
                    <div className="form-group col-6 col-md-3">
                      <label><small>Fecha hasta *</small></label>
                      <input type="date" className="form-control form-control-sm" min={minUnpublished} value={form.unpublished_at} onChange={(e) => setForm((p) => ({ ...p, unpublished_at: e.target.value }))} />
                      {touched && !form.unpublished_at && <small className="text-danger">* Obligatorio</small>}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12">
                      <div className="d-flex gap-3">
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
                      <div className="form-group col-12 col-md-6 mt-2 fadeIn animated">
                        <label><small>Nota</small></label>
                        <select className="custom-select w-100" value={form.note_id} onChange={(e) => setForm((p) => ({ ...p, note_id: e.target.value }))}>
                          <option value="">-- Seleccionar nota --</option>
                          {notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
                        </select>
                      </div>
                    )}
                    {form.is_external && (
                      <div className="form-group col-12 col-md-6 mt-2 fadeIn animated">
                        <label><small>URL Externa</small></label>
                        <input type="text" className="form-control form-control-sm" placeholder="https://..." value={form.external_url} onChange={(e) => setForm((p) => ({ ...p, external_url: e.target.value }))} />
                        {touched && form.is_external && form.external_url && !URL_PATTERN.test(form.external_url) && <small className="text-danger">* URL no válida</small>}
                      </div>
                    )}
                  </div>

                  <div className="row mb-3">
                    <div className="col-12 col-md-6">
                      <label><small>Imagen horizontal</small></label>
                      {bannerParaModificar && fileHorizModif && (
                        <div className="mb-2 d-flex align-items-center gap-2">
                          <img src={`${API_URL}${fileHorizModif.path_url}`} alt="" style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 4 }} />
                          {!isDeletingHoriz && <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteImage("horizontal")}>Quitar</button>}
                        </div>
                      )}
                      <FileDropzone label="Arrastre o haga click para subir imagen horizontal" file={fileHorizontal} onFile={handleFileHoriz} onClear={() => setFileHorizontal(null)} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label><small>Imagen vertical</small></label>
                      {bannerParaModificar && fileVertModif && (
                        <div className="mb-2 d-flex align-items-center gap-2">
                          <img src={`${API_URL}${fileVertModif.path_url}`} alt="" style={{ width: 50, height: 80, objectFit: "cover", borderRadius: 4 }} />
                          {!isDeletingVert && <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteImage("vertical")}>Quitar</button>}
                        </div>
                      )}
                      <FileDropzone label="Arrastre o haga click para subir imagen vertical" file={fileVertical} onFile={handleFileVert} onClear={() => setFileVertical(null)} />
                    </div>
                  </div>

                  <div className="row mt-4">
                    <div className="col-6">
                      <button disabled={loading} type="submit" className="btn btn-block btn-info">
                        {bannerParaModificar ? (loading ? "MODIFICANDO" : "MODIFICAR") : (loading ? "CREANDO" : "CREAR BANNER")}
                      </button>
                    </div>
                    <div className="col-6">
                      <button type="button" disabled={loading} className="btn btn-block btn-muted" onClick={limpiar}>Limpiar</button>
                    </div>
                  </div>
                  {loading && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mt-2" />}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="row mt-4">
          {banners.map((banner) => (
            <div key={banner.id} className="col-12 col-md-6 col-lg-4 mb-4 fadeIn animated">
              <div className="card h-100">
                {banner.image_horizontal_url && (
                  <img src={`${API_URL}${banner.image_horizontal_url}`} alt={banner.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                )}
                <div className="card-body">
                  <h6>{banner.name}</h6>
                  <small className="text-muted">{formatDateForInput(banner.published_at)} — {formatDateForInput(banner.unpublished_at)}</small>
                </div>
                <div className="card-footer d-flex justify-content-between">
                  <button className="btn btn-sm btn-info" onClick={() => llenarFormulario(banner)}><i className="mdi mdi-pencil-outline" /> Editar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => { setBannerToDelete(banner); setShowDeleteModal(true); }}><i className="mdi mdi-trash-can-outline" /> Borrar</button>
                </div>
              </div>
            </div>
          ))}
          {loadingBanners && <div className="col-12 text-center py-4"><i className="pi pi-spin pi-spinner" /> Cargando banners...</div>}
          {!loadingBanners && banners.length === 0 && <div className="col-12 text-center py-4 text-muted">No hay banners.</div>}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Eliminar banner?</h4>
              <p className="text-muted"><strong>&quot;{bannerToDelete?.name}&quot;</strong></p>
              <div className="row g-2 mt-4">
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-light w-100" onClick={() => { setShowDeleteModal(false); setBannerToDelete(null); }}>Cancelar</button></div>
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-danger w-100" onClick={handleDeleteConfirm}>{loadingDelete ? "Eliminando..." : "Sí, eliminar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
