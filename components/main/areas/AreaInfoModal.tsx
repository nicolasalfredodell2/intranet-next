"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { getAreaInfo, createAreaInfo, modificateAreaInfo, deleteAreaInfoImage, deleteAreaInfoVideo } from "@/lib/services/areas.service";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];

declare function initEditorTinymce(): void;
declare const tinymce: any;

interface AreaInfoForm { title: string; introduction: string; text: string; }

export default function AreaInfoModal({ area, onClose }: { area: any; onClose: () => void }) {
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [infoArea, setInfoArea] = useState<any>(null);
  const [form, setForm] = useState<AreaInfoForm>({ title: "", introduction: "", text: "" });
  const [touched, setTouched] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  const [videosFiles, setVideosFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [existingVideos, setExistingVideos] = useState<any[]>([]);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  const [imageDragOver, setImageDragOver] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        (window as any).initEditorTinymce?.();
        setEditorReady(true);
      } catch { /* retry not needed, editor script already loaded globally */ }
    }, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!editorReady) return;
    loadInfo();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try {
        if (tinymce.activeEditor) tinymce.EditorManager.execCommand("mceRemoveEditor", true, "mymce");
      } catch { /* ignore */ }
    };
  }, [editorReady]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function startInterval() {
    intervalRef.current = setInterval(() => {
      try {
        const content = tinymce.get("mymce")?.getContent?.();
        if (content !== undefined) setForm((p) => ({ ...p, text: content }));
      } catch { /* editor not ready */ }
    }, 1000);
  }

  async function loadInfo() {
    setLoading(true);
    try {
      const areaData = await getAreaInfo(area.id);
      const info = areaData?.info_areas?.[0] ?? null;
      setInfoArea(info);
      if (info) {
        setForm({ title: info.title ?? "", introduction: info.introduction ?? "", text: info.text ?? "" });
        setExistingImages(info.images ?? []);
        setExistingVideos(info.videos ?? []);
      }
      setTimeout(() => {
        try { if (info?.text) tinymce.activeEditor?.setContent(info.text); } catch { /* ignore */ }
        startInterval();
      }, 1500);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar la información del area" });
    } finally {
      setLoading(false);
    }
  }

  function handleImageFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles);
    const valid: File[] = [];
    arr.forEach((f) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
        toast.current?.show({ severity: "info", summary: `El archivo ${f.name} no es una imagen válida.` });
      } else if (f.size > MAX_IMAGE_SIZE) {
        toast.current?.show({ severity: "info", summary: `El archivo ${f.name} pesa más de 5MB.` });
      } else {
        valid.push(f);
      }
    });
    setImagesFiles((p) => [...p, ...valid]);
  }

  function handleVideoFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles);
    const valid: File[] = [];
    arr.forEach((f) => {
      if (!ACCEPTED_VIDEO_TYPES.includes(f.type)) {
        toast.current?.show({ severity: "info", summary: `El archivo ${f.name} no es un video válido.` });
      } else if (f.size > MAX_VIDEO_SIZE) {
        toast.current?.show({ severity: "info", summary: `El archivo ${f.name} supera el tamaño máximo permitido.` });
      } else {
        valid.push(f);
      }
    });
    setVideosFiles((p) => [...p, ...valid]);
  }

  async function handleDeleteImage(image: any) {
    if (isDeletingMedia || !infoArea) return;
    setIsDeletingMedia(true);
    try {
      await deleteAreaInfoImage(area.id, infoArea.id, image.id);
      setExistingImages((prev) => prev.filter((img) => img.id !== image.id));
      toast.current?.show({ severity: "success", summary: "Imagen eliminada" });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar la imagen" });
    } finally {
      setIsDeletingMedia(false);
    }
  }

  async function handleDeleteVideo(video: any) {
    if (isDeletingMedia || !infoArea) return;
    setIsDeletingMedia(true);
    try {
      await deleteAreaInfoVideo(area.id, infoArea.id, video.id);
      setExistingVideos((prev) => prev.filter((v) => v.id !== video.id));
      toast.current?.show({ severity: "success", summary: "Video eliminado" });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar el video" });
    } finally {
      setIsDeletingMedia(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    let text = "";
    try { text = tinymce.get("mymce")?.getContent() ?? ""; } catch { /* ignore */ }
    setForm((p) => ({ ...p, text }));

    if (!form.title || !form.introduction || !text) return;

    setLoadingAction(true);
    const fd = new FormData();
    fd.append("area_id", area.id);
    fd.append("title", form.title);
    fd.append("introduction", form.introduction);
    fd.append("text", text);
    imagesFiles.forEach((f) => fd.append("images_files[]", f, f.name));
    videosFiles.forEach((f) => fd.append("videos_files[]", f, f.name));

    try {
      if (infoArea) {
        const resp = await modificateAreaInfo(fd, area.id, infoArea.id);
        toast.current?.show({ severity: "success", summary: "Información del area modificada" });
        setInfoArea(resp.data);
        setExistingImages(resp.data?.images ?? existingImages);
        setExistingVideos(resp.data?.videos ?? existingVideos);
      } else {
        const resp = await createAreaInfo(fd, area.id);
        toast.current?.show({ severity: "success", summary: "Información del area creada" });
        setInfoArea(resp.data);
        setExistingImages(resp.data?.images ?? []);
        setExistingVideos(resp.data?.videos ?? []);
      }
      setImagesFiles([]);
      setVideosFiles([]);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <>
      <Toast ref={toast} position="bottom-center" />
      <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 760 }}>
          <div className="modal-content" style={{ maxHeight: "90vh" }}>
            <div className="modal-header">
              <h5 className="mb-0">
                Información del área: <span className="text-primary">{area.title}</span>
              </h5>
              <button type="button" className="close" onClick={onClose} aria-label="Cerrar">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {loading ? (
              <div className="modal-body text-center py-5">
                <i className="pi pi-spin pi-spinner mr-2" /> Cargando información del área...
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                  {!infoArea && (
                    <div className="alert alert-info d-flex align-items-start" style={{ gap: 8 }}>
                      <i className="mdi mdi-information-outline" />
                      <div>
                        <strong>Esta área no tiene información creada.</strong><br />
                        Por favor, complete el siguiente formulario para crearla.
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label><small>Título *</small></label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    />
                    {touched && !form.title && <small className="text-danger animated fadeIn d-block">* Campo obligatorio</small>}
                  </div>

                  <div className="form-group">
                    <label><small>Introducción *</small></label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={form.introduction}
                      onChange={(e) => setForm((p) => ({ ...p, introduction: e.target.value }))}
                    />
                    {touched && !form.introduction && <small className="text-danger animated fadeIn d-block">* Campo obligatorio</small>}
                  </div>

                  <div className="form-group">
                    <label><small>Texto *</small></label>
                    <textarea id="mymce" />
                    {touched && !form.text && <small className="text-danger animated fadeIn d-block">* Campo obligatorio</small>}
                  </div>

                  <div className="row mt-4">
                    <div className="col-12 col-xl-6 mb-4">
                      <h6>Gestión de Imágenes</h6>
                      {existingImages.length > 0 && (
                        <div className="mb-2">
                          <small className="text-muted d-block mb-2">Imágenes subidas:</small>
                          <div className="d-flex flex-wrap" style={{ gap: 8 }}>
                            {existingImages.map((image) => (
                              <div key={image.id} className="position-relative d-inline-block">
                                <img
                                  className="rounded border"
                                  style={{ width: 90, height: 90, objectFit: "cover" }}
                                  src={image.url}
                                  alt="Imagen del área"
                                />
                                {!isDeletingMedia && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm rounded-circle position-absolute"
                                    style={{ top: 2, right: 2, width: 22, height: 22, padding: 0, fontSize: 10 }}
                                    onClick={() => handleDeleteImage(image)}
                                    title="Eliminar imagen"
                                  >×</button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div
                        className={`dropzone-area${imageDragOver ? " drag-over" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                        onDragLeave={() => setImageDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setImageDragOver(false); handleImageFiles(e.dataTransfer.files); }}
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <p className="text-center text-muted mb-2">Seleccione o arrastre imágenes</p>
                        <input
                          ref={imageInputRef}
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          style={{ display: "none" }}
                          onChange={(e) => { if (e.target.files) handleImageFiles(e.target.files); }}
                        />
                        {imagesFiles.length > 0 && (
                          <div className="d-flex flex-wrap mt-2" style={{ gap: 8 }}>
                            {imagesFiles.map((f, i) => (
                              <div key={i} className="position-relative d-inline-block">
                                <img
                                  src={URL.createObjectURL(f)}
                                  alt={f.name}
                                  style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 4 }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm rounded-circle position-absolute"
                                  style={{ top: 2, right: 2, width: 20, height: 20, padding: 0, fontSize: 9 }}
                                  onClick={(e) => { e.stopPropagation(); setImagesFiles((p) => p.filter((_, j) => j !== i)); }}
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-xl-6 mb-4">
                      <h6>Gestión de Videos</h6>
                      {existingVideos.length > 0 && (
                        <div className="mb-2">
                          <small className="text-muted d-block mb-2">Videos subidos:</small>
                          <div className="d-flex flex-wrap" style={{ gap: 8 }}>
                            {existingVideos.map((video) => (
                              <div key={video.id} className="position-relative d-inline-block">
                                <video className="rounded border" style={{ width: 140, height: 90, objectFit: "cover" }} controls>
                                  <source src={video.url} type="video/mp4" />
                                </video>
                                {!isDeletingMedia && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm rounded-circle position-absolute"
                                    style={{ top: 2, right: 2, width: 22, height: 22, padding: 0, fontSize: 10 }}
                                    onClick={() => handleDeleteVideo(video)}
                                    title="Eliminar video"
                                  >×</button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div
                        className={`dropzone-area${videoDragOver ? " drag-over" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setVideoDragOver(true); }}
                        onDragLeave={() => setVideoDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setVideoDragOver(false); handleVideoFiles(e.dataTransfer.files); }}
                        onClick={() => videoInputRef.current?.click()}
                      >
                        <p className="text-center text-muted mb-2">Seleccione o arrastre videos</p>
                        <input
                          ref={videoInputRef}
                          type="file"
                          multiple
                          accept="video/mp4,video/webm,video/ogg"
                          style={{ display: "none" }}
                          onChange={(e) => { if (e.target.files) handleVideoFiles(e.target.files); }}
                        />
                        {videosFiles.length > 0 && (
                          <div className="mt-2">
                            {videosFiles.map((f, i) => (
                              <div key={i} className="d-flex align-items-center justify-content-between border rounded px-2 py-1 mb-1">
                                <small className="text-truncate" style={{ maxWidth: 200 }}>{f.name}</small>
                                <button
                                  type="button"
                                  className="btn btn-link text-danger btn-sm p-0"
                                  onClick={(e) => { e.stopPropagation(); setVideosFiles((p) => p.filter((_, j) => j !== i)); }}
                                >
                                  <i className="mdi mdi-close" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {loadingAction && <ProgressBar mode="indeterminate" style={{ height: "6px" }} />}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" disabled={loadingAction} onClick={onClose}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loadingAction}>
                    {infoArea
                      ? (loadingAction ? "Guardando..." : "Guardar cambios")
                      : (loadingAction ? "Creando..." : "Crear")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}