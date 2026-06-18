"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Paginator } from "primereact/paginator";
import { getNoticesConfig, getMyNotices, createNotice, modificateNotice, deleteNotice } from "@/lib/services/absence-notices.service";

interface NoticeForm {
  type: string;
  reason: string;
  description: string;
  notice_date: string;
}

function getTodayIso(): string {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const local = new Date(today.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

export default function AbsenceNoticesPage() {
  const toast = useRef<Toast>(null);
  const [config, setConfig] = useState<any>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [form, setForm] = useState<NoticeForm>({ type: "", reason: "", description: "", notice_date: "" });
  const [touched, setTouched] = useState(false);
  const [noticeParaModificar, setNoticeParaModificar] = useState<any>(null);
  const today = getTodayIso();

  useEffect(() => { loadConfig(); loadNotices(); }, []);

  async function loadConfig() {
    try {
      const resp = await getNoticesConfig();
      setConfig(resp);
      setTypes(resp.types ?? []);
      setReasons(resp.reasons ?? []);
      setStatuses(resp.statuses ?? []);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar la configuración", detail: err.message });
    }
  }

  async function loadNotices(p = 1) {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await getMyNotices(p, perPage);
      setNotices(resp.data);
      setTotal(resp.meta?.total ?? 0);
      setPage(p);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  const isAusencia = types.find((t) => t.id == form.type)?.code === "ausencia";

  function isFormValid(): boolean {
    if (!form.type || !form.description || !form.notice_date) return false;
    if (form.notice_date < today) return false;
    if (isAusencia && !form.reason) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isFormValid()) return;
    setLoadingAction(true);
    try {
      const payload: any = {
        notice_type_id: form.type,
        description: form.description,
        notice_date: form.notice_date,
      };
      if (isAusencia) payload.notice_reason_id = form.reason;

      if (noticeParaModificar) {
        const resp = await modificateNotice(payload, noticeParaModificar.id);
        setNotices((prev) => prev.map((n) => n.id === noticeParaModificar.id ? resp.absenceNotice ?? resp : n));
        toast.current?.show({ severity: "success", summary: "Aviso modificado" });
      } else {
        const resp = await createNotice(payload);
        setNotices((prev) => [resp, ...prev]);
        toast.current?.show({ severity: "success", summary: "Aviso creado" });
      }
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function limpiar() {
    setForm({ type: "", reason: "", description: "", notice_date: "" });
    setNoticeParaModificar(null);
    setTouched(false);
  }

  function llenarFormulario(notice: any) {
    setNoticeParaModificar(notice);
    setForm({
      type: notice.type?.id ?? "",
      reason: notice.reason?.id ?? "",
      description: notice.description ?? "",
      notice_date: notice.notice_date ?? "",
    });
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      toast.current?.show({ severity: "success", summary: "Aviso eliminado" });
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar el aviso" });
    }
  }

  const statusLabel = (s: any) => {
    const found = statuses.find((st) => st.id === (s?.id ?? s));
    return found?.name ?? s?.name ?? "";
  };

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Avisos</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Avisos</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <form className="animated fadeIn row" onSubmit={handleSubmit} noValidate>
                  <div className="fadeIn animated form-group col-12 col-lg-6">
                    <label className="col-12"><small>Tipo *</small></label>
                    <div className="col-md-12">
                      <select className="custom-select w-100" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, reason: "" }))}>
                        <option value=""></option>
                        {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      {touched && !form.type && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                    </div>

                    {isAusencia && (
                      <div className="alert alert-info mt-4 mx-3 d-flex align-items-center animated fadeIn">
                        <i className="mdi mdi-information-outline mr-2" />
                        <div><strong>Cuando es por ausencia, puede que tenga que presentar la documentación dentro de las 48hs siguientes.</strong></div>
                      </div>
                    )}

                    <div className="fadeIn animated form-group mt-3">
                      <label className="col-12"><small>Fecha <span className="text-danger">*</span></small></label>
                      <div className="col-md-12">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          min={today}
                          value={form.notice_date}
                          onChange={(e) => setForm((p) => ({ ...p, notice_date: e.target.value }))}
                        />
                        {touched && !form.notice_date && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                        {touched && form.notice_date && form.notice_date < today && <small className="text-danger animated fadeIn">* La fecha no puede ser anterior a hoy</small>}
                      </div>
                    </div>
                  </div>

                  {isAusencia && (
                    <div className="fadeIn animated form-group col-12 col-lg-6">
                      <label className="col-md-12"><small>Razón <span className="text-danger">*</span></small></label>
                      <div className="col-md-12">
                        <select className="custom-select w-100" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}>
                          <option value=""></option>
                          {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        {touched && isAusencia && !form.reason && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                      </div>
                    </div>
                  )}

                  <div className="fadeIn animated form-group col-12">
                    <label className="col-md-12"><small>Descripción *</small></label>
                    <div className="col-md-12">
                      <textarea className="form-control" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                      {touched && !form.description && <small className="text-danger animated fadeIn">* Campo obligatorio</small>}
                    </div>
                  </div>

                  <div className="fadeIn animated form-group col-12">
                    <div className="row">
                      <div className="col-6">
                        {!loading && (
                          <button disabled={loadingAction} type="submit" className="btn btn-block btn-info">
                            {noticeParaModificar
                              ? (loadingAction ? "MODIFICANDO AVISO" : "MODIFICAR AVISO")
                              : (loadingAction ? "CREANDO AVISO" : "CREAR AVISO")}
                          </button>
                        )}
                      </div>
                      <div className="col-6">
                        <button type="button" disabled={loading} className="btn btn-block btn-muted" onClick={limpiar}>Limpiar</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <hr />

        {/* List */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                {loading && <ProgressBar mode="indeterminate" style={{ height: "6px" }} />}

                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>TIPO</th>
                        <th>RAZÓN</th>
                        <th>FECHA</th>
                        <th>DESCRIPCIÓN</th>
                        <th>ESTADO</th>
                        <th>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notices.map((n) => (
                        <tr key={n.id} className="fadeIn animated">
                          <td><small>{n.type?.name}</small></td>
                          <td><small>{n.reason?.name ?? "-"}</small></td>
                          <td><small>{n.notice_date}</small></td>
                          <td><small>{n.description}</small></td>
                          <td><small>{statusLabel(n.status)}</small></td>
                          <td>
                            <i className="fa-regular fa-pen-to-square mx-1 pointer text-info" onClick={() => llenarFormulario(n)} title="Modificar" />
                            <i className="fa-regular fa-circle-xmark mx-1 pointer text-danger" onClick={() => handleDelete(n.id)} title="Eliminar" />
                          </td>
                        </tr>
                      ))}
                      {!loading && notices.length === 0 && (
                        <tr><td colSpan={6} className="text-center text-muted">No hay avisos.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Paginator
                  rows={perPage}
                  totalRecords={total}
                  onPageChange={(e) => loadNotices(e.page + 1)}
                  pageLinkSize={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
