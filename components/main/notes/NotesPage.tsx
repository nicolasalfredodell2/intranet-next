"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getNote, createNote, modificateNote, deleteNoteImage } from "@/lib/services/notes.service";
import RichTextEditor from "@/components/common/RichTextEditor";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

interface NoteForm { title: string; subtitle: string; description: string; }

function MultiFileDropzone({ files, onFiles, onRemove }: { files: File[]; onFiles: (f: FileList | File[]) => void; onRemove: (i: number) => void }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className={`dropzone-area${drag ? " drag-over" : ""} text-center`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
    >
      <small className="text-muted d-block">Arrastre o haga click para subir imágenes</small>
      <small className="text-muted d-block" style={{ fontSize: "0.7rem" }}><strong>JPG, JPEG, PNG, WEBP o GIF</strong> — <strong>MÁX. 5MB</strong></small>
      <input ref={ref} type="file" multiple accept={ACCEPTED_TYPES.join(",")} style={{ display: "none" }} onChange={(e) => { if (e.target.files) onFiles(e.target.files); }} />
      {files.length > 0 && (
        <div className="d-flex flex-wrap mt-2" style={{ gap: "8px" }} onClick={(e) => e.stopPropagation()}>
          {files.map((f, i) => (
            <div key={i} className="position-relative d-inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }} />
              <button type="button" className="btn btn-danger btn-sm rounded-circle position-absolute" style={{ top: 2, right: 2, width: 22, height: 22, padding: 0, fontSize: 10 }} onClick={() => onRemove(i)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotesPage() {
  const toast = useRef<Toast>(null);
  const params = useParams();
  const idNote = params?.id as string | undefined;
  const isModify = !!idNote;

  const [form, setForm] = useState<NoteForm>({ title: "", subtitle: "", description: "" });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disabledForWait, setDisabledForWait] = useState(isModify);
  const [files, setFiles] = useState<File[]>([]);
  const [filesModificate, setFilesModificate] = useState<any[]>([]);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (isModify && idNote) loadNote(idNote);
  }, [idNote]);

  async function loadNote(id: string) {
    setDisabledForWait(true);
    try {
      const resp = await getNote(id);
      setForm({ title: resp.title ?? "", subtitle: resp.subtitle ?? "", description: resp.description ?? "" });
      setFilesModificate(resp.images ?? []);
      setEditorKey((k) => k + 1);
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

  function limpiar() {
    setForm({ title: "", subtitle: "", description: "" });
    setFiles([]);
    setTouched(false);
    setEditorKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    const description = form.description;
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
        limpiar();
      }
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">

        {/* Header card */}
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(74,108,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-file-edit" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Notas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{isModify ? "Modificación de nota" : "Subida de nota"}</small>
            </div>
            <Link
              href="/main/noteslist"
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className="pi pi-list" style={{ fontSize: "0.78rem" }} />
              Ver listado
            </Link>
          </div>
        </div>

        {/* Form card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(74,108,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className={isModify ? "pi pi-pencil" : "pi pi-plus-circle"} style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>{isModify ? "Modificar nota" : "Nueva nota"}</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                {isModify ? "Actualizá los datos de la nota" : "Completá los datos para publicar una nota"}
              </small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            {isModify && disabledForWait ? (
              <p className="text-muted py-3"><i className="pi pi-spin pi-spinner mr-1" /> Cargando datos de la nota</p>
            ) : (
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
                  {touched && !form.title && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* El título es obligatorio</small>}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Subtítulo *</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                  />
                  {touched && !form.subtitle && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* El subtítulo es obligatorio</small>}
                </div>
              </div>

              <div className="mb-3">
                <label className="profile-field-label">Imágenes {!isModify && "*"}</label>

                {isModify && filesModificate.length > 0 && (
                  <div className="d-flex flex-wrap align-items-center mb-2" style={{ gap: "10px" }}>
                    {filesModificate.map((image, idx) => (
                      <div key={idx} className="d-flex align-items-center" style={{ gap: "8px" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="rounded border"
                          style={{ width: 80, height: 80, objectFit: "cover" }}
                          src={image.path_url ? `${API_URL}${image.path_url}` : "/assets/img/news/no-image.png"}
                          alt="Imagen noticia"
                        />
                        {!isDeletingImage && filesModificate.length > 1 && (
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteImage(image)}>Quitar</button>
                        )}
                      </div>
                    ))}
                    {isDeletingImage && <i className="pi pi-spin pi-spinner" />}
                  </div>
                )}

                <MultiFileDropzone
                  files={files}
                  onFiles={handleFiles}
                  onRemove={(i) => setFiles((p) => p.filter((_, j) => j !== i))}
                />
                {touched && !isModify && files.length === 0 && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Debe ingresar una imagen</small>}
              </div>

              <div className="mb-1">
                <label className="profile-field-label">Descripción *</label>
                <RichTextEditor
                  key={editorKey}
                  content={form.description}
                  onChange={(html) => setForm((p) => ({ ...p, description: html }))}
                />
                {touched && !form.description && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* La descripción es obligatoria</small>}
              </div>

              <div className="d-flex align-items-center mt-4" style={{ gap: "8px" }}>
                <button
                  disabled={loading}
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                  {isModify
                    ? (loading ? "Modificando..." : "Modificar nota")
                    : (loading ? "Subiendo..." : "Subir nota")}
                </button>
                {!isModify && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={limpiar}
                    className="btn btn-light text-muted ml-auto"
                    style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {loading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
            </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
