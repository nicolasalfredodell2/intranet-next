"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Paginator } from "primereact/paginator";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import Link from "next/link";
import { getNotes, deleteNote } from "@/lib/services/notes.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  function pageChange(e: any) {
    setNotes([]);
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

  const deleteFooter = (
    <div>
      <button disabled={loadingDelete} onClick={handleDeleteConfirm} className="btn btn-danger waves-effect">
        {loadingDelete && <i className="mr-1 pi pi-spin pi-spinner" />}
        {loadingDelete ? "Eliminando" : "Eliminar"}
      </button>
      <button disabled={loadingDelete} onClick={() => setNoteToDelete(null)} className="btn btn-default ml-2">Cancelar</button>
      {loadingDelete && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mt-2" />}
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Listado de notas</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Listado de notas</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="animated fadeIn row">
                  <div className="col-12">
                    <table className="table table-sm table-striped p-datatable-sm">
                      <thead>
                        <tr>
                          <th>IMAGEN</th>
                          <th>TÍTULO</th>
                          <th>SUBTÍTULO</th>
                          <th>LIKES <i className="mdi mdi-thumb-up text-primary" /></th>
                          <th>ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notes.map((note) => (
                          <tr key={note.id}>
                            <td>
                              <img
                                style={{ width: 60, height: 45, objectFit: "cover", borderRadius: 4 }}
                                alt={note.title}
                                src={note.images?.length > 0 && note.images[0].path_url ? `${API_URL}${note.images[0].path_url}` : "/assets/img/news/no-image.png"}
                              />
                            </td>
                            <td><small>{note.title}</small></td>
                            <td><small>{(note.subtitle?.length > 100 ? note.subtitle.slice(0, 100) + "..." : note.subtitle)}</small></td>
                            <td>{note.likes_count}</td>
                            <td className="text-nowrap text-center">
                              <Link href={`/main/notes/${note.id}`} title="Editar">
                                <i className="fa-regular fa-pen-to-square mr-2 text-info" />
                              </Link>
                              <i className="fa-regular fa-circle-xmark text-danger pointer" onClick={() => setNoteToDelete(note)} title="Eliminar" />
                            </td>
                          </tr>
                        ))}
                        {!loading && notes.length === 0 && (
                          <tr><td colSpan={5} className="text-center">No hay notas.</td></tr>
                        )}
                        {loading && (
                          <tr><td colSpan={5} className="text-center"><i className="pi pi-spin pi-spinner" /> Cargando notas.</td></tr>
                        )}
                      </tbody>
                    </table>

                    <Paginator
                      rows={perPage}
                      totalRecords={total}
                      onPageChange={pageChange}
                      pageLinkSize={3}
                      showCurrentPageReport
                      currentPageReportTemplate={`${from} al ${to} de ${total} noticias`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header={`¿Eliminar nota '${noteToDelete?.title}'?`}
        visible={!!noteToDelete}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "40vw" }}
        onHide={() => setNoteToDelete(null)}
        footer={deleteFooter}
      />
    </>
  );
}
