"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import Link from "next/link";
import { getNotes, deleteNote } from "@/lib/services/notes.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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

function SkeletonRows() {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="license-skeleton-row">
          {[15, 30, 30, 10, 15].map((w, j) => (
            <div key={j} className="license-skeleton-cell" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function NotesListPage() {
  const toast = useRef<Toast>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [noteToDelete, setNoteToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => { chargeNotes(); }, []);

  async function chargeNotes(p = 1) {
    setLoading(true);
    try {
      const resp = await getNotes(p, perPage);
      setNotes(resp.data ?? []);
      setTotal(resp.total ?? 0);
      setTo(resp.to ?? 0);
      setPage(p);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar las notas" });
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  function pageChange(e: any) {
    setFrom(e.first + 1);
    chargeNotes(e.page + 1);
  }

  async function handleDeleteConfirm() {
    if (!noteToDelete) return;
    setLoadingDelete(true);
    try {
      await deleteNote(noteToDelete.id);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
      toast.current?.show({ severity: "success", summary: `Se eliminó la nota '${noteToDelete.title}'` });
      setNoteToDelete(null);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar la nota" });
    } finally {
      setLoadingDelete(false);
    }
  }

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar nota</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="animated fadeIn">

        {/* Main card */}
        <div className="card profile-card license-main-card">

          {/* Header */}
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(74,108,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-file-edit" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Notas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Listado de notas</small>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => chargeNotes(page)}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body">
            {loading ? (
              <SkeletonRows />
            ) : (
              <div className="animated fadeIn">
                <DataTable
                  value={notes}
                  className="p-datatable-sm license-table"
                  emptyMessage={
                    <div className="license-empty">
                      <i className="pi pi-inbox" />
                      <p>No hay notas.</p>
                    </div>
                  }
                >
                  <Column
                    header="IMAGEN"
                    style={{ width: "8%" }}
                    body={(note) => (
                      note.images?.length > 0 && note.images[0].path_url ? (
                        <div
                          onMouseEnter={() => setHoveredImage(note.id)}
                          onMouseLeave={() => setHoveredImage(null)}
                          style={{ position: "relative", width: 150, height: 78, borderRadius: 8, overflow: "hidden" }}
                        >
                          <img
                            src={`${API_URL}${note.images[0].path_url}`}
                            alt={note.title}
                            onClick={() => setPreviewImage({ src: `${API_URL}${note.images[0].path_url}`, alt: note.title })}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "zoom-in", transition: "opacity 0.15s", opacity: hoveredImage === note.id ? 0.85 : 1 }}
                          />
                          <div
                            onClick={() => setPreviewImage({ src: `${API_URL}${note.images[0].path_url}`, alt: note.title })}
                            style={{
                              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              opacity: hoveredImage === note.id ? 1 : 0,
                              transition: "opacity 0.15s",
                              pointerEvents: hoveredImage === note.id ? "auto" : "none",
                              cursor: "zoom-in",
                            }}
                          >
                            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(30,41,59,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <i className="pi pi-search-plus" style={{ color: "#fff", fontSize: "0.95rem" }} />
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ width: 110, height: 78, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className="pi pi-image" style={{ color: "#cbd5e1", fontSize: "1.4rem" }} />
                        </div>
                      )
                    )}
                  />
                  <Column
                    header="TÍTULO"
                    style={{ width: "30%" }}
                    body={(note) => <span className="license-cell-primary">{note.title}</span>}
                  />
                  <Column
                    header="SUBTÍTULO"
                    style={{ width: "32%" }}
                    body={(note) => (
                      <span className="license-cell-secondary">
                        {note.subtitle?.length > 100 ? `${note.subtitle.slice(0, 100)}...` : note.subtitle}
                      </span>
                    )}
                  />
                  <Column
                    header="LIKES"
                    style={{ width: "10%", textAlign: "left" }}
                    body={(note) => <span className="license-cell-primary">{note.likes_count}</span>}
                  />
                  <Column
                    header=""
                    style={{ width: "15%", textAlign: "center" }}
                    body={(note) => (
                      <div className="d-flex align-items-center justify-content-center" style={{ gap: "6px" }}>
                        <Tooltip label="Editar">
                          <Link href={`/main/notes/${note.id}`} className="license-action-btn">
                            <i className="pi pi-pencil" />
                          </Link>
                        </Tooltip>
                        <Tooltip label="Eliminar">
                          <button
                            type="button"
                            onClick={() => setNoteToDelete(note)}
                            style={{ background: "none", border: "1.5px solid #fecdd3", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#dc3545", height: "30px" }}
                          >
                            <i className="pi pi-trash" />
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  />
                </DataTable>

                <Paginator
                  className="mt-2"
                  first={from - 1}
                  rows={perPage}
                  totalRecords={total}
                  onPageChange={pageChange}
                  pageLinkSize={3}
                  leftContent={
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500 }}>
                      {from} al {to} de {total} notas
                    </span>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        header={deleteDialogHeader}
        visible={!!noteToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setNoteToDelete(null)}
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
                onClick={() => setNoteToDelete(null)}
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
          Está a punto de eliminar la nota <strong>{noteToDelete?.title}</strong>.
        </p>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog
        header="Imagen de la nota"
        visible={!!previewImage}
        modal
        draggable={false}
        resizable={false}
        dismissableMask
        style={{ width: "min(90vw, 900px)" }}
        onHide={() => setPreviewImage(null)}
      >
        {previewImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewImage.src} alt={previewImage.alt} style={{ width: "100%", height: "auto", borderRadius: "8px", display: "block" }} />
        )}
      </Dialog>
    </>
  );
}
