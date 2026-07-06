"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/lib/services/ticket.service";

interface TicketForm { description: string; key: string; }

export default function TicketPage() {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [form, setForm] = useState<TicketForm>({ description: "", key: "" });
  const [formModificate, setFormModificate] = useState<TicketForm>({ description: "", key: "" });
  const [touchedCreate, setTouchedCreate] = useState(false);
  const [touchedUpdate, setTouchedUpdate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoadingItems(true);
    try {
      const resp = await getSubjects();
      setItems([...resp.subjects].reverse());
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar los asuntos", detail: err.message });
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setTouchedCreate(true);
    if (!form.description || !form.key) return;
    setLoadingCreate(true);
    try {
      const resp = await createSubject(form);
      toast.current?.show({ severity: "success", summary: "Asunto creado", detail: resp.message });
      setItems((prev) => [resp.subject, ...prev]);
      setForm({ description: "", key: "" });
      setTouchedCreate(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear el asunto", detail: err.message });
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleUpdate() {
    setTouchedUpdate(true);
    if (!formModificate.description || !formModificate.key) return;
    setLoadingUpdate(true);
    try {
      const resp = await updateSubject(formModificate, selected.id);
      toast.current?.show({ severity: "success", summary: "Asunto modificado", detail: resp.message });
      setItems((prev) => prev.map((i) => i.id === selected.id ? resp.subject : i));
      setShowUpdate(false);
      setSelected(null);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo modificar el asunto", detail: err.message });
    } finally {
      setLoadingUpdate(false);
    }
  }

  async function handleDelete() {
    setLoadingDelete(true);
    try {
      const resp = await deleteSubject(selected.id);
      toast.current?.show({ severity: "success", summary: "Asunto eliminado", detail: resp.message });
      setItems((prev) => prev.filter((i) => i.id !== selected.id));
      setShowDelete(false);
      setSelected(null);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar el asunto", detail: err.message });
    } finally {
      setLoadingDelete(false);
    }
  }

  function openUpdate(item: any) {
    setSelected(item);
    setFormModificate({ description: item.description, key: item.key });
    setTouchedUpdate(false);
    setShowUpdate(true);
  }

  function openDelete(item: any) {
    setSelected(item);
    setShowDelete(true);
  }

  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleString("es-AR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const updateFooter = (
    <div>
      <button disabled={loadingUpdate} onClick={handleUpdate} className="btn btn-primary waves-effect">
        {loadingUpdate && <i className="animated fadeIn mr-1 pi pi-spin pi-spinner" />}
        {loadingUpdate ? "Modificando" : "Modificar"}
      </button>
      <button disabled={loadingUpdate} onClick={() => { setShowUpdate(false); setSelected(null); }} className="btn btn-default ml-2">Cerrar</button>
    </div>
  );

  const deleteFooter = (
    <div>
      <button disabled={loadingDelete} onClick={handleDelete} className="btn btn-danger waves-effect">
        {loadingDelete && <i className="animated fadeIn mr-1 pi pi-spin pi-spinner" />}
        {loadingDelete ? "Eliminando" : "Eliminar"}
      </button>
      <button disabled={loadingDelete} onClick={() => { setShowDelete(false); setSelected(null); }} className="btn btn-default ml-2">Cerrar</button>
    </div>
  );

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="animated fadeIn">
        <div className="row page-titles">
          <div className="align-self-center col-md-5">
            <h3 className="text-themecolor">Tickets</h3>
          </div>
          <div className="align-self-center col-md-7">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Tickets</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="card card-body">
              <div className="row">
                <div className="col-12">
                  <h5 className="h5">Creación de ticket</h5>
                  <form className="animated fadeIn" onSubmit={handleCreate} noValidate>
                    <div className="row">
                      <div className="col-12 col-md-4">
                        <div className="form-group">
                          <label><small>DESCRIPCIÓN</small></label>
                          <input className="form-control form-control-sm" type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                          {touchedCreate && !form.description && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="form-group">
                          <label><small>LLAVE</small></label>
                          <input className="form-control form-control-sm" type="text" value={form.key} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))} />
                          {touchedCreate && !form.key && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                        </div>
                      </div>
                      <div className="col-12 col-md-4 mt-4">
                        <button disabled={loadingCreate} type="submit" className={`btn btn-block ${!form.description || !form.key ? "btn-muted" : "btn-info"}`}>
                          {loadingCreate ? "CREANDO TICKET" : "CREAR TICKET"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="my-2 row"><div className="col-12"><hr /></div></div>

              <div className="animated fadeIn mb-5 row">
                <div className="col-12">
                  <h5 className="h5">{loadingItems ? "Cargando tickets" : "Listado de tickets"}</h5>
                  <DataTable value={items} loading={loadingItems} className="p-datatable-sm p-datatable-striped" paginator rows={10} showCurrentPageReport currentPageReportTemplate="Mostrando {first} al {last} de {totalRecords} asuntos" rowsPerPageOptions={[10, 20]}>
                    <Column field="description" header="DESCRIPCIÓN" body={(r) => <small>{r.description}</small>} sortable style={{ textAlign: "left" }} />
                    <Column field="key" header="LLAVE" body={(r) => <small>{r.key}</small>} sortable style={{ textAlign: "left", width: "25%" }} />
                    <Column field="created_at" header="CREADO EL" body={(r) => <small>{formatDate(r.created_at)}</small>} sortable style={{ width: "17.5%" }} />
                    <Column header="ACCIONES" style={{ width: "10%" }} body={(r) => (
                      <>
                        <i className="fa-regular fa-pen-to-square mx-1 pointer text-info" onClick={() => openUpdate(r)} title="Modificar" />
                        <i className="fa-regular fa-circle-xmark mx-1 pointer text-danger" onClick={() => openDelete(r)} title="Eliminar" />
                      </>
                    )} />
                  </DataTable>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header={`Modificación ticket <${selected?.description}>`}
        visible={showUpdate}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "50vw" }}
        onHide={() => {}}
        footer={updateFooter}
      >
        <div className="row">
          <div className="col-12 form-group">
            <label>Descripción</label>
            <input className="form-control" type="text" value={formModificate.description} onChange={(e) => setFormModificate((p) => ({ ...p, description: e.target.value }))} />
            {touchedUpdate && !formModificate.description && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
          </div>
          <div className="col-12 form-group">
            <label>Llave</label>
            <input className="form-control" type="text" value={formModificate.key} onChange={(e) => setFormModificate((p) => ({ ...p, key: e.target.value }))} />
            {touchedUpdate && !formModificate.key && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
          </div>
        </div>
      </Dialog>

      <Dialog
        header={`¿Eliminar ticket <${selected?.description}>?`}
        visible={showDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "50vw" }}
        onHide={() => {}}
        footer={deleteFooter}
      />
    </>
  );
}
