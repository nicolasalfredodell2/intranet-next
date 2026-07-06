"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/services/calendar.service";
import { getCalendarCategories } from "@/lib/services/calendar-category.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function CalendarPage() {
  const toast = useRef<Toast>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [eventSelected, setEventSelected] = useState<any>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgModifFile, setImgModifFile] = useState<File | null>(null);

  const [createForm, setCreateForm] = useState({ event: "", date: "", text: "", category_id: "" });
  const [modifyForm, setModifyForm] = useState({ event: "", date: "", text: "", category_id: "" });
  const [createTouched, setCreateTouched] = useState(false);
  const [modifyTouched, setModifyTouched] = useState(false);
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [evts, cats] = await Promise.all([getCalendarEvents(), getCalendarCategories()]);
      const mapped = evts.map((e: any) => ({ ...e, color: e.color || e.category?.colour }));
      setEvents(mapped);
      setCategories(cats);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error cargando datos", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateTouched(true);
    if (!createForm.event || !createForm.date || !createForm.text || !createForm.category_id || !imgFile) return;
    setLoadingAction(true);
    const fd = new FormData();
    fd.append("event", createForm.event);
    fd.append("date", createForm.date);
    fd.append("text", createForm.text);
    fd.append("category_id", createForm.category_id);
    fd.append("image", imgFile, imgFile.name);
    try {
      await createCalendarEvent(fd);
      toast.current?.show({ severity: "success", summary: "Evento creado" });
      setShowCreate(false);
      setCreateForm({ event: "", date: "", text: "", category_id: "" });
      setImgFile(null); setCreateTouched(false);
      await loadData();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear el evento", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setModifyTouched(true);
    if (!modifyForm.event || !modifyForm.date || !modifyForm.text || !modifyForm.category_id) return;
    setLoadingAction(true);
    const fd = new FormData();
    fd.append("important_date_id", eventSelected.id);
    fd.append("event", modifyForm.event);
    fd.append("date", modifyForm.date);
    fd.append("text", modifyForm.text);
    fd.append("category_id", modifyForm.category_id);
    if (imgModifFile) fd.append("image", imgModifFile, imgModifFile.name);
    try {
      await updateCalendarEvent(fd);
      toast.current?.show({ severity: "success", summary: "Evento modificado" });
      setShowModify(false); setEventSelected(null); setImgModifFile(null); setModifyTouched(false);
      await loadData();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo modificar el evento", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDelete() {
    if (!eventSelected) return;
    setLoadingAction(true);
    try {
      await deleteCalendarEvent(eventSelected.id);
      toast.current?.show({ severity: "success", summary: "Evento eliminado" });
      setShowModify(false); setEventSelected(null);
      await loadData();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar el evento", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function openModify(event: any) {
    setEventSelected(event);
    setModifyForm({ event: event.event, date: event.date?.split("T")[0] ?? "", text: event.text ?? "", category_id: event.category_id ?? event.category?.id ?? "" });
    setImgModifFile(null); setModifyTouched(false);
    setShowModify(true);
  }

  const filtered = filterMonth ? events.filter((e) => e.date?.startsWith(filterMonth)) : events;
  const sortedByDate = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Calendario de fechas importantes</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Calendario</li>
            </ol>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12 d-flex gap-2 align-items-center flex-wrap">
            <input type="month" className="form-control form-control-sm" style={{ maxWidth: 200 }} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} placeholder="Filtrar por mes" />
            <button className="btn btn-info btn-sm" onClick={() => { setCreateForm({ event: "", date: "", text: "", category_id: "" }); setCreateTouched(false); setImgFile(null); setShowCreate(true); }}>
              <i className="mdi mdi-plus" /> Nuevo evento
            </button>
          </div>
        </div>

        {loading && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mb-3" />}

        <div className="row">
          {sortedByDate.map((event) => (
            <div key={event.id} className="col-12 col-md-6 col-lg-4 mb-4 fadeIn animated">
              <div className="card h-100" style={{ borderLeft: `4px solid ${event.color || event.category?.colour || "#ccc"}` }}>
                {event.image_url && (
                  <img src={`${API_URL}${event.image_url}`} alt={event.event} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                )}
                <div className="card-body">
                  <small className="text-muted">{event.date?.split("T")[0]}</small>
                  <h6 className="mt-1">{event.event}</h6>
                  <p className="text-muted small">{event.text}</p>
                  {event.category && <span className="badge" style={{ backgroundColor: event.category.colour, color: "#fff" }}>{event.category.name}</span>}
                </div>
                <div className="card-footer">
                  <button className="btn btn-sm btn-info" onClick={() => openModify(event)}><i className="mdi mdi-pencil-outline" /> Editar</button>
                </div>
              </div>
            </div>
          ))}
          {!loading && sortedByDate.length === 0 && <div className="col-12 text-center py-5 text-muted">No hay eventos para mostrar.</div>}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog header="Nuevo evento" visible={showCreate} modal draggable={false} resizable={false} style={{ width: "50vw" }} onHide={() => setShowCreate(false)}>
        <form onSubmit={handleCreate} noValidate>
          <div className="row">
            <div className="form-group col-12 col-md-6">
              <label><small>Título *</small></label>
              <input type="text" className="form-control" value={createForm.event} onChange={(e) => setCreateForm((p) => ({ ...p, event: e.target.value }))} />
              {createTouched && !createForm.event && <small className="text-danger">* Obligatorio</small>}
            </div>
            <div className="form-group col-12 col-md-6">
              <label><small>Fecha *</small></label>
              <input type="date" className="form-control" value={createForm.date} onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))} />
              {createTouched && !createForm.date && <small className="text-danger">* Obligatorio</small>}
            </div>
            <div className="form-group col-12 col-md-6">
              <label><small>Categoría *</small></label>
              <select className="custom-select w-100" value={createForm.category_id} onChange={(e) => setCreateForm((p) => ({ ...p, category_id: e.target.value }))}>
                <option value=""></option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {createTouched && !createForm.category_id && <small className="text-danger">* Obligatorio</small>}
            </div>
            <div className="form-group col-12">
              <label><small>Descripción *</small></label>
              <textarea className="form-control" value={createForm.text} onChange={(e) => setCreateForm((p) => ({ ...p, text: e.target.value }))} />
              {createTouched && !createForm.text && <small className="text-danger">* Obligatorio</small>}
            </div>
            <div className="form-group col-12">
              <label><small>Imagen *</small></label>
              <input type="file" accept="image/*" className="form-control-file" onChange={(e) => setImgFile(e.target.files?.[0] ?? null)} />
              {createTouched && !imgFile && <small className="text-danger">* Obligatorio</small>}
            </div>
          </div>
          <button disabled={loadingAction} type="submit" className="btn btn-info btn-block mt-2">
            {loadingAction ? "Creando..." : "Crear evento"}
          </button>
        </form>
      </Dialog>

      {/* Modify Dialog */}
      <Dialog header="Modificar evento" visible={showModify} modal draggable={false} resizable={false} style={{ width: "50vw" }} onHide={() => { setShowModify(false); setEventSelected(null); }}>
        <form onSubmit={handleUpdate} noValidate>
          <div className="row">
            <div className="form-group col-12 col-md-6">
              <label><small>Título *</small></label>
              <input type="text" className="form-control" value={modifyForm.event} onChange={(e) => setModifyForm((p) => ({ ...p, event: e.target.value }))} />
            </div>
            <div className="form-group col-12 col-md-6">
              <label><small>Fecha *</small></label>
              <input type="date" className="form-control" value={modifyForm.date} onChange={(e) => setModifyForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group col-12 col-md-6">
              <label><small>Categoría *</small></label>
              <select className="custom-select w-100" value={modifyForm.category_id} onChange={(e) => setModifyForm((p) => ({ ...p, category_id: e.target.value }))}>
                <option value=""></option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group col-12">
              <label><small>Descripción *</small></label>
              <textarea className="form-control" value={modifyForm.text} onChange={(e) => setModifyForm((p) => ({ ...p, text: e.target.value }))} />
            </div>
            <div className="form-group col-12">
              <label><small>Nueva imagen (opcional)</small></label>
              <input type="file" accept="image/*" className="form-control-file" onChange={(e) => setImgModifFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="d-flex gap-2 mt-2">
            <button disabled={loadingAction} type="submit" className="btn btn-info">{loadingAction ? "Guardando..." : "Guardar cambios"}</button>
            <button disabled={loadingAction} type="button" className="btn btn-danger" onClick={handleDelete}>{loadingAction ? "..." : "Eliminar"}</button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
