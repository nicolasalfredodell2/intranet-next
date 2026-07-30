"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { ProgressBar } from "primereact/progressbar";
import { Calendar, Willow, getToolbarItems, type CalendarInstanceApi } from "@svar-ui/react-calendar";
import { Locale } from "@svar-ui/react-core";
import "@svar-ui/react-calendar/all.css";
import esCoreLocale from "@svar-ui/core-locales/locales/es.js";
import esCalendarLocale from "@svar-ui/calendar-locales/es.js";
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/services/calendar.service";
import { getCalendarCategories } from "@/lib/services/calendar-category.service";

const CALENDAR_LOCALE_ES = { ...esCoreLocale, ...esCalendarLocale };

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const ACCEPTED_IMAGES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]}, ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface EventForm { event: string; date: string; text: string; category_id: string; }

function ImageDropzone({ file, onFile, onClear, existingImageUrl }: { file: File | null; onFile: (f: File) => void; onClear: () => void; existingImageUrl?: string | null }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : existingImageUrl;

  return (
    <div
      className={`dropzone-area${drag ? " drag-over" : ""} text-center`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
      onClick={() => ref.current?.click()}
    >
      <small className="text-muted d-block">Seleccioná o arrastrá una imagen</small>
      <small className="text-muted d-block" style={{ fontSize: "0.7rem" }}><strong>JPG, JPEG, PNG, WEBP o GIF</strong></small>
      <input
        ref={ref}
        type="file"
        accept={ACCEPTED_IMAGES.join(",")}
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />
      {previewUrl && (
        <div className="mt-2 position-relative d-inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" style={{ width: 140, height: 90, objectFit: "cover", borderRadius: 8 }} />
          {file && (
            <button
              type="button"
              className="btn btn-danger btn-sm rounded-circle position-absolute"
              style={{ top: 2, right: 2, width: 22, height: 22, padding: 0, fontSize: 10 }}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const toast = useRef<Toast>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingModify, setLoadingModify] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [eventSelected, setEventSelected] = useState<any>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgModifFile, setImgModifFile] = useState<File | null>(null);

  const [createForm, setCreateForm] = useState<EventForm>({ event: "", date: "", text: "", category_id: "" });
  const [modifyForm, setModifyForm] = useState<EventForm>({ event: "", date: "", text: "", category_id: "" });
  const [createTouched, setCreateTouched] = useState(false);
  const [modifyTouched, setModifyTouched] = useState(false);

  const calendarApiRef = useRef<CalendarInstanceApi | null>(null);
  const eventsRef = useRef<any[]>([]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { eventsRef.current = events; }, [events]);

  // Fully own event creation/selection instead of the widget's default popup editor,
  // so we can use our own PrimeReact dialogs (category select, image upload, etc).
  useEffect(() => {
    const api = calendarApiRef.current;
    if (!api) return;
    api.intercept("add-event", (ev: any) => {
      const start = ev?.event?.start ? new Date(ev.event.start) : new Date();
      openCreate(toDateInputValue(start));
      return false;
    }, { tag: "calendar-add-event" });
    api.intercept("select-event", (ev: any) => {
      if (ev?.id != null) {
        const raw = eventsRef.current.find((e) => String(e.id) === String(ev.id));
        if (raw) openModify(raw);
      }
      return false;
    }, { tag: "calendar-select-event" });
    api.intercept("update-event", () => false, { tag: "calendar-update-event" });
    api.intercept("move-event", () => false, { tag: "calendar-move-event" });
    return () => {
      api.detach("calendar-add-event");
      api.detach("calendar-select-event");
      api.detach("calendar-update-event");
      api.detach("calendar-move-event");
    };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [evts, cats] = await Promise.all([getCalendarEvents(), getCalendarCategories()]);
      const mapped = evts.map((e: any) => ({ ...e, color: e.color || e.category?.colour }));
      setEvents(mapped);
      setCategories(cats);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar los datos", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  function openCreate(dateStr: string) {
    setCreateForm({ event: "", date: dateStr, text: "", category_id: "" });
    setCreateTouched(false);
    setImgFile(null);
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
    setCreateForm({ event: "", date: "", text: "", category_id: "" });
    setCreateTouched(false);
    setImgFile(null);
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
    fd.append("category_id", String(createForm.category_id));
    fd.append("image", imgFile, imgFile.name);
    try {
      await createCalendarEvent(fd);
      toast.current?.show({ severity: "success", summary: "Evento creado" });
      closeCreate();
      await loadData();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear el evento", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function openModify(event: any) {
    setEventSelected(event);
    setModifyForm({
      event: event.event,
      date: event.date?.split("T")[0] ?? "",
      text: event.text ?? "",
      category_id: String(event.category_id ?? event.category?.id ?? ""),
    });
    setImgModifFile(null);
    setModifyTouched(false);
    setShowModify(true);
  }

  function closeModify() {
    setShowModify(false);
    setEventSelected(null);
    setModifyForm({ event: "", date: "", text: "", category_id: "" });
    setModifyTouched(false);
    setImgModifFile(null);
  }

  async function handleModifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setModifyTouched(true);
    if (!modifyForm.event || !modifyForm.date || !modifyForm.text || !modifyForm.category_id || !eventSelected) return;
    setLoadingModify(true);
    const fd = new FormData();
    fd.append("important_date_id", eventSelected.id);
    fd.append("event", modifyForm.event);
    fd.append("date", modifyForm.date);
    fd.append("text", modifyForm.text);
    fd.append("category_id", String(modifyForm.category_id));
    if (imgModifFile) fd.append("image", imgModifFile, imgModifFile.name);
    try {
      await updateCalendarEvent(fd);
      toast.current?.show({ severity: "success", summary: "Evento modificado" });
      closeModify();
      await loadData();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo modificar el evento", detail: err.message });
    } finally {
      setLoadingModify(false);
    }
  }

  async function handleDelete() {
    if (!eventSelected) return;
    setLoadingDelete(true);
    try {
      await deleteCalendarEvent(eventSelected.id);
      toast.current?.show({ severity: "success", summary: "Evento eliminado" });
      closeModify();
      await loadData();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar el evento", detail: err.message });
    } finally {
      setLoadingDelete(false);
    }
  }

  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.description ?? c.name }));

  // Drop the library's default icon-only "+" button; we render our own labeled button instead.
  const toolbarItems = getToolbarItems().filter((item) => item.id !== "add-event");

  const calendarEvents = events.map((e) => {
    const start = new Date(`${e.date?.split("T")[0]}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      id: e.id,
      start,
      end,
      allDay: true,
      text: e.event,
      color: e.color || "#94a3b8",
    };
  });

  const createDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-plus-circle" style={{ color: "#059669", fontSize: "1rem" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Nuevo evento</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{formatDisplayDate(createForm.date)}</small>
      </div>
    </div>
  );

  const modifyDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar/Eliminar evento</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{formatDisplayDate(modifyForm.date)}</small>
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
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "rgba(74,108,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-calendar" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Calendario de fechas importantes</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de eventos institucionales</small>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={loadData}
              className="btn btn-light d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px", color: "#64748b" }}
            >
              <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} style={{ fontSize: "0.78rem" }} />
              Recargar
            </button>
          </div>
        </div>

        {/* Calendar card */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-th-large" style={{ color: "#3b82f6", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Vista mensual</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Hacé clic en un día para crear un evento, o en un evento para modificarlo</small>
            </div>
            <button
              type="button"
              onClick={() => openCreate(toDateInputValue(new Date()))}
              className="btn btn-primary d-flex align-items-center"
              style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px" }}
            >
              <i className="pi pi-plus" style={{ fontSize: "0.75rem" }} />
              Crear evento
            </button>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            {loading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mb-3" />}
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 700, height: 700, display: "grid" }}>
                <Locale words={CALENDAR_LOCALE_ES}>
                  <Willow>
                    <Calendar
                      ref={calendarApiRef}
                      events={calendarEvents}
                      date={new Date()}
                      views={["month"]}
                      view="month"
                      toolbar={{ items: toolbarItems }}
                    />
                  </Willow>
                </Locale>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create event dialog */}
      <Dialog
        header={createDialogHeader}
        visible={showCreate}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(720px, 92vw)" }}
        onHide={closeCreate}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="create-event-form"
                disabled={loadingAction}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingAction ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingAction ? "Creando..." : "Crear evento"}
              </button>
              <button
                disabled={loadingAction}
                onClick={closeCreate}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {loadingAction && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <form id="create-event-form" onSubmit={handleCreate} noValidate>
          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label className="profile-field-label">Título *</label>
              <input
                className="profile-input"
                type="text"
                value={createForm.event}
                onChange={(e) => setCreateForm((p) => ({ ...p, event: e.target.value }))}
              />
              {createTouched && !createForm.event && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="profile-field-label">Categoría *</label>
              <Dropdown
                value={createForm.category_id || null}
                options={categoryOptions}
                optionLabel="label"
                optionValue="id"
                onChange={(e) => setCreateForm((p) => ({ ...p, category_id: e.value ?? "" }))}
                placeholder="Seleccioná una categoría"
                className="profile-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
              {createTouched && !createForm.category_id && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="profile-field-label">Fecha *</label>
              <input
                className="profile-input"
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
              />
              {createTouched && !createForm.date && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 mb-3">
              <label className="profile-field-label">Descripción *</label>
              <textarea
                className="profile-input"
                rows={3}
                value={createForm.text}
                onChange={(e) => setCreateForm((p) => ({ ...p, text: e.target.value }))}
              />
              {createTouched && !createForm.text && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 mb-1">
              <label className="profile-field-label">Imagen *</label>
              <ImageDropzone file={imgFile} onFile={setImgFile} onClear={() => setImgFile(null)} />
              {createTouched && !imgFile && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
          </div>
        </form>
      </Dialog>

      {/* Modify/delete event dialog */}
      <Dialog
        header={modifyDialogHeader}
        visible={showModify}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(720px, 92vw)" }}
        onHide={closeModify}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                form="modify-event-form"
                disabled={loadingModify || loadingDelete}
                type="submit"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingModify ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingModify ? "Modificando..." : "Modificar"}
              </button>
              <button
                disabled={loadingModify || loadingDelete}
                onClick={handleDelete}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingDelete ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {loadingDelete ? "Eliminando..." : "Eliminar"}
              </button>
              <button
                disabled={loadingModify || loadingDelete}
                onClick={closeModify}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {(loadingModify || loadingDelete) && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <form id="modify-event-form" onSubmit={handleModifySubmit} noValidate>
          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label className="profile-field-label">Título *</label>
              <input
                className="profile-input"
                type="text"
                value={modifyForm.event}
                onChange={(e) => setModifyForm((p) => ({ ...p, event: e.target.value }))}
              />
              {modifyTouched && !modifyForm.event && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="profile-field-label">Categoría *</label>
              <Dropdown
                value={modifyForm.category_id || null}
                options={categoryOptions}
                optionLabel="label"
                optionValue="id"
                onChange={(e) => setModifyForm((p) => ({ ...p, category_id: e.value ?? "" }))}
                placeholder="Seleccioná una categoría"
                className="profile-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
              {modifyTouched && !modifyForm.category_id && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="profile-field-label">Fecha *</label>
              <input
                className="profile-input"
                type="date"
                value={modifyForm.date}
                onChange={(e) => setModifyForm((p) => ({ ...p, date: e.target.value }))}
              />
              {modifyTouched && !modifyForm.date && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 mb-3">
              <label className="profile-field-label">Descripción *</label>
              <textarea
                className="profile-input"
                rows={3}
                value={modifyForm.text}
                onChange={(e) => setModifyForm((p) => ({ ...p, text: e.target.value }))}
              />
              {modifyTouched && !modifyForm.text && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
            </div>
            <div className="col-12 mb-1">
              <label className="profile-field-label">{eventSelected?.image_url ? "Imagen actual (opcional reemplazar)" : "Imagen (opcional)"}</label>
              <ImageDropzone
                file={imgModifFile}
                onFile={setImgModifFile}
                onClear={() => setImgModifFile(null)}
                existingImageUrl={eventSelected?.image_url ? `${API_URL}${eventSelected.image_url}` : null}
              />
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}
