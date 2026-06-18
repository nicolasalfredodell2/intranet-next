"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Paginator } from "primereact/paginator";
import { getNoticesConfig, getAllNoticesAdmin, modificateNoticeAdmin } from "@/lib/services/absence-notices.service";

export default function AbsenceNoticesAdminPage() {
  const toast = useRef<Toast>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [noticeParaModificar, setNoticeParaModificar] = useState<any>(null);
  const [form, setForm] = useState({ type: "", reason: "", description: "" });
  const [touched, setTouched] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [filterForm, setFilterForm] = useState({ notice_type_id: "", notice_reason_id: "", notice_status_id: "", legajo: "", date_from: "", date_to: "" });

  useEffect(() => {
    loadConfig();
    loadNotices();
  }, []);

  async function loadConfig() {
    try {
      const resp = await getNoticesConfig();
      setTypes(resp.types ?? []);
      setReasons(resp.reasons ?? []);
      setStatuses(resp.statuses ?? []);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar la configuración", detail: err.message });
    }
  }

  async function loadNotices(p = 1, f = filters) {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await getAllNoticesAdmin(p, perPage, f);
      setNotices(resp.data ?? []);
      setTotal(resp.meta?.total ?? 0);
      setPage(p);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    const f: any = {};
    if (filterForm.notice_type_id) f.notice_type_id = filterForm.notice_type_id;
    if (filterForm.notice_reason_id) f.notice_reason_id = filterForm.notice_reason_id;
    if (filterForm.notice_status_id) f.notice_status_id = filterForm.notice_status_id;
    if (filterForm.legajo) f.legajo = filterForm.legajo;
    if (filterForm.date_from) f.date_from = filterForm.date_from;
    if (filterForm.date_to) f.date_to = filterForm.date_to;
    setFilters(f);
    loadNotices(1, f);
  }

  function clearFilters() {
    setFilterForm({ notice_type_id: "", notice_reason_id: "", notice_status_id: "", legajo: "", date_from: "", date_to: "" });
    setFilters({});
    loadNotices(1, {});
  }

  function llenarFormulario(notice: any) {
    setNoticeParaModificar(notice);
    setForm({
      type: notice.type?.id ?? "",
      reason: notice.reason?.id ?? "",
      description: notice.description ?? "",
    });
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.description) return;
    if (!noticeParaModificar) return;
    setLoadingAction(true);
    try {
      const payload: any = {
        notice_type_id: form.type,
        description: form.description,
      };
      if (form.reason) payload.notice_reason_id = form.reason;
      const resp = await modificateNoticeAdmin(payload, noticeParaModificar.id);
      setNotices((prev) => prev.map((n) => n.id === noticeParaModificar.id ? resp ?? n : n));
      toast.current?.show({ severity: "success", summary: "Aviso modificado" });
      limpiar();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  function limpiar() {
    setForm({ type: "", reason: "", description: "" });
    setNoticeParaModificar(null);
    setTouched(false);
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
            <h3 className="text-themecolor">Avisos (Administración)</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Avisos Admin</li>
            </ol>
          </div>
        </div>

        {noticeParaModificar && (
          <div className="row fadeIn animated">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Modificar aviso</h5>
                  <button type="button" className="btn btn-sm btn-light" onClick={limpiar}>× Cancelar</button>
                </div>
                <div className="card-body">
                  <form className="row" onSubmit={handleSubmit} noValidate>
                    <div className="form-group col-12 col-md-4">
                      <label><small>Tipo *</small></label>
                      <select className="custom-select w-100" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                        <option value=""></option>
                        {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group col-12 col-md-4">
                      <label><small>Razón</small></label>
                      <select className="custom-select w-100" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}>
                        <option value=""></option>
                        {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group col-12">
                      <label><small>Descripción *</small></label>
                      <textarea className="form-control" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                      {touched && !form.description && <small className="text-danger">* Obligatorio</small>}
                    </div>
                    <div className="col-6">
                      <button disabled={loadingAction} type="submit" className="btn btn-block btn-info">
                        {loadingAction ? "MODIFICANDO" : "MODIFICAR"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-6 col-md-2">
                    <select className="custom-select custom-select-sm w-100" value={filterForm.notice_type_id} onChange={(e) => setFilterForm((p) => ({ ...p, notice_type_id: e.target.value }))}>
                      <option value="">Tipo</option>
                      {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <select className="custom-select custom-select-sm w-100" value={filterForm.notice_reason_id} onChange={(e) => setFilterForm((p) => ({ ...p, notice_reason_id: e.target.value }))}>
                      <option value="">Razón</option>
                      {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <select className="custom-select custom-select-sm w-100" value={filterForm.notice_status_id} onChange={(e) => setFilterForm((p) => ({ ...p, notice_status_id: e.target.value }))}>
                      <option value="">Estado</option>
                      {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <input type="text" className="form-control form-control-sm" placeholder="Legajo" value={filterForm.legajo} onChange={(e) => setFilterForm((p) => ({ ...p, legajo: e.target.value }))} />
                  </div>
                  <div className="col-6 col-md-2">
                    <input type="date" className="form-control form-control-sm" value={filterForm.date_from} onChange={(e) => setFilterForm((p) => ({ ...p, date_from: e.target.value }))} />
                  </div>
                  <div className="col-6 col-md-2">
                    <input type="date" className="form-control form-control-sm" value={filterForm.date_to} onChange={(e) => setFilterForm((p) => ({ ...p, date_to: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-2 d-flex gap-2">
                  <button className="btn btn-sm btn-info" onClick={applyFilters}>Filtrar</button>
                  <button className="btn btn-sm btn-light" onClick={clearFilters}>Limpiar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                {loading && <ProgressBar mode="indeterminate" style={{ height: "6px" }} />}
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>AGENTE</th>
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
                          <td><small>{n.people?.lastname_name ?? n.cuil}</small></td>
                          <td><small>{n.type?.name}</small></td>
                          <td><small>{n.reason?.name ?? "-"}</small></td>
                          <td><small>{n.notice_date}</small></td>
                          <td><small>{n.description}</small></td>
                          <td><small>{statusLabel(n.status)}</small></td>
                          <td>
                            <i className="fa-regular fa-pen-to-square mx-1 pointer text-info" onClick={() => llenarFormulario(n)} title="Modificar" />
                          </td>
                        </tr>
                      ))}
                      {!loading && notices.length === 0 && (
                        <tr><td colSpan={7} className="text-center text-muted">No hay avisos.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Paginator rows={perPage} totalRecords={total} onPageChange={(e) => loadNotices(e.page + 1)} pageLinkSize={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
