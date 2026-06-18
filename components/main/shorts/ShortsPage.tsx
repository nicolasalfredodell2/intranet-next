"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { listShorts, createShort, modificateShort, deleteShort } from "@/lib/services/shorts.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const IMG_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 52428800; // 50MB
const VIDEO_LABEL = "50 MB";
const IMG_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

function getToday(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function formatDate(s: string | null): string {
  if (!s) return "";
  return s.split("T")[0];
}

export default function ShortsPage() {
  const toast = useRef<Toast>(null);
  const today = getToday();

  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingShorts, setLoadingShorts] = useState(false);
  const [touched, setTouched] = useState(false);
  const [shortParaModificar, setShortParaModificar] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shortToDelete, setShortToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [form, setForm] = useState({ title: "", description: "", published_at: "", unpublished_at: "" });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imgModif, setImgModif] = useState<any>(null);
  const [videoModif, setVideoModif] = useState<any>(null);

  const minUnpublished = form.published_at || today;
  const maxPublished = form.unpublished_at || "";

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

  function isValid(): boolean {
    if (!form.title || !form.description || !form.published_at || !form.unpublished_at) return false;
    if (form.description.length > 300 || form.title.length > 50) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid()) return;
    if (!shortParaModificar && (!imgFile || !videoFile)) {
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
    if (imgFile) fd.append("image", imgFile, imgFile.name);
    if (videoFile) fd.append("video", videoFile, videoFile.name);

    try {
      if (shortParaModificar) {
        const resp = await modificateShort(fd, shortParaModificar.id);
        setShorts((prev) => prev.map((s) => s.id === shortParaModificar.id ? resp ?? s : s));
        if (resp?.image) setImgModif({ path_url: resp.image.path_url });
        toast.current?.show({ severity: "success", summary: "Short modificado" });
      } else {
        const resp = await createShort(fd);
        setShorts((prev) => [...prev, resp.data ?? resp]);
        toast.current?.show({ severity: "success", summary: "Short creado" });
      }
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  function llenarFormulario(short: any) {
    setShortParaModificar(short);
    setForm({ title: short.title ?? "", description: short.description ?? "", published_at: formatDate(short.published_at), unpublished_at: formatDate(short.unpublished_at) });
    setImgModif(short.image ? { path_url: short.image.path_url } : null);
    setVideoModif(short.video ? { path_url: short.video.path_url } : null);
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiar() {
    setForm({ title: "", description: "", published_at: "", unpublished_at: "" });
    setImgFile(null); setVideoFile(null); setImgModif(null); setVideoModif(null);
    setShortParaModificar(null); setTouched(false);
  }

  async function handleDeleteConfirm() {
    if (!shortToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteShort(shortToDelete.id);
      setShorts((prev) => prev.filter((s) => s.id !== shortToDelete.id));
      toast.current?.show({ severity: "success", summary: "Short eliminado" });
      setShowDeleteModal(false); setShortToDelete(null);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar el short" }); }
    finally { setLoadingDelete(false); }
  }

  const FileInput = ({ accept, label, file, onFile, onClear }: { accept: string; label: string; file: File | null; onFile: (f: File) => void; onClear: () => void }) => {
    const ref = useRef<HTMLInputElement>(null);
    return (
      <div className="dropzone-area text-center" onClick={() => !file && ref.current?.click()}>
        <small className="text-muted">{label}</small>
        <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
        {file && <div className="mt-1"><small className="text-success">{file.name}</small> <button type="button" className="btn btn-sm btn-link text-danger p-0 ml-1" onClick={(e) => { e.stopPropagation(); onClear(); }}>×</button></div>}
      </div>
    );
  };

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">{shortParaModificar ? "Modificación de short" : "Subida de short"}</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Shorts</li>
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
                      <label><small>Título (máx 50) *</small></label>
                      <input type="text" maxLength={50} className="form-control form-control-sm" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                      {touched && !form.title && <small className="text-danger">* Obligatorio</small>}
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
                    <div className="form-group col-12">
                      <label><small>Descripción (máx 300) *</small></label>
                      <textarea className="form-control" maxLength={300} rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                      {touched && !form.description && <small className="text-danger">* Obligatorio</small>}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12 col-md-6">
                      <label><small>Imagen (máx 5MB)</small></label>
                      {shortParaModificar && imgModif && <div className="mb-1"><img src={`${API_URL}${imgModif.path_url}`} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} /></div>}
                      <FileInput accept="image/*" label="Arrastre o haga click para imagen" file={imgFile} onFile={handleImg} onClear={() => setImgFile(null)} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label><small>Video (máx {VIDEO_LABEL})</small></label>
                      {shortParaModificar && videoModif && <small className="text-muted d-block mb-1">Video previo guardado</small>}
                      <FileInput accept="video/*" label="Arrastre o haga click para video" file={videoFile} onFile={handleVideo} onClear={() => setVideoFile(null)} />
                    </div>
                  </div>

                  <div className="row mt-4">
                    <div className="col-6">
                      <button disabled={loading} type="submit" className="btn btn-block btn-info">
                        {shortParaModificar ? (loading ? "MODIFICANDO" : "MODIFICAR") : (loading ? "CREANDO" : "CREAR SHORT")}
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
          {shorts.map((short) => (
            <div key={short.id} className="col-12 col-md-6 col-lg-4 mb-4 fadeIn animated">
              <div className="card h-100">
                <div className="card-body">
                  <h6>{short.title}</h6>
                  <small className="text-muted">{short.description?.slice(0, 80)}{short.description?.length > 80 ? "..." : ""}</small>
                  <div className="mt-2">
                    <small className="text-muted">{formatDate(short.published_at)} — {formatDate(short.unpublished_at)}</small>
                  </div>
                </div>
                <div className="card-footer d-flex justify-content-between">
                  <button className="btn btn-sm btn-info" onClick={() => llenarFormulario(short)}><i className="mdi mdi-pencil-outline" /> Editar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => { setShortToDelete(short); setShowDeleteModal(true); }}><i className="mdi mdi-trash-can-outline" /> Borrar</button>
                </div>
              </div>
            </div>
          ))}
          {loadingShorts && <div className="col-12 text-center py-4"><i className="pi pi-spin pi-spinner" /> Cargando shorts...</div>}
          {!loadingShorts && shorts.length === 0 && <div className="col-12 text-center py-4 text-muted">No hay shorts.</div>}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content text-center p-4">
              <i className="mdi mdi-alert-circle-outline text-danger mb-3" style={{ fontSize: "3rem" }} />
              <h4>¿Eliminar short?</h4>
              <p className="text-muted"><strong>&quot;{shortToDelete?.title}&quot;</strong></p>
              <div className="row g-2 mt-4">
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-light w-100" onClick={() => { setShowDeleteModal(false); setShortToDelete(null); }}>Cancelar</button></div>
                <div className="col-6"><button disabled={loadingDelete} className="btn btn-danger w-100" onClick={handleDeleteConfirm}>{loadingDelete ? "Eliminando..." : "Sí, eliminar"}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
