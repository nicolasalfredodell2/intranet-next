"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { useParams } from "next/navigation";
import { getNote, createNote, modificateNote, deleteNoteImage } from "@/lib/services/notes.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

declare function initEditorTinymce(): void;
declare const tinymce: any;

interface NoteForm { title: string; subtitle: string; description: string; }

export default function NotesPage() {
  const toast = useRef<Toast>(null);
  const params = useParams();
  const idNote = params?.id as string | undefined;
  const isModify = !!idNote;

  const [form, setForm] = useState<NoteForm>({ title: "", subtitle: "", description: "" });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disabledForWait, setDisabledForWait] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filesModificate, setFilesModificate] = useState<any[]>([]);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const intervalRef = useRef<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tryInit = () => {
      try {
        (window as any).initEditorTinymce?.();
        setEditorReady(true);
      } catch { /* retry */ }
    };
    const t = setTimeout(tryInit, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!editorReady) return;
    if (isModify && idNote) {
      loadNote(idNote);
    } else {
      startInterval();
    }
    return () => {
      clearInterval(intervalRef.current);
      try {
        if (tinymce.activeEditor) tinymce.EditorManager.execCommand("mceRemoveEditor", true, "mymce");
      } catch { /* ignore */ }
    };
  }, [editorReady]);

  function startInterval() {
    intervalRef.current = setInterval(() => {
      try {
        const content = tinymce.get("mymce")?.getContent?.();
        if (content !== undefined) setForm((p) => ({ ...p, description: content }));
      } catch { /* editor not ready */ }
    }, 1000);
  }

  async function loadNote(id: string) {
    setDisabledForWait(true);
    try {
      const resp = await getNote(id);
      setForm({ title: resp.title ?? "", subtitle: resp.subtitle ?? "", description: resp.description ?? "" });
      setFilesModificate(resp.images ?? []);
      setTimeout(() => {
        try { tinymce.activeEditor?.setContent(resp.description ?? ""); } catch { /* ignore */ }
        startInterval();
      }, 1500);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar la nota" });
    } finally {
      setDisabledForWait(false);
    }
  }

  function handleFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles);
    const valid: File[] = [];
    arr.forEach((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.current?.show({ severity: "info", summary: `El archivo ${f.name} no es una imagen válida.` });
      } else if (f.size > MAX_FILE_SIZE) {
        toast.current?.show({ severity: "info", summary: `El archivo ${f.name} pesa más de 5MB.` });
      } else {
        valid.push(f);
      }
    });
    setFiles((p) => [...p, ...valid]);
  }

  async function handleDeleteImage(image: any) {
    if (isDeletingImage || !idNote) return;
    setIsDeletingImage(true);
    try {
      await deleteNoteImage(idNote, image.id);
      setFilesModificate((prev) => prev.filter((img) => img.id !== image.id));
      toast.current?.show({ severity: "success", summary: "Imagen eliminada" });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar la imagen" });
    } finally {
      setIsDeletingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    // Get TinyMCE content
    let description = "";
    try { description = tinymce.get("mymce")?.getContent() ?? ""; } catch { /* ignore */ }
    setForm((p) => ({ ...p, description }));

    if (!form.title || !form.subtitle || !description) return;
    if (!isModify && files.length === 0) {
      toast.current?.show({ severity: "info", summary: "No se pudo crear la nota", detail: "Debe ingresar una imagen" });
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("subtitle", form.subtitle);
    fd.append("description", description);
    fd.append("featured_note", "0");
    files.forEach((f) => fd.append("files[]", f, f.name));

    try {
      if (isModify) {
        const resp = await modificateNote(fd, idNote!);
        toast.current?.show({ severity: "success", summary: "Nota modificada" });
        setFiles([]);
        if (resp.image) setFilesModificate([{ path_url: resp.image.path_url }]);
      } else {
        await createNote(fd);
        toast.current?.show({ severity: "success", summary: "Nota creada" });
        setFiles([]);
        setForm({ title: "", subtitle: "", description: "" });
        setTouched(false);
        try { tinymce.activeEditor?.setContent(""); } catch { /* ignore */ }
      }
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">{isModify ? "Modificación de nota" : "Subida de nota"}</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">{isModify ? "Modificación de nota" : "Subida de nota"}</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                {isModify && disabledForWait && (
                  <p className="text-muted"><i className="pi pi-spin pi-spinner mr-1" /> Cargando datos de la nota</p>
                )}

                <form className="animated fadeIn" onSubmit={handleSubmit} noValidate>
                  <div className="fadeIn animated form-group">
                    <label className="col-md-12"><small>TÍTULO</small></label>
                    <div className="col-md-12">
                      <input
                        type="text"
                        className="form-control form-control-line form-control-sm"
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      />
                      {touched && !form.title && <small className="text-danger animated fadeIn">* El título es obligatorio</small>}
                    </div>
                  </div>

                  <div className="fadeIn animated form-group">
                    <label className="col-md-12"><small>SUBTÍTULO</small></label>
                    <div className="col-md-12">
                      <input
                        type="text"
                        className="form-control form-control-line form-control-sm"
                        value={form.subtitle}
                        onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                      />
                      {touched && !form.subtitle && <small className="text-danger animated fadeIn">* El subtítulo es obligatorio</small>}
                    </div>
                  </div>

                  <div className="fadeIn animated form-group">
                    <label className="col-md-12"><small>IMÁGEN</small></label>
                    <div className="row px-3">
                      {isModify && filesModificate.length > 0 && (
                        <div className="col-12 fadeIn animated text-center mb-2">
                          <small>{filesModificate.length > 1 ? "(Imágenes previas)" : "(Imagen previa)"}</small>
                          <br />
                          {filesModificate.map((image, idx) => (
                            <div key={idx} className="position-relative d-inline-block m-2">
                              <img
                                className="rounded border"
                                style={{ width: 120, height: 120, objectFit: "cover" }}
                                src={image.path_url ? `${API_URL}${image.path_url}` : "/assets/img/news/no-image.png"}
                                alt="Imagen noticia"
                              />
                              {filesModificate.length > 1 && !isDeletingImage && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm rounded-circle position-absolute shadow animated fadeIn"
                                  style={{ top: 5, right: 5, width: 30, height: 30, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                  onClick={() => {
                                    const img = { ...image, showConfirm: !image.showConfirm };
                                    setFilesModificate((prev) => prev.map((i, j) => j === idx ? img : i));
                                  }}
                                  title="Eliminar imagen"
                                >
                                  <i className="mdi mdi-close" />
                                </button>
                              )}
                              {image.showConfirm && !isDeletingImage && (
                                <div className="shadow animated fadeIn">
                                  <div className="btn-group btn-group-sm mt-1">
                                    <button type="button" className="btn btn-danger px-2" onClick={() => handleDeleteImage(image)}>Sí</button>
                                    <button type="button" className="btn btn-secondary px-2" onClick={() => setFilesModificate((prev) => prev.map((i, j) => j === idx ? { ...i, showConfirm: false } : i))}>No</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="col-12">
                        <div
                          className={`dropzone-area${dragOver ? " drag-over" : ""}`}
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <p className="text-center text-muted mb-2">Seleccione o arrastre imágenes</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            style={{ display: "none" }}
                            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
                          />
                          {files.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mt-2">
                              {files.map((f, i) => (
                                <div key={i} className="position-relative d-inline-block">
                                  <img
                                    src={URL.createObjectURL(f)}
                                    alt={f.name}
                                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm rounded-circle position-absolute"
                                    style={{ top: 2, right: 2, width: 22, height: 22, padding: 0, fontSize: 10 }}
                                    onClick={(e) => { e.stopPropagation(); setFiles((p) => p.filter((_, j) => j !== i)); }}
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="col-md-12"><small>DESCRIPCIÓN</small></label>
                    <div className="col-md-12">
                      <textarea id="mymce" />
                      {touched && !form.description && <small className="text-danger animated fadeIn">* La descripción es obligatoria</small>}
                    </div>
                  </div>

                  <div className="fadeIn animated form-group mt-5">
                    {!disabledForWait && (
                      <button disabled={loading} type="submit" className={`btn btn-block ${!loading ? "btn-info" : "btn-muted"}`}>
                        {isModify
                          ? (loading ? "MODIFICANDO NOTA" : "MODIFICAR NOTA")
                          : (loading ? "SUBIENDO NOTA" : "SUBIR NOTA")}
                      </button>
                    )}
                  </div>
                </form>

                {(loading || disabledForWait) && <ProgressBar mode="indeterminate" style={{ height: "6px" }} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
