"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { Paginator } from "primereact/paginator";
import { AutoComplete } from "primereact/autocomplete";
import { getInternals } from "@/lib/services/internal.service";
import { getAllBossesForLegajo } from "@/lib/services/boss.service";
import { createExitOrderAdmin, updateExitOrderAdmin, deleteExitOrderAdmin } from "@/lib/services/exits.service";
import {
  getRecordedData,
  createRecord,
  updateRecord,
  deleteRecord,
} from "@/lib/services/recorded.service";

type ToastFn = (severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) => void;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function nowForDatetimeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateDMY(value: string | null | undefined): string {
  if (!value) return "-";
  const datePart = value.split(/[ T]/)[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function toDatetimeLocal(datePart: string | null | undefined, timePart: string | null | undefined): string {
  const dateOnly = datePart?.split(/[ T]/)[0] ?? "";
  const timeOnly = (timePart ?? "").substring(0, 5);
  return dateOnly && timeOnly ? `${dateOnly}T${timeOnly}` : "";
}

function formatDatetimePayload(value: string): string {
  return `${value.replace("T", " ")}${value.length === 16 ? ":00" : ""}`;
}

function hostLabel(host: string | undefined | null): string {
  if (host === "RF_IN") return "Reloj Interno";
  if (host === "RF_OUT") return "Reloj Externo";
  if (host === "RRHH") return "Creado manualmente";
  return "-";
}

const CREATE_RECORD_TYPE_OPTIONS = [
  { value: "1", label: "Ingreso laboral (inicio de jornada)" },
  { value: "2", label: "Salida temporal" },
  { value: "3", label: "Regreso salida temporal" },
  { value: "4", label: "Egreso laboral (fin de jornada)" },
  { value: "5", label: "Salida por salud o cuidado familiar" },
  { value: "6", label: "Inicio de horas extras" },
  { value: "7", label: "Fin de horas extras" },
];

const UPDATE_RECORD_TYPE_OPTIONS = [
  { value: "1", label: "Ingreso laboral (inicio de jornada)" },
  { value: "4", label: "Egreso laboral (fin de jornada)" },
  { value: "5", label: "Salida por salud o cuidado familiar" },
];

const EXIT_TYPE_OPTIONS = [
  { value: "Unexpected", label: "Sin órden de salida" },
  { value: "Individuals", label: "Particular" },
  { value: "Officials", label: "Oficial" },
  { value: "Guild_Meeting_Attendance", label: "Asamblea" },
  { value: "Education", label: "Licencia por estudio/capacitación" },
  { value: "Health", label: "Salud o cuidado familiar" },
  { value: "Maternity_Breastfeeding", label: "Lactancia - Maternidad" },
  { value: "Others_Justify", label: "Otras justificaciones" },
];

const FILTER_STATUS_OPTIONS = [
  { value: "Pending", label: "Pendiente de aprobación" },
  { value: "Waiting", label: "En espera" },
  { value: "Done", label: "Finalizado" },
  { value: "Cancel", label: "Cancelado" },
];

const EXIT_TYPE_LABELS: Record<string, string> = {
  Officials: "Oficial",
  Education: "Licencia por estudio/capacitación",
  Individuals: "Particular",
  Unexpected: "Sin orden de salida",
  Health: "Salud o cuidado familiar",
  Maternity_Breastfeeding: "Lactandia - Maternidad",
  Guild_Meeting_Attendance: "Asamblea",
  Others_Justify: "Otras justificaciones",
};

// ── Buscar agente ────────────────────────────────────────────────────────────
function SearchUserSection({ onSelect }: { onSelect: (file: string) => void }) {
  const [value, setValue] = useState<any>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  async function search(e: { query: string }) {
    try {
      const resp = await getInternals(e.query, { puch_in: true });
      setSuggestions((resp ?? []).map((u: any) => ({ ...u, name: `${u.file} - ${u.lastname_name}` })));
    } catch {
      setSuggestions([]);
    }
  }

  function handleChange(e: any) {
    setValue(e.value);
    if (e.value && typeof e.value === "object") onSelect(e.value.file);
  }

  return (
    <div className="col-12">
      <h3>Buscar agente</h3>
      <div className="mt-2">
        <AutoComplete
          value={value}
          suggestions={suggestions}
          completeMethod={search}
          field="name"
          minLength={1}
          scrollHeight="180px"
          placeholder="Busque por apellido o legajo"
          emptyMessage="No se encontraron usuarios con ese legajo, nombre o apellido"
          onChange={handleChange}
          className="w-100"
          inputClassName="form-control form-control-sm w-100"
          panelClassName="w-100"
        />
      </div>
      <div className="col-12 my-1 px-0"><hr /></div>
    </div>
  );
}

// ── Creación de fichadas ─────────────────────────────────────────────────────
function CreateSignSection({ fileOfUserSelected, onCreated, showToast }: { fileOfUserSelected: string; onCreated: () => void; showToast: ToastFn }) {
  const disabled = !fileOfUserSelected;
  const [datetime, setDatetime] = useState("");
  const [type, setType] = useState("1");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const today = nowForDatetimeLocal();

  useEffect(() => {
    if (!fileOfUserSelected) { setDatetime(""); setType("1"); setTouched(false); }
  }, [fileOfUserSelected]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (disabled || !datetime) return;
    setLoading(true);
    try {
      await createRecord({ datetime: formatDatetimePayload(datetime), file: fileOfUserSelected, type_exit_order_id: type });
      showToast("success", "Fichada creada");
      setDatetime(""); setType("1"); setTouched(false);
      onCreated();
    } catch (err: any) {
      showToast("info", "No se pudo crear la fichada", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="col-12">
      <h3>Creación de fichadas</h3>
      <form className="row" onSubmit={submit} noValidate>
        <div className="col-12 col-md-6 col-lg-4">
          <label htmlFor="datetime"><small>FECHA Y HORA</small></label>
          <input
            className="form-control form-control-sm"
            type="datetime-local"
            id="datetime"
            max={today}
            disabled={disabled}
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
          {touched && !datetime && <small className="text-danger d-block animated fadeIn">* Campo obligatorio</small>}
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <label htmlFor="type_exit_order_id"><small>TIPO DE FICHADA</small></label>
          <select
            className="form-control form-control-sm custom-select"
            id="type_exit_order_id"
            disabled={disabled}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {CREATE_RECORD_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <button
            disabled={disabled || loading}
            type="submit"
            style={{ marginTop: "32.5px" }}
            className={`btn btn-sm w-100 ${!disabled && !loading ? "btn-info" : "btn-secondary"}`}
          >
            {loading ? "GENERANDO FICHADA..." : "GENERAR FICHADA"}
          </button>
        </div>
      </form>
      <div className="col-12 my-1 px-0"><hr /></div>
    </div>
  );
}

// ── Creación de órdenes de salida ────────────────────────────────────────────
function CreateExitOrderSection({ fileOfUserSelected, onCreated, showToast }: { fileOfUserSelected: string; onCreated: () => void; showToast: ToastFn }) {
  const disabled = !fileOfUserSelected;
  const [type, setType] = useState("");
  const [departureHour, setDepartureHour] = useState("");
  const [arrivalHour, setArrivalHour] = useState("");
  const [cuilBoss, setCuilBoss] = useState("");
  const [bosses, setBosses] = useState<any[]>([]);
  const [loadingBosses, setLoadingBosses] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fileOfUserSelected) {
      chargeBosses(fileOfUserSelected);
    } else {
      setType(""); setDepartureHour(""); setArrivalHour(""); setCuilBoss(""); setBosses([]); setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileOfUserSelected]);

  async function chargeBosses(file: string) {
    setLoadingBosses(true);
    try {
      const resp = await getAllBossesForLegajo(file);
      const list: any[] = resp?.bosses ? Object.values(resp.bosses) : (Array.isArray(resp) ? resp : []);
      setBosses(list);
      setCuilBoss(list.length ? list[0].cuil : "");
    } catch {
      showToast("error", "No se pudieron cargar los jefes");
      setBosses([]);
    } finally {
      setLoadingBosses(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (arrivalHour && new Date(departureHour).getTime() > new Date(arrivalHour).getTime()) {
      showToast("info", "La salida no puede ser superior a la llegada.");
      return;
    }
    setTouched(true);
    if (disabled || !type || !departureHour || !cuilBoss) return;
    setLoading(true);
    try {
      await createExitOrderAdmin({
        type,
        departure_hour: departureHour,
        ...(arrivalHour ? { arrival_hour: arrivalHour } : {}),
        file: fileOfUserSelected,
        cuilBoss,
      });
      showToast("success", "Solicitud de salida generada");
      setType(""); setDepartureHour(""); setArrivalHour("");
      setCuilBoss(bosses.length ? bosses[0].cuil : "");
      onCreated();
    } catch (err: any) {
      showToast("error", "No se pudo crear la orden", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="col-12">
      <h3>Creación de órdenes de salida</h3>
      <form className="animated fadeIn" onSubmit={submit} noValidate>
        <div className="row">
          <div className="col-12">
            <div className="form-group">
              <label><small>TIPO DE SALIDA</small></label>
              <select className="form-control form-control-sm custom-select" disabled={disabled} value={type} onChange={(e) => setType(e.target.value)}>
                <option value=""></option>
                {EXIT_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {touched && !type && <small className="text-danger d-block animated fadeIn">* Campo obligatorio</small>}
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="form-group">
              <label><small>DÍA Y HORA DE SALIDA</small></label>
              <input className="form-control form-control-sm" type="datetime-local" disabled={disabled} value={departureHour} onChange={(e) => setDepartureHour(e.target.value)} />
              {touched && !departureHour && <small className="text-danger d-block animated fadeIn">* Campo obligatorio</small>}
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="form-group">
              <label><small>DÍA Y HORA DE LLEGADA <small className="text-muted">*Opcional</small></small></label>
              <input className="form-control form-control-sm" type="datetime-local" disabled={disabled} value={arrivalHour} onChange={(e) => setArrivalHour(e.target.value)} />
            </div>
          </div>

          {loadingBosses && (
            <div className="animated col-6 fadeIn mb-3">
              <p><i className="pi pi-spin pi-spinner" /> Cargando jefes</p>
            </div>
          )}

          {!loadingBosses && (
            <div className="animated col-12 col-md-6 col-lg-3 fadeIn">
              <div className="form-group">
                <label><small>JEFE</small></label>
                <select className="form-control form-control-sm custom-select" disabled={disabled} value={cuilBoss} onChange={(e) => setCuilBoss(e.target.value)}>
                  {bosses.map((b) => <option key={b.cuil} value={b.cuil}>{b.lastname_name}</option>)}
                </select>
                {touched && !cuilBoss && <small className="text-danger d-block animated fadeIn">* Campo obligatorio</small>}
              </div>
            </div>
          )}

          <div className="col-12 col-md-6 col-lg-3 text-right">
            <button
              type="submit"
              disabled={disabled || loading}
              style={{ marginTop: "32.5px" }}
              className={`btn btn-sm w-100 ${!disabled && !loading ? "btn-info" : "btn-secondary"}`}
            >
              {loading ? "GENERANDO SALIDA" : "GENERAR SALIDA"}
            </button>
          </div>
        </div>
      </form>
      <div className="col-12 my-1 px-0"><hr /></div>
    </div>
  );
}

// ── Modificación de fichada ──────────────────────────────────────────────────
function UpdateRecordDialog({ record, onHide, onUpdated, showToast }: { record: any; onHide: () => void; onUpdated: (record: any) => void; showToast: ToastFn }) {
  const [datetime, setDatetime] = useState("");
  const [type, setType] = useState("1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      const time = (record.hora_llegada ?? "").length > 2 ? record.hora_llegada : record.hora_salida;
      setDatetime(toDatetimeLocal(record.date, time));
      setType(String(record.type_id ?? "1"));
    }
  }, [record]);

  async function submit() {
    if (!datetime || loading) return;
    setLoading(true);
    try {
      const formatted = formatDatetimePayload(datetime);
      const [date, hours] = formatted.split(" ");
      await updateRecord({ id: record.id, type_exit_order_id: type, date, hours });
      showToast("success", "Fichada modificada");
      const tempRecord: any = {};
      if ((record.hora_llegada ?? "").length > 2) tempRecord.hora_llegada = hours;
      else tempRecord.hora_salida = hours;
      onUpdated({ ...record, date, ...tempRecord });
    } catch (err: any) {
      showToast("info", "No se pudo modificar la fichada", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog header="Modificación de fichada" visible={!!record} modal draggable={false} resizable={false} closable={false} style={{ width: "50vw" }} onHide={onHide}
      footer={
        <div>
          <button disabled={loading} onClick={submit} type="button" className="btn btn-primary">{!loading ? "Modificar" : "Modificando"}</button>
          <button disabled={loading} onClick={onHide} type="button" className="btn btn-link text-muted">Cerrar</button>
        </div>
      }
    >
      <div className="row">
        <div className="col-12 col-md-6">
          <label htmlFor="update-datetime"><small>FECHA Y HORA</small></label>
          <input className="form-control form-control-sm" type="datetime-local" id="update-datetime" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
          {!datetime && <small className="text-danger d-block animated fadeIn">* Campo obligatorio</small>}
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="update-type"><small>TIPO DE FICHADA</small></label>
          <select className="form-control form-control-sm custom-select" id="update-type" value={type} onChange={(e) => setType(e.target.value)}>
            {UPDATE_RECORD_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      {loading && <ProgressBar mode="indeterminate" style={{ height: "3px" }} className="mt-3" />}
    </Dialog>
  );
}

// ── Eliminar fichada ─────────────────────────────────────────────────────────
function DeleteRecordDialog({ record, onHide, onDeleted, showToast }: { record: any; onHide: () => void; onDeleted: (id: any) => void; showToast: ToastFn }) {
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setLoading(true);
    try {
      await deleteRecord(record.id);
      showToast("success", "Fichada eliminada");
      onDeleted(record.id);
    } catch {
      showToast("error", "No se pudo eliminar la fichada", "Intentelo más tarde");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog header="¿Eliminar fichada?" visible={!!record} modal draggable={false} resizable={false} closable={false} style={{ width: "50vw" }} onHide={onHide}
      footer={
        <div>
          <button disabled={loading} onClick={submit} type="button" className="btn btn-danger">{!loading ? "Eliminar" : "Eliminando"}</button>
          <button disabled={loading} onClick={onHide} type="button" className="btn btn-link text-muted">Cerrar</button>
        </div>
      }
    >
      {loading && <ProgressBar mode="indeterminate" style={{ height: "3px" }} />}
    </Dialog>
  );
}

// ── Modificar salida ─────────────────────────────────────────────────────────
function UpdateExitOrderDialog({ exitOrder, onHide, onUpdated, showToast }: { exitOrder: any; onHide: () => void; onUpdated: (exitOrder: any) => void; showToast: ToastFn }) {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [departureHour, setDepartureHour] = useState("");
  const [arrivalHour, setArrivalHour] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exitOrder) {
      setDepartureHour(toDatetimeLocal(exitOrder.date, exitOrder.hora_salida));
      setArrivalHour(exitOrder.hora_llegada ? toDatetimeLocal(exitOrder.date, exitOrder.hora_llegada) : "");
      setStatus(exitOrder.statusEnglish ?? "");
      setType(String(exitOrder.type_id ?? ""));
    }
  }, [exitOrder]);

  async function submit() {
    if (loading) return;
    if (exitOrder.hora_llegada && arrivalHour && new Date(departureHour).getTime() >= new Date(arrivalHour).getTime()) {
      showToast("info", "La hora de llegada no puede ser anterior a la hora de salida");
      return;
    }
    if (!status || !type || !departureHour) return;
    setLoading(true);
    try {
      const data: any = {
        departure_hour: departureHour.replace("T", " "),
        status,
        type,
      };
      if (arrivalHour) data.arrival_hour = arrivalHour.replace("T", " ");
      await updateExitOrderAdmin([], data, String(exitOrder.id));
      showToast("success", "Salida modificada");

      const updated: any = { ...exitOrder, date: departureHour.split("T")[0] };
      if (data.arrival_hour) updated.hora_llegada = `${data.arrival_hour.split(" ")[1]}:00`;
      updated.hora_salida = `${data.departure_hour.split(" ")[1]}:00`;
      updated.type_id = type;
      updated.type = EXIT_TYPE_LABELS[type] ?? type;

      const statusInfo = FILTER_STATUS_OPTIONS.find((s) => s.value === status);
      const classMap: Record<string, string> = { Waiting: "warning", Cancel: "danger", Done: "success", Pending: "muted" };
      updated.class = classMap[status] ?? "";
      updated.statusEnglish = status;
      updated.status = statusInfo?.label ?? status;

      onUpdated(updated);
    } catch (err: any) {
      showToast("error", "No se pudo modificar la salida", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog header="Modificar salida" visible={!!exitOrder} modal draggable={false} resizable={false} closable={false} style={{ width: "60vw" }} onHide={onHide}
      footer={
        <div>
          <button disabled={loading || !status || !type} onClick={submit} type="button" className="btn btn-primary">{!loading ? "Modificar" : "Modificando"}</button>
          <button disabled={loading} onClick={onHide} type="button" className="btn btn-link text-muted">Cerrar</button>
        </div>
      }
    >
      <div className="row">
        <div className="col-12">
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Estado</label>
                <select className="form-control form-control-sm custom-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value=""></option>
                  {FILTER_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {!status && <small className="text-danger d-block animated fadeIn">* Campo obligatorio</small>}
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="form-group">
                <label>Tipo de salida</label>
                <select className="form-control form-control-sm custom-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value=""></option>
                  {EXIT_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {!type && <small className="text-danger d-block animated fadeIn">* Campo obligatorio</small>}
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading && <ProgressBar mode="indeterminate" style={{ height: "3px" }} className="mt-2" />}
    </Dialog>
  );
}

// ── Eliminar órden de salida ─────────────────────────────────────────────────
function DeleteExitOrderDialog({ exitOrder, onHide, onDeleted, showToast }: { exitOrder: any; onHide: () => void; onDeleted: (id: any) => void; showToast: ToastFn }) {
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setLoading(true);
    try {
      await deleteExitOrderAdmin(exitOrder.id);
      showToast("success", "Órden de salida eliminada");
      onDeleted(exitOrder.id);
    } catch {
      showToast("error", "No se pudo eliminar la órden de salida");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog header="¿Eliminar órden de salida?" visible={!!exitOrder} modal draggable={false} resizable={false} closable={false} style={{ width: "65vw" }} onHide={onHide}
      footer={
        <div>
          <button disabled={loading} onClick={submit} type="button" className="btn btn-danger">{!loading ? "Eliminar" : "Eliminando"}</button>
          <button disabled={loading} onClick={onHide} type="button" className="btn btn-link text-muted">No</button>
        </div>
      }
    >
      {loading && <ProgressBar mode="indeterminate" style={{ height: "3px" }} />}
    </Dialog>
  );
}

// ── Listado ───────────────────────────────────────────────────────────────────
function ListSection({
  fileOfUserSelected, filters, isLoadingRecordeds, recordeds, totalRecordeds,
  onFilterChange, onPageChange, onSetRecordeds, showToast,
}: {
  fileOfUserSelected: string;
  filters: any;
  isLoadingRecordeds: boolean;
  recordeds: any[] | null;
  totalRecordeds: number;
  onFilterChange: (typeFilter: string, value: string) => void;
  onPageChange: (event: any) => void;
  onSetRecordeds: (records: any[]) => void;
  showToast: ToastFn;
}) {
  const isShowTypesOfExits = !!filters.status;

  const [recordToUpdate, setRecordToUpdate] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const [exitOrderToUpdate, setExitOrderToUpdate] = useState<any>(null);
  const [exitOrderToDelete, setExitOrderToDelete] = useState<any>(null);

  function replaceRecord(updated: any) {
    onSetRecordeds((recordeds ?? []).map((r) => (r.id === updated.id ? updated : r)));
  }

  function removeRecord(id: any) {
    onSetRecordeds((recordeds ?? []).filter((r) => r.id !== id));
  }

  return (
    <div className="col-12 m-0 p-0">
      <h3>{isLoadingRecordeds ? "Cargando listado de ingresos, egresos y salidas" : "Listado de ingresos, egresos y salidas"}</h3>

      <div className="table-responsive">
        <table className="table table-sm table-striped table-hover">
          <thead>
            <tr>
              <th style={{ width: 150 }}>DÍA</th>
              <th style={{ width: 100 }}>SALIDA</th>
              <th style={{ width: 100 }}>LLEGADA</th>
              <th style={{ width: 175 }}>ESTADO</th>
              <th style={{ textAlign: "left" }}>TIPO</th>
              <th>RELOJ</th>
              <th style={{ width: 100 }}>ACCIONES</th>
            </tr>
            <tr>
              <td className="p-2">
                <input type="date" className="form-control form-control-sm" disabled={!fileOfUserSelected}
                  onChange={(e) => onFilterChange("date", e.target.value)} />
              </td>
              <td></td>
              <td></td>
              <td>
                <select className="form-control form-control-sm" disabled={!fileOfUserSelected}
                  value={filters.status} onChange={(e) => onFilterChange("status", e.target.value)}>
                  <option value=""></option>
                  {FILTER_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </td>
              <td className="p-2">
                <select className="form-control form-control-sm" disabled={!fileOfUserSelected}
                  value={filters.type} onChange={(e) => onFilterChange("type", e.target.value)}>
                  <option value=""></option>
                  {!isShowTypesOfExits && UPDATE_RECORD_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  {isShowTypesOfExits && EXIT_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </td>
              <td></td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {(recordeds ?? []).map((record: any) => (
              <tr key={record.id} className="fadeIn animated">
                <td><small>{formatDateDMY(record.date)}</small></td>
                <td>
                  <small>
                    {record.table_name === "timestamp" ? record.hora_salida : (record.hora_salida ? record.hora_salida : "-")}
                  </small>
                </td>
                <td>
                  <small>
                    {record.table_name === "timestamp" ? (record.hora_llegada ? record.hora_llegada : "-") : record.hora_llegada}
                  </small>
                </td>
                <td>
                  <span className={`pointer p-1 status-${record.class}`}><small>{record.status}</small></span>
                </td>
                <td style={{ textAlign: "left" }}><small>{record.type}</small></td>
                <td><small>{hostLabel(record.host)}</small></td>
                <td className="text-nowrap">
                  {record.canUpdateRecord && (
                    <i className="fa-regular fa-pen-to-square mx-1 pointer text-info" title="Modificar" onClick={() => setRecordToUpdate(record)} />
                  )}
                  {record.canDeleteRecord && (
                    <i className="fa-regular fa-circle-xmark pointer text-danger" title="Eliminar" onClick={() => setRecordToDelete(record)} />
                  )}
                  {record.canUpdateExitOrder && (
                    <i className="fa-regular fa-pen-to-square mx-1 pointer text-info" title="Modificar" onClick={() => setExitOrderToUpdate(record)} />
                  )}
                  {record.canDeleteExitOrder && (
                    <i className="fa-regular fa-circle-xmark pointer text-danger" title="Eliminar" onClick={() => setExitOrderToDelete(record)} />
                  )}
                </td>
              </tr>
            ))}
            {!isLoadingRecordeds && (recordeds ?? []).length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted">
                {fileOfUserSelected ? "Sin resultados." : "Busque un agente para ver sus fichadas."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginator
        rows={filters.limit}
        first={(filters.page - 1) * filters.limit}
        totalRecords={totalRecordeds}
        rowsPerPageOptions={[10, 15, 20]}
        onPageChange={onPageChange}
      />

      <UpdateRecordDialog record={recordToUpdate} onHide={() => setRecordToUpdate(null)} showToast={showToast}
        onUpdated={(updated) => { replaceRecord(updated); setRecordToUpdate(null); }} />

      <DeleteRecordDialog record={recordToDelete} onHide={() => setRecordToDelete(null)} showToast={showToast}
        onDeleted={(id) => { removeRecord(id); setRecordToDelete(null); }} />

      <UpdateExitOrderDialog exitOrder={exitOrderToUpdate} onHide={() => setExitOrderToUpdate(null)} showToast={showToast}
        onUpdated={(updated) => { replaceRecord(updated); setExitOrderToUpdate(null); }} />

      <DeleteExitOrderDialog exitOrder={exitOrderToDelete} onHide={() => setExitOrderToDelete(null)} showToast={showToast}
        onDeleted={(id) => { removeRecord(id); setExitOrderToDelete(null); }} />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function RecordedPage() {
  const toast = useRef<Toast>(null);
  const showToast: ToastFn = (severity, summary, detail) => toast.current?.show({ severity, summary, detail });

  const filtersRef = useRef({ date: "", file: "", limit: 10, page: 1, type: "", status: "" });
  const [filters, setFiltersState] = useState(filtersRef.current);

  const [fileOfUserSelected, setFileOfUserSelected] = useState("");
  const [isLoadingRecordeds, setIsLoadingRecordeds] = useState(false);
  const [recordeds, setRecordeds] = useState<any[] | null>(null);
  const [totalRecordeds, setTotalRecordeds] = useState(0);

  async function loadRecordeds(filtersToUse = filtersRef.current) {
    setIsLoadingRecordeds(true);
    try {
      const resp = await getRecordedData(filtersToUse);
      setRecordeds(resp.data ?? []);
      setTotalRecordeds(resp.total ?? 0);
    } catch {
      setRecordeds(null);
      showToast("info", "No se pudieron cargar las fichadas");
    } finally {
      setIsLoadingRecordeds(false);
    }
  }

  function applyFilters(patch: Record<string, any>) {
    const next = { ...filtersRef.current, ...patch };
    filtersRef.current = next;
    setFiltersState(next);
    loadRecordeds(next);
  }

  function handleFilterChange(typeFilter: string, value: string) {
    if (typeFilter === "status") {
      applyFilters({ page: 1, status: value, type: "" });
      return;
    }
    applyFilters({ page: 1, [typeFilter]: value });
  }

  function handlePageChange(event: any) {
    applyFilters({ page: event.page + 1, limit: event.rows });
  }

  function handleUserSelected(file: string) {
    if (!file) return;
    setFileOfUserSelected(file);
    applyFilters({ file });
  }

  function handleCreated() {
    loadRecordeds();
  }

  return (
    <>
      <AppToast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Editar fichadas</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Editar fichadas</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card card-body">
              <div className="col-12" style={{ zIndex: 999999 }}>
                <SearchUserSection onSelect={handleUserSelected} />
              </div>

              <div className="col-12">
                <CreateSignSection fileOfUserSelected={fileOfUserSelected} onCreated={handleCreated} showToast={showToast} />
              </div>

              <div className="col-12">
                <CreateExitOrderSection fileOfUserSelected={fileOfUserSelected} onCreated={handleCreated} showToast={showToast} />
              </div>

              <div className="col-12">
                <ListSection
                  fileOfUserSelected={fileOfUserSelected}
                  filters={filters}
                  isLoadingRecordeds={isLoadingRecordeds}
                  recordeds={recordeds}
                  totalRecordeds={totalRecordeds}
                  onFilterChange={handleFilterChange}
                  onPageChange={handlePageChange}
                  onSetRecordeds={setRecordeds}
                  showToast={showToast}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
