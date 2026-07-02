"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
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

  async function handleSubmit() {
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

  const dialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-info-circle" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Información del área</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{area.title}</small>
      </div>
    </div>
  );

  const dialogFooter = (
    <div>
      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
        <button
          type="button"
          disabled={loadingAction}
          onClick={handleSubmit}
          className="btn btn-primary d-flex align-items-center"
          style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
        >
          <i className={loadingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
          {infoArea
            ? (loadingAction ? "Guardando..." : "Guardar cambios")
            : (loadingAction ? "Creando..." : "Crear")}
        </button>
        <button
          type="button"
          disabled={loadingAction}
          onClick={onClose}
          className="btn btn-light text-muted ml-auto"
          style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
        >
          Cancelar
        </button>
      </div>
      {loadingAction && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
    </div>
  );

  return (
    <>
      <Toast ref={toast} position="bottom-center" />
      <Dialog
        header={dialogHeader}
        visible
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(760px, 94vw)" }}
        onHide={onClose}
        footer={loading ? undefined : dialogFooter}
      >
        {loading ? (
          <div className="text-center py-5">
            <i className="pi pi-spin pi-spinner mr-2" /> Cargando información del área...
          </div>
        ) : (
          <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
            {!infoArea && (
              <div
                className="animated fadeIn"
                style={{ background: "rgba(74,108,247,0.07)", border: "1px solid rgba(74,108,247,0.20)", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "0.84rem", color: "#4a6cf7", fontWeight: 500 }}
              >
                <i className="pi pi-info-circle" style={{ flexShrink: 0 }} />
                Esta área no tiene información creada. Completá el formulario para crearla.
              </div>
            )}

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
                <label className="profile-field-label">Introducción *</label>
                <input
                  className="profile-input"
                  type="text"
                  value={form.introduction}
                  onChange={(e) => setForm((p) => ({ ...p, introduction: e.target.value }))}
                />
                {touched && !form.introduction && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
              </div>
            </div>

            <div className="mb-3">
              <label className="profile-field-label">Texto *</label>
              <textarea id="mymce" />
              {touched && !form.text && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>

            <div className="row mt-2">
              <div className="col-12 col-xl-6 mb-3">
                <p className="profile-section-sub mb-2">Gestión de imágenes</p>
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

              <div className="col-12 col-xl-6 mb-3">
                <p className="profile-section-sub mb-2">Gestión de videos</p>
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
          </div>
        )}
      </Dialog>
    </>
  );
}