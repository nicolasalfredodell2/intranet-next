"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import AppToast from "@/components/common/AppToast";
import { ProgressBar } from "primereact/progressbar";
import { Paginator } from "primereact/paginator";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { getInternals } from "@/lib/services/internal.service";
import { getAllBossesForLegajo } from "@/lib/services/boss.service";
import { createExitOrderAdmin, updateExitOrderAdmin, deleteExitOrderAdmin } from "@/lib/services/exits.service";
import { getRecordedData, createRecord, updateRecord, deleteRecord } from "@/lib/services/recorded.service";

addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Limpiar",
});

addLocale("es-recorded-create", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Quitar fechas",
});

addLocale("es-recorded-filter-date", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  now: "Ahora",
  clear: "Quitar fecha",
});

const ICON_BTN_STYLE = { background: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center" } as const;

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

const EXIT_TYPE_LABELS: Record<string, string> = {
  Officials: "Oficial",
  Education: "Licencia por estudio/capacitación",
  Individuals: "Particular",
  Unexpected: "Sin orden de salida",
  Health: "Salud o cuidado familiar",
  Maternity_Breastfeeding: "Lactancia - Maternidad",
  Guild_Meeting_Attendance: "Asamblea",
  Others_Justify: "Otras justificaciones",
};

const FILTER_STATUS_OPTIONS = [
  { value: "Pending", label: "Pendiente de aprobación" },
  { value: "Waiting", label: "En espera" },
  { value: "Done", label: "Finalizado" },
  { value: "Cancel", label: "Cancelado" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  warning: { bg: "rgba(255,193,7,0.12)", color: "#b45309" },
  danger: { bg: "rgba(220,53,69,0.10)", color: "#dc3545" },
  success: { bg: "rgba(5,150,105,0.10)", color: "#059669" },
  muted: { bg: "rgba(100,116,139,0.10)", color: "#64748b" },
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateTimeInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

export default function RecordedPage() {
  const toast = useRef<Toast>(null);

  // Búsqueda de agente
  const [agentOptions, setAgentOptions] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const agentSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fileOfUserSelected, setFileOfUserSelected] = useState("");

  // Alta de fichada
  const [createDatetime, setCreateDatetime] = useState("");
  const [createType, setCreateType] = useState("");
  const [createTouched, setCreateTouched] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Alta de orden de salida
  const [exitType, setExitType] = useState("");
  const [exitDeparture, setExitDeparture] = useState("");
  const [exitArrival, setExitArrival] = useState("");
  const [exitCuilBoss, setExitCuilBoss] = useState("");
  const [exitBosses, setExitBosses] = useState<any[]>([]);
  const [exitLoadingBosses, setExitLoadingBosses] = useState(false);
  const [exitTouched, setExitTouched] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);

  // Listado
  const filtersRef = useRef({ date: "", file: "", limit: 10, page: 1, type: "", status: "" });
  const [filters, setFiltersState] = useState(filtersRef.current);
  const [isLoadingRecordeds, setIsLoadingRecordeds] = useState(false);
  const [recordeds, setRecordeds] = useState<any[] | null>(null);
  const [totalRecordeds, setTotalRecordeds] = useState(0);
  const isShowTypesOfExits = !!filters.status;

  // Modificar / eliminar fichada
  const [recordToUpdate, setRecordToUpdate] = useState<any>(null);
  const [updateRecordDatetime, setUpdateRecordDatetime] = useState("");
  const [updateRecordType, setUpdateRecordType] = useState("1");
  const [updateRecordLoading, setUpdateRecordLoading] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const [deleteRecordLoading, setDeleteRecordLoading] = useState(false);

  // Modificar / eliminar orden de salida
  const [exitOrderToUpdate, setExitOrderToUpdate] = useState<any>(null);
  const [updateExitStatus, setUpdateExitStatus] = useState("");
  const [updateExitType, setUpdateExitType] = useState("");
  const [updateExitDeparture, setUpdateExitDeparture] = useState("");
  const [updateExitArrival, setUpdateExitArrival] = useState("");
  const [updateExitLoading, setUpdateExitLoading] = useState(false);
  const [exitOrderToDelete, setExitOrderToDelete] = useState<any>(null);
  const [deleteExitLoading, setDeleteExitLoading] = useState(false);

  function showToast(severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) {
    toast.current?.show({ severity, summary, detail });
  }

  // ── Búsqueda de agente ──────────────────────────────────────────────────────
  async function searchUsers(query: string) {
    setLoadingAgents(true);
    try {
      const resp = await getInternals(query, { puch_in: true });
      setAgentOptions((resp ?? []).map((u: any) => ({ ...u, name: `${u.file} - ${u.lastname_name}` })));
    } catch {
      setAgentOptions([]);
    } finally {
      setLoadingAgents(false);
    }
  }

  function handleAgentFilter(e: { filter: string }) {
    if (agentSearchDebounceRef.current) clearTimeout(agentSearchDebounceRef.current);
    if (!e.filter) { setAgentOptions([]); return; }
    agentSearchDebounceRef.current = setTimeout(() => searchUsers(e.filter), 400);
  }

  function handleUserChange(e: any) {
    const file = e.value ?? "";
    setFileOfUserSelected(file);
    if (file) {
      applyFilters({ file });
    }
  }

  // ── Alta de fichada ──────────────────────────────────────────────────────────
  function limpiarCreateRecord() {
    setCreateDatetime(""); setCreateType(""); setCreateTouched(false);
  }

  useEffect(() => {
    if (!fileOfUserSelected) limpiarCreateRecord();
  }, [fileOfUserSelected]);

  async function submitCreateRecord(e: React.FormEvent) {
    e.preventDefault();
    setCreateTouched(true);
    if (!fileOfUserSelected || !createDatetime || !createType) return;
    setCreateLoading(true);
    try {
      await createRecord({ datetime: formatDatetimePayload(createDatetime), file: fileOfUserSelected, type_exit_order_id: createType });
      showToast("success", "Fichada creada");
      limpiarCreateRecord();
      loadRecordeds();
    } catch (err: any) {
      showToast("info", "No se pudo crear la fichada", err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Alta de orden de salida ───────────────────────────────────────────────────
  useEffect(() => {
    if (fileOfUserSelected) {
      chargeBosses(fileOfUserSelected);
    } else {
      setExitType(""); setExitDeparture(""); setExitArrival(""); setExitCuilBoss(""); setExitBosses([]); setExitTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileOfUserSelected]);

  async function chargeBosses(file: string) {
    setExitLoadingBosses(true);
    try {
      const resp = await getAllBossesForLegajo(file);
      const list: any[] = resp?.bosses ? Object.values(resp.bosses) : (Array.isArray(resp) ? resp : []);
      setExitBosses(list);
    } catch {
      showToast("error", "No se pudieron cargar los jefes");
      setExitBosses([]);
    } finally {
      setExitLoadingBosses(false);
    }
  }

  function limpiarCreateExitOrder() {
    setExitType(""); setExitDeparture(""); setExitArrival(""); setExitCuilBoss(""); setExitTouched(false);
  }

  async function submitCreateExitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (exitArrival && new Date(exitDeparture).getTime() > new Date(exitArrival).getTime()) {
      showToast("info", "La salida no puede ser superior a la llegada.");
      return;
    }
    setExitTouched(true);
    if (!fileOfUserSelected || !exitType || !exitDeparture || !exitCuilBoss) return;
    setExitLoading(true);
    try {
      await createExitOrderAdmin({
        type: exitType,
        departure_hour: exitDeparture,
        ...(exitArrival ? { arrival_hour: exitArrival } : {}),
        file: fileOfUserSelected,
        cuilBoss: exitCuilBoss,
      });
      showToast("success", "Solicitud de salida generada");
      limpiarCreateExitOrder();
      loadRecordeds();
    } catch (err: any) {
      showToast("error", "No se pudo crear la orden", err.message);
    } finally {
      setExitLoading(false);
    }
  }

  // ── Listado ────────────────────────────────────────────────────────────────
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

  function clearListFilters() {
    applyFilters({ page: 1, date: "", status: "", type: "" });
  }

  // ── Modificar / eliminar fichada ──────────────────────────────────────────────
  useEffect(() => {
    if (recordToUpdate) {
      const time = (recordToUpdate.hora_llegada ?? "").length > 2 ? recordToUpdate.hora_llegada : recordToUpdate.hora_salida;
      setUpdateRecordDatetime(toDatetimeLocal(recordToUpdate.date, time));
      setUpdateRecordType(String(recordToUpdate.type_id ?? "1"));
    }
  }, [recordToUpdate]);

  async function submitUpdateRecord() {
    if (!updateRecordDatetime || updateRecordLoading) return;
    setUpdateRecordLoading(true);
    try {
      const formatted = formatDatetimePayload(updateRecordDatetime);
      const [date, hours] = formatted.split(" ");
      await updateRecord({ id: recordToUpdate.id, type_exit_order_id: updateRecordType, date, hours });
      showToast("success", "Fichada modificada");
      const tempRecord: any = {};
      if ((recordToUpdate.hora_llegada ?? "").length > 2) tempRecord.hora_llegada = hours;
      else tempRecord.hora_salida = hours;
      const updated = { ...recordToUpdate, date, ...tempRecord };
      setRecordeds((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
      setRecordToUpdate(null);
    } catch (err: any) {
      showToast("info", "No se pudo modificar la fichada", err.message);
    } finally {
      setUpdateRecordLoading(false);
    }
  }

  async function submitDeleteRecord() {
    if (deleteRecordLoading) return;
    setDeleteRecordLoading(true);
    try {
      await deleteRecord(recordToDelete.id);
      showToast("success", "Fichada eliminada");
      setRecordeds((prev) => (prev ?? []).filter((r) => r.id !== recordToDelete.id));
      setRecordToDelete(null);
    } catch {
      showToast("error", "No se pudo eliminar la fichada", "Intentelo más tarde");
    } finally {
      setDeleteRecordLoading(false);
    }
  }

  // ── Modificar / eliminar orden de salida ──────────────────────────────────────
  useEffect(() => {
    if (exitOrderToUpdate) {
      setUpdateExitDeparture(toDatetimeLocal(exitOrderToUpdate.date, exitOrderToUpdate.hora_salida));
      setUpdateExitArrival(exitOrderToUpdate.hora_llegada ? toDatetimeLocal(exitOrderToUpdate.date, exitOrderToUpdate.hora_llegada) : "");
      setUpdateExitStatus(exitOrderToUpdate.statusEnglish ?? "");
      setUpdateExitType(String(exitOrderToUpdate.type_id ?? ""));
    }
  }, [exitOrderToUpdate]);

  async function submitUpdateExitOrder() {
    if (updateExitLoading) return;
    if (exitOrderToUpdate.hora_llegada && updateExitArrival && new Date(updateExitDeparture).getTime() >= new Date(updateExitArrival).getTime()) {
      showToast("info", "La hora de llegada no puede ser anterior a la hora de salida");
      return;
    }
    if (!updateExitStatus || !updateExitType || !updateExitDeparture) return;
    setUpdateExitLoading(true);
    try {
      const data: any = { departure_hour: updateExitDeparture.replace("T", " "), status: updateExitStatus, type: updateExitType };
      if (updateExitArrival) data.arrival_hour = updateExitArrival.replace("T", " ");
      await updateExitOrderAdmin([], data, String(exitOrderToUpdate.id));
      showToast("success", "Salida modificada");

      const updated: any = { ...exitOrderToUpdate, date: updateExitDeparture.split("T")[0] };
      if (data.arrival_hour) updated.hora_llegada = `${data.arrival_hour.split(" ")[1]}:00`;
      updated.hora_salida = `${data.departure_hour.split(" ")[1]}:00`;
      updated.type_id = updateExitType;
      updated.type = EXIT_TYPE_LABELS[updateExitType] ?? updateExitType;
      const statusInfo = FILTER_STATUS_OPTIONS.find((s) => s.value === updateExitStatus);
      const classMap: Record<string, string> = { Waiting: "warning", Cancel: "danger", Done: "success", Pending: "muted" };
      updated.class = classMap[updateExitStatus] ?? "";
      updated.statusEnglish = updateExitStatus;
      updated.status = statusInfo?.label ?? updateExitStatus;

      setRecordeds((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
      setExitOrderToUpdate(null);
    } catch (err: any) {
      showToast("error", "No se pudo modificar la salida", err.message);
    } finally {
      setUpdateExitLoading(false);
    }
  }

  async function submitDeleteExitOrder() {
    if (deleteExitLoading) return;
    setDeleteExitLoading(true);
    try {
      await deleteExitOrderAdmin(exitOrderToDelete.id);
      showToast("success", "Órden de salida eliminada");
      setRecordeds((prev) => (prev ?? []).filter((r) => r.id !== exitOrderToDelete.id));
      setExitOrderToDelete(null);
    } catch {
      showToast("error", "No se pudo eliminar la órden de salida");
    } finally {
      setDeleteExitLoading(false);
    }
  }

  const updateRecordDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificación de fichada</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Editá la fecha, hora y tipo de la fichada</small>
      </div>
    </div>
  );

  const deleteRecordDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar fichada</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  const updateExitDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar salida</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Editá el estado, tipo y horarios de la orden</small>
      </div>
    </div>
  );

  const deleteExitDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar órden de salida</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
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
              <i className="pi pi-clock" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Editar fichadas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de fichadas y órdenes de salida de agentes</small>
            </div>
          </div>
        </div>

        {/* Buscar agente */}
        <div className="card profile-card mt-4">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-search" style={{ color: "#3b82f6", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Buscar agente</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Seleccioná un agente para gestionar sus fichadas</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <div className={`license-filter-input-wrap${fileOfUserSelected ? " license-filter-input-wrap--active" : ""}`} style={{ maxWidth: 420 }}>
              <i className="pi pi-user license-filter-icon" />
              <Dropdown
                value={fileOfUserSelected || null}
                options={agentOptions}
                optionLabel="name"
                optionValue="file"
                onChange={handleUserChange}
                onFilter={handleAgentFilter}
                filter
                filterInputAutoFocus
                filterPlaceholder="Busque por apellido o legajo"
                showClear
                placeholder="Seleccioná un agente"
                emptyFilterMessage={loadingAgents ? "Buscando..." : "No se encontraron usuarios con ese legajo, nombre o apellido"}
                emptyMessage="Escribí para buscar un agente"
                className="license-filter-dropdown w-100"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
        </div>

        {/* Nueva fichada */}
        {fileOfUserSelected && (
        <div className="card profile-card mt-4 fadeIn animated">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-sign-in" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Creación de fichadas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Generá una fichada manual para el agente seleccionado</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={submitCreateRecord} noValidate>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Fecha y hora *</label>
                  <div className={`license-filter-input-wrap profile-birthdate-wrap${createDatetime ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-calendar license-filter-icon" />
                    <Calendar
                      value={createDatetime ? new Date(createDatetime) : null}
                      onChange={(e) => setCreateDatetime(e.value ? toDateTimeInputValue(e.value as Date) : "")}
                      showTime
                      hourFormat="24"
                      dateFormat="dd/mm/yy"
                      locale="es-recorded-create"
                      showButtonBar
                      showOtherMonths={false}
                      maxDate={new Date()}
                      placeholder="Seleccioná fecha y hora"
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel license-filter-calendar-panel compact-time-panel recorded-datetime-panel"
                    />
                  </div>
                  {createTouched && !createDatetime && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>

                <div className="col-12 col-md-6 mb-3">
                  <label className="profile-field-label">Tipo de fichada *</label>
                  <div className={`license-filter-input-wrap${createType ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-tag license-filter-icon" />
                    <Dropdown
                      value={createType || null}
                      options={CREATE_RECORD_TYPE_OPTIONS}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => setCreateType(e.value ?? "")}
                      placeholder="Seleccioná un tipo"
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel"
                    />
                  </div>
                  {createTouched && !createType && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>
              </div>

              <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                <button
                  disabled={createLoading}
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  <i className={createLoading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                  {createLoading ? "Creando..." : "Crear"}
                </button>
                <button
                  type="button"
                  disabled={createLoading}
                  onClick={limpiarCreateRecord}
                  className="btn btn-light text-muted ml-auto"
                  style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {/* Nueva orden de salida */}
        {fileOfUserSelected && (
        <div className="card profile-card mt-4 fadeIn animated">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-sign-out" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Creación de órdenes de salida</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Generá una órden de salida para el agente seleccionado</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />
          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <form className="animated fadeIn" onSubmit={submitCreateExitOrder} noValidate>
              <div className="row">
                <div className="col-12 col-md-6 col-lg-3 mb-3">
                  <label className="profile-field-label">Tipo de salida *</label>
                  <div className={`license-filter-input-wrap${exitType ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-tag license-filter-icon" />
                    <Dropdown
                      value={exitType || null}
                      options={EXIT_TYPE_OPTIONS}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => setExitType(e.value ?? "")}
                      placeholder="Seleccioná un tipo"
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel"
                    />
                  </div>
                  {exitTouched && !exitType && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>

                <div className="col-12 col-md-6 col-lg-3 mb-3">
                  <label className="profile-field-label">Día y hora de salida *</label>
                  <div className={`license-filter-input-wrap profile-birthdate-wrap${exitDeparture ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-calendar license-filter-icon" />
                    <Calendar
                      value={exitDeparture ? new Date(exitDeparture) : null}
                      onChange={(e) => {
                        const value = e.value ? toDateTimeInputValue(e.value as Date) : "";
                        setExitDeparture(value);
                        if (!value || (exitArrival && exitArrival < value)) setExitArrival("");
                      }}
                      showTime
                      hourFormat="24"
                      dateFormat="dd/mm/yy"
                      locale="es-recorded-create"
                      showButtonBar
                      showOtherMonths={false}
                      maxDate={new Date()}
                      placeholder="Seleccioná fecha y hora"
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                    />
                  </div>
                  {exitTouched && !exitDeparture && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                </div>

                <div className="col-12 col-md-6 col-lg-3 mb-3">
                  <label className="profile-field-label">Día y hora de llegada <small className="text-muted">(opcional)</small></label>
                  <div className={`license-filter-input-wrap profile-birthdate-wrap${exitArrival ? " license-filter-input-wrap--active" : ""}`}>
                    <i className="pi pi-calendar license-filter-icon" />
                    <Calendar
                      value={exitArrival ? new Date(exitArrival) : null}
                      onChange={(e) => setExitArrival(e.value ? toDateTimeInputValue(e.value as Date) : "")}
                      showTime
                      hourFormat="24"
                      dateFormat="dd/mm/yy"
                      locale="es-recorded-create"
                      showButtonBar
                      showOtherMonths={false}
                      disabled={!exitDeparture}
                      minDate={exitDeparture ? new Date(exitDeparture) : undefined}
                      maxDate={new Date()}
                      placeholder="Seleccioná fecha y hora"
                      className="license-filter-dropdown"
                      panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                    />
                  </div>
                </div>

                {exitLoadingBosses && (
                  <div className="col-12 col-lg-3 mb-3 fadeIn animated d-flex align-items-end" style={{ color: "#64748b", fontSize: "0.84rem" }}>
                    <span><i className="pi pi-spin pi-spinner mr-2" />Cargando jefes...</span>
                  </div>
                )}

                {!exitLoadingBosses && (
                  <div className="col-12 col-md-6 col-lg-3 mb-3 fadeIn animated">
                    <label className="profile-field-label">Jefe *</label>
                    <div className={`license-filter-input-wrap${exitCuilBoss ? " license-filter-input-wrap--active" : ""}`}>
                      <i className="pi pi-user license-filter-icon" />
                      <Dropdown
                        value={exitCuilBoss || null}
                        options={exitBosses}
                        optionLabel="lastname_name"
                        optionValue="cuil"
                        onChange={(e) => setExitCuilBoss(e.value ?? "")}
                        placeholder="Seleccioná un jefe"
                        className="license-filter-dropdown"
                        panelClassName="license-filter-dropdown-panel"
                      />
                    </div>
                    {exitTouched && !exitCuilBoss && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
                  </div>
                )}

              </div>

              <div className="d-flex align-items-center mt-2" style={{ gap: "8px" }}>
                <button
                  type="submit"
                  disabled={exitLoading}
                  className="btn btn-primary d-flex align-items-center"
                  style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  <i className={exitLoading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                  {exitLoading ? "Creando..." : "Crear"}
                </button>
                <button
                  type="button"
                  disabled={exitLoading}
                  onClick={limpiarCreateExitOrder}
                  className="btn btn-light text-muted ml-auto"
                  style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {/* Listado */}
        {fileOfUserSelected && (
        <div className="card profile-card license-main-card mt-4 fadeIn animated">
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#e8edff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-list" style={{ color: "#4a6cf7", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Listado de ingresos, egresos y salidas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Fichadas y órdenes de salida del agente seleccionado</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body">
            <div className="license-filter-bar">
              <div className="license-filter-bar-inputs">
                <div className={`license-filter-input-wrap${filters.date ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-calendar license-filter-icon" />
                  <Calendar
                    value={filters.date ? new Date(`${filters.date}T00:00:00`) : null}
                    onChange={(e) => handleFilterChange("date", e.value ? toDateInputValue(e.value as Date) : "")}
                    dateFormat="dd/mm/yy"
                    locale="es-recorded-filter-date"
                    showButtonBar
                    showOtherMonths={false}
                    disabledDays={[0, 6]}
                    maxDate={new Date()}
                    readOnlyInput
                    placeholder="Día"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                  />
                </div>

                <div className={`license-filter-input-wrap${filters.status ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-flag license-filter-icon" />
                  <Dropdown
                    value={filters.status || null}
                    options={FILTER_STATUS_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => handleFilterChange("status", e.value ?? "")}
                    placeholder="Estado"
                    showClear
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>

                <div className={`license-filter-input-wrap${filters.type ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-tag license-filter-icon" />
                  <Dropdown
                    value={filters.type || null}
                    options={isShowTypesOfExits ? EXIT_TYPE_OPTIONS : UPDATE_RECORD_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => handleFilterChange("type", e.value ?? "")}
                    placeholder="Tipo"
                    showClear
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                  />
                </div>
              </div>

              {(filters.date || filters.status || filters.type) && (
                <button type="button" className="license-filter-clear" onClick={clearListFilters}>
                  <i className="pi pi-filter-slash" /> Limpiar filtros
                </button>
              )}
            </div>

            {isLoadingRecordeds && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mt-3" />}

            <div className="mt-3">
              <DataTable
                value={recordeds ?? []}
                className="p-datatable-sm license-table"
                emptyMessage={
                  <div className="license-empty">
                    <i className="pi pi-inbox" />
                    <p>No hay fichadas para mostrar</p>
                  </div>
                }
              >
                <Column header="DÍA" body={(r) => <small>{formatDateDMY(r.date)}</small>} />
                <Column header="SALIDA" body={(r) => <small>{r.table_name === "timestamp" ? r.hora_salida : (r.hora_salida ? r.hora_salida : "-")}</small>} />
                <Column header="LLEGADA" body={(r) => <small>{r.table_name === "timestamp" ? (r.hora_llegada ? r.hora_llegada : "-") : r.hora_llegada}</small>} />
                <Column
                  header="ESTADO"
                  body={(r) => {
                    if (!r.status) return null;
                    const colors = STATUS_COLORS[r.class] ?? { bg: "#f1f5f9", color: "#64748b" };
                    return (
                      <span className="badge rounded-pill" style={{ background: colors.bg, color: colors.color, border: "none", fontWeight: 600, padding: "4px 10px" }}>
                        {r.status}
                      </span>
                    );
                  }}
                />
                <Column header="TIPO" body={(r) => <small>{r.type}</small>} />
                <Column header="RELOJ" body={(r) => <small>{hostLabel(r.host)}</small>} />
                <Column
                  header=""
                  body={(r) => (
                    <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                      {r.canUpdateRecord && (
                        <Tooltip label="Modificar">
                          <button type="button" onClick={() => setRecordToUpdate(r)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
                            <i className="fa-regular fa-pen-to-square" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      )}
                      {r.canDeleteRecord && (
                        <Tooltip label="Eliminar">
                          <button type="button" onClick={() => setRecordToDelete(r)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                            <i className="fa-regular fa-circle-xmark" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      )}
                      {r.canUpdateExitOrder && (
                        <Tooltip label="Modificar">
                          <button type="button" onClick={() => setExitOrderToUpdate(r)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #dbeafe", color: "#3b82f6" }}>
                            <i className="fa-regular fa-pen-to-square" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      )}
                      {r.canDeleteExitOrder && (
                        <Tooltip label="Eliminar">
                          <button type="button" onClick={() => setExitOrderToDelete(r)} style={{ ...ICON_BTN_STYLE, border: "1.5px solid #fecdd3", color: "#dc3545" }}>
                            <i className="fa-regular fa-circle-xmark" style={{ fontSize: "0.85rem" }} />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  )}
                />
              </DataTable>

              <Paginator
                className="mt-2"
                first={(filters.page - 1) * filters.limit}
                rows={filters.limit}
                totalRecords={totalRecordeds}
                rowsPerPageOptions={[10, 15, 20]}
                onPageChange={(e) => applyFilters({ page: e.page + 1, limit: e.rows })}
                pageLinkSize={3}
                rightContent={
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                    {totalRecordeds} {totalRecordeds === 1 ? "registro" : "registros"}
                  </span>
                }
              />
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Modificar fichada */}
      <Dialog
        header={updateRecordDialogHeader}
        visible={!!recordToUpdate}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(520px, 92vw)" }}
        onHide={() => setRecordToUpdate(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={updateRecordLoading}
                onClick={submitUpdateRecord}
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={updateRecordLoading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {updateRecordLoading ? "Modificando..." : "Modificar"}
              </button>
              <button
                disabled={updateRecordLoading}
                onClick={() => setRecordToUpdate(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {updateRecordLoading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <div className="row">
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Fecha y hora *</label>
            <div className={`license-filter-input-wrap profile-birthdate-wrap${updateRecordDatetime ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-calendar license-filter-icon" />
              <Calendar
                value={updateRecordDatetime ? new Date(updateRecordDatetime) : null}
                onChange={(e) => setUpdateRecordDatetime(e.value ? toDateTimeInputValue(e.value as Date) : "")}
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                locale="es"
                showButtonBar
                placeholder="Seleccioná fecha y hora"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
              />
            </div>
            {!updateRecordDatetime && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Tipo de fichada *</label>
            <div className={`license-filter-input-wrap${updateRecordType ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-tag license-filter-icon" />
              <Dropdown
                value={updateRecordType}
                options={UPDATE_RECORD_TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => setUpdateRecordType(e.value)}
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Eliminar fichada */}
      <Dialog
        header={deleteRecordDialogHeader}
        visible={!!recordToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setRecordToDelete(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={deleteRecordLoading}
                onClick={submitDeleteRecord}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={deleteRecordLoading ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {deleteRecordLoading ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={deleteRecordLoading}
                onClick={() => setRecordToDelete(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {deleteRecordLoading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar la fichada. Esta acción no se puede deshacer.
        </p>
      </Dialog>

      {/* Modificar orden de salida */}
      <Dialog
        header={updateExitDialogHeader}
        visible={!!exitOrderToUpdate}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(640px, 92vw)" }}
        onHide={() => setExitOrderToUpdate(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={updateExitLoading || !updateExitStatus || !updateExitType}
                onClick={submitUpdateExitOrder}
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={updateExitLoading ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {updateExitLoading ? "Modificando..." : "Modificar"}
              </button>
              <button
                disabled={updateExitLoading}
                onClick={() => setExitOrderToUpdate(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Volver
              </button>
            </div>
            {updateExitLoading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <div className="row">
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Estado *</label>
            <div className={`license-filter-input-wrap${updateExitStatus ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-flag license-filter-icon" />
              <Dropdown
                value={updateExitStatus || null}
                options={FILTER_STATUS_OPTIONS}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => setUpdateExitStatus(e.value ?? "")}
                placeholder="Seleccioná un estado"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
            {!updateExitStatus && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="profile-field-label">Tipo de salida *</label>
            <div className={`license-filter-input-wrap${updateExitType ? " license-filter-input-wrap--active" : ""}`}>
              <i className="pi pi-tag license-filter-icon" />
              <Dropdown
                value={updateExitType || null}
                options={EXIT_TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => setUpdateExitType(e.value ?? "")}
                placeholder="Seleccioná un tipo"
                className="license-filter-dropdown"
                panelClassName="license-filter-dropdown-panel"
              />
            </div>
            {!updateExitType && <small className="text-danger animated fadeIn" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>}
          </div>
        </div>
      </Dialog>

      {/* Eliminar orden de salida */}
      <Dialog
        header={deleteExitDialogHeader}
        visible={!!exitOrderToDelete}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => setExitOrderToDelete(null)}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={deleteExitLoading}
                onClick={submitDeleteExitOrder}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={deleteExitLoading ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {deleteExitLoading ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={deleteExitLoading}
                onClick={() => setExitOrderToDelete(null)}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                No
              </button>
            </div>
            {deleteExitLoading && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          Está a punto de eliminar la órden de salida. Esta acción no se puede deshacer.
        </p>
      </Dialog>
    </>
  );
}
