"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import { Paginator } from "primereact/paginator";
import { ProgressBar } from "primereact/progressbar";
import { getAllBosses } from "@/lib/services/boss.service";
import { getDataUser } from "@/lib/services/perfil.service";
import {
  loadExitOrders,
  createExitOrderRequest,
  cancelExitOrder,
  loadExitPDF,
  loadExitOrdersAdmin,
  updateExitOrderAdmin,
  deleteExitOrderAdmin,
} from "@/lib/services/exits.service";
import CreateExitAdminModal from "./CreateExitAdminModal";
import ModalBosses from "../profile/ModalBosses";

addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  today: "Hoy",
  clear: "Limpiar",
});

// ── Tooltip ────────────────────────────────────────────────────────────────────
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

// ── Type info tooltip ───────────────────────────────────────────────────────────
function TypeInfoTooltip({
  info,
  children,
}: {
  info: { title: string; icon: string; color: string; bg: string; items: string[] };
  children: React.ReactNode;
}) {
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
        <div
          style={{
            position: "fixed",
            top: pos.top - 10,
            left: pos.left,
            transform: "translateX(-50%) translateY(-100%)",
            width: 280,
            background: "#fff",
            borderRadius: "10px",
            border: `1.5px solid ${info.color}33`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            padding: "12px 14px",
            zIndex: 9999,
            pointerEvents: "none",
            textAlign: "left",
          }}
        >
          <div className="d-flex align-items-center mb-2" style={{ gap: "8px" }}>
            <i className={`pi ${info.icon}`} style={{ color: info.color, fontSize: "0.9rem" }} />
            <span style={{ fontWeight: 700, fontSize: "0.84rem", color: info.color }}>{info.title}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: "16px", listStyle: "none" }}>
            {info.items.map((item, i) => (
              <li key={i} style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "5px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <i className="pi pi-check-circle" style={{ color: info.color, fontSize: "0.68rem", marginTop: "2px", flexShrink: 0 }} />
                {item}
              </li>
            ))}
          </ul>
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: "6px", borderStyle: "solid", borderColor: "#fff transparent transparent transparent", filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.06))" }} />
        </div>
      )}
    </span>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", alignItems: "center" }}>
          <div style={{ width: "15%", height: 26, borderRadius: 20, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ width: "20%", height: 26, borderRadius: 20, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ flex: 1, height: 14, borderRadius: 6, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
          <div style={{ width: 80, height: 30, borderRadius: 8, background: "linear-gradient(90deg, #e8ecf0 25%, #f1f5f9 50%, #e8ecf0 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.4s infinite" }} />
        </div>
      ))}
    </div>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  Officials: "Oficial",
  Unexpected: "Sin orden de salida",
  Individuals: "Particular",
  Education: "Licencia por estudio/capacitación",
  Health: "Salud o cuidado familiar",
  Maternity_Breastfeeding: "Lactancia - Maternidad",
  Guild_Meeting_Attendance: "Asamblea",
  Others_Justify: "Otras justificaciones",
};

const TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_LABELS).map(([k, v]) => [v, k])
);

const EXIT_TYPE_OPTIONS = [
  { value: "Unexpected",               label: "Sin órden de salida" },
  { value: "Individuals",              label: "Particular" },
  { value: "Officials",                label: "Oficial" },
  { value: "Guild_Meeting_Attendance", label: "Asamblea" },
  { value: "Education",                label: "Licencia por estudio/capacitación" },
  { value: "Health",                   label: "Salud o cuidado familiar" },
  { value: "Maternity_Breastfeeding",  label: "Lactancia - Maternidad" },
  { value: "Others_Justify",           label: "Otras justificaciones" },
];

const ADMIN_STATUS_OPTIONS = [
  { value: "Pending", label: "Pendiente de aprobación" },
  { value: "Waiting",  label: "En espera" },
  { value: "Done",     label: "Finalizado" },
  { value: "Cancel",   label: "Cancelado" },
];

const EXIT_TYPE_INFO: Record<string, { title: string; icon: string; color: string; bg: string; items: string[] }> = {
  Individuals: {
    title: "Salida Particular",
    icon: "pi-user",
    color: "#0ea5e9",
    bg: "#f0f9ff",
    items: [
      "Trámites personales o familiares durante el horario laboral.",
      "Citas médicas propias no cubiertas por otra licencia.",
      "Gestiones bancarias, notariales o administrativas personales.",
      "Situaciones imprevistas de índole personal que requieran ausentarse brevemente.",
    ],
  },
  Officials: {
    title: "Salida Oficial",
    icon: "pi-building",
    color: "#7c3aed",
    bg: "#f5f3ff",
    items: [
      "Comisiones de servicio o representación institucional.",
      "Asistencia a reuniones, capacitaciones o eventos convocados por la institución.",
      "Diligencias oficiales fuera del lugar de trabajo en nombre del organismo.",
      "Traslados ordenados por autoridad competente dentro del horario laboral.",
    ],
  },
  Guild_Meeting_Attendance: {
    title: "Asamblea Gremial",
    icon: "pi-users",
    color: "#059669",
    bg: "#f0fdf4",
    items: [
      "Asambleas convocadas por el sindicato o gremio al que pertenece el agente.",
      "Reuniones de comisiones directivas o delegados gremiales.",
      "Actos o movilizaciones gremiales reconocidas institucionalmente.",
      "Actividades de representación sindical previstas en el convenio colectivo.",
    ],
  },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  warning: { bg: "rgba(255,193,7,0.12)",    color: "#b45309" },
  danger:  { bg: "rgba(220,53,69,0.10)",    color: "#dc3545" },
  success: { bg: "rgba(5,150,105,0.10)",    color: "#059669" },
  muted:   { bg: "rgba(100,116,139,0.10)", color: "#64748b" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function mapItem(item: any): any {
  const rawType   = item._rawType   ?? item.type;
  const rawStatus = item._rawStatus ?? item.status;

  let cls = "", statusLabel = rawStatus, statusEnglish = rawStatus;
  let canArrival = false, canShowPdf = false, canCancel = false, canModificate = false;

  switch (rawStatus) {
    case "Waiting":
      cls = "warning"; statusLabel = "Esperando llegada";    statusEnglish = "Waiting";
      canArrival = true; canShowPdf = true; canCancel = true; canModificate = true; break;
    case "Cancel":
      cls = "danger";  statusLabel = "Cancelado";            statusEnglish = "Cancel";
      canShowPdf = true; canModificate = true; break;
    case "Done":
      cls = "success"; statusLabel = "Finalizado";           statusEnglish = "Done";
      canShowPdf = true; canModificate = true; break;
    case "Pending":
      cls = "muted";   statusLabel = "Pendiente aprobación"; statusEnglish = "Pending";
      canShowPdf = true; canCancel = true; canModificate = true; break;
  }

  return {
    ...item,
    _rawType: rawType,
    _rawStatus: rawStatus,
    type: TYPE_LABELS[rawType] ?? rawType,
    class: cls,
    status: statusLabel,
    statusEnglish,
    canArrival, canShowPdf, canCancel, canModificate,
    lastname_name: item.boss?.lastname_name ?? item.people?.lastname_name ?? item.lastname_name ?? "",
  };
}

function isAdminUser(): boolean {
  try {
    const roles: string[] = JSON.parse(localStorage.getItem("roles") ?? "{}")?.frontend_workflow?.roles ?? [];
    return roles.some((r) => r === "manager_informatica" || r === "manager_rrhh");
  } catch { return false; }
}

function formatDate(str: string | null | undefined): string {
  if (!str) return "--";
  try {
    const date = new Date(str);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const rawHours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = rawHours >= 12 ? "PM" : "AM";
    const hh = String(rawHours % 12 || 12).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${minutes}:${seconds} ${ampm}`;
  } catch { return str; }
}

function formatDateOnly(str: string | null | undefined): string {
  if (!str) return "--";
  try {
    const date = new Date(str);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch { return str; }
}

function formatTimeOnly(str: string | null | undefined): string {
  if (!str) return "--";
  try {
    const date = new Date(str);
    const rawHours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = rawHours >= 12 ? "PM" : "AM";
    const hh = String(rawHours % 12 || 12).padStart(2, "0");
    return `${hh}:${minutes}:${seconds} ${ampm}`;
  } catch { return str; }
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type AdminFilters = { limit: number; page: number; status: string; type: string; user_lastname: string };

// ── Component ──────────────────────────────────────────────────────────────────
export default function ExitsPage() {
  const toast           = useRef<Toast>(null);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminFiltersRef = useRef<AdminFilters>({ limit: 10, page: 1, status: "", type: "", user_lastname: "" });

  const [bosses,              setBosses]              = useState<any[]>([]);
  const [formType,            setFormType]            = useState("");
  const [formCuil,            setFormCuil]            = useState("");
  const [cuilTouched,         setCuilTouched]         = useState(false);
  const [loadingActionCreate, setLoadingActionCreate] = useState(false);
  const [assignedUser,        setAssignedUser]        = useState<any>(null);
  const [showModalBosses,     setShowModalBosses]     = useState(false);

  const [items,            setItems]            = useState<any[]>([]);
  const [loadingExits,     setLoadingExits]     = useState(false);
  const [filtersForExists, setFiltersForExists] = useState({ lastname_name: "", status: "", type: "", date: "" });
  const [hoveredRow,       setHoveredRow]       = useState<number | null>(null);
  const [hoveredType,      setHoveredType]      = useState<string | null>(null);
  const [myFirst,          setMyFirst]          = useState(0);
  const [myRows,           setMyRows]           = useState(10);

  const [idSelectedExitForViewPDF,   setIdSelectedExitForViewPDF]   = useState<number | null>(null);
  const [isLoadingActionOpenPdfExit, setIsLoadingActionOpenPdfExit] = useState(false);

  const [isOpenModalCancelExit,   setIsOpenModalCancelExit]   = useState(false);
  const [loadingActionCancelExit, setLoadingActionCancelExit] = useState(false);

  const [isAdmin,           setIsAdmin]           = useState(false);
  const [itemsAdmin,        setItemsAdmin]        = useState<any[]>([]);
  const [loadingExitsAdmin, setLoadingExitsAdmin] = useState(false);
  const [totalExitsAdmin,   setTotalExitsAdmin]   = useState(0);
  const [adminFilters,      setAdminFilters]      = useState<AdminFilters>({ limit: 10, page: 1, status: "", type: "", user_lastname: "" });
  const [paginatorFirst,    setPaginatorFirst]    = useState(0);
  const [hoveredAdminRow,   setHoveredAdminRow]   = useState<number | null>(null);
  const [errAdmin,          setErrAdmin]          = useState<string | null>(null);

  const [showModalModificateItem,     setShowModalModificateItem]     = useState(false);
  const [loadingActionModificateItem, setLoadingActionModificateItem] = useState(false);
  const [modifyForm,    setModifyForm]    = useState({ status: "", type: "", departure_hour: "", arrival_hour: "" });
  const [modifyTouched, setModifyTouched] = useState(false);

  const [isOpenModalDeleteExitAdmin, setIsOpenModalDeleteExitAdmin] = useState(false);
  const [loadingActionDeleteItem,    setLoadingActionDeleteItem]    = useState(false);

  const [isOpenModalCreateExitAdmin, setIsOpenModalCreateExitAdmin] = useState(false);
  const [itemSelected, setItemSelected] = useState<any>(null);

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const admin = isAdminUser();
    setIsAdmin(admin);
    loadBossesData();
    loadExitsData();
    if (admin) loadExitsAdminData(adminFiltersRef.current);
    const t = setInterval(loadExitsData, 300_000);
    return () => clearInterval(t);
  }, []);

  // ── Data loaders ──────────────────────────────────────────────────────────────
  async function loadBossesData() {
    try {
      const resp = await getAllBosses();
      const userCuil = localStorage.getItem("user");
      const list: any[] = Object.values(resp.bosses ?? {}).filter(
        (b: any) =>
          b.occupation_signature !== "Vocal" &&
          b.occupation_signature !== "Presidente" &&
          b.cuil !== userCuil
      );
      setBosses(list);
      return list;
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar los jefes", detail: err.message });
      return [];
    }
  }

  async function loadExitsData() {
    setLoadingExits(true);
    try {
      const raw = await loadExitOrders();
      setItems((Array.isArray(raw) ? [...raw].reverse() : []).map(mapItem));
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar sus salidas", detail: err.message });
    } finally { setLoadingExits(false); }
  }

  async function loadExitsAdminData(filters: AdminFilters) {
    setLoadingExitsAdmin(true);
    setErrAdmin(null);
    try {
      const resp = await loadExitOrdersAdmin({ limit: filters.limit, page: filters.page }, filters);
      if (!resp.message) {
        setTotalExitsAdmin(resp.total ?? 0);
        setItemsAdmin((resp.data ?? []).map((i: any) => mapItem({ ...i, _rawType: i.type, _rawStatus: i.status })));
      } else {
        setTotalExitsAdmin(0);
        setItemsAdmin([]);
      }
    } catch (err: any) {
      setErrAdmin(err.message);
    } finally { setLoadingExitsAdmin(false); }
  }

  // ── Create ────────────────────────────────────────────────────────────────────
  function changeTypeOfExit(type: string) {
    setFormType(type);
    setFormCuil("");
    setCuilTouched(false);
  }

  async function create() {
    setCuilTouched(true);
    if (!formCuil || !formType) return;
    setLoadingActionCreate(true);
    try {
      const resp = await createExitOrderRequest({ cuil: formCuil, type: formType });
      toast.current?.show({ severity: "success", summary: "Solicitud de salida creada" });
      if (resp.exit_order) {
        setItems((p) => [mapItem({ ...resp.exit_order, boss: resp.boss, _rawStatus: "Pending", _rawType: formType }), ...p]);
      }
      setFormType("");
      setFormCuil("");
      setCuilTouched(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo crear la orden", detail: err.message });
    } finally { setLoadingActionCreate(false); }
  }

  async function openModalBosses() {
    if (!assignedUser) {
      try {
        const resp = await getDataUser();
        const normalizedBosses = (resp.bosses ?? []).map((b: any) => ({
          cuil: b.people?.cuil ?? b.cuil,
          lastname_name: b.people?.lastname_name ?? b.lastname_name,
          people: b.people ?? b,
        }));
        setAssignedUser({ ...resp, bosses: normalizedBosses });
      } catch {
        toast.current?.show({ severity: "error", summary: "No se pudo cargar tu información de jefes" });
        return;
      }
    }
    setShowModalBosses(true);
  }

  async function handleBossesAssigned(newBosses: any[]) {
    const wrapped = newBosses.map((b) => ({ ...b, people: b }));
    setAssignedUser((prev: any) => ({ ...prev, bosses: wrapped }));
    setShowModalBosses(false);
    const list = await loadBossesData();
    setFormCuil((prev) => (prev && !list.some((b: any) => b.cuil === prev) ? "" : prev));
  }

  // ── Filters ───────────────────────────────────────────────────────────────────
  function setFilterAdmin(field: string, value: string) {
    const next = { ...adminFiltersRef.current, [field]: value, page: 1 };
    adminFiltersRef.current = next;
    setAdminFilters(next);
    setPaginatorFirst(0);
    loadExitsAdminData(next);
  }

  function handleUserLastnameFilter(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = { ...adminFiltersRef.current, user_lastname: value, page: 1 };
      adminFiltersRef.current = next;
      setAdminFilters(next);
      setPaginatorFirst(0);
      loadExitsAdminData(next);
    }, 500);
  }

  // ── PDF ───────────────────────────────────────────────────────────────────────
  async function openPdfExit(exit: any) {
    setIdSelectedExitForViewPDF(exit.id);
    if (isLoadingActionOpenPdfExit) return;
    if (!exit.path_end) {
      setIdSelectedExitForViewPDF(null);
      toast.current?.show({ severity: "error", summary: "No se encontró el PDF" });
      return;
    }
    setIsLoadingActionOpenPdfExit(true);
    try {
      const buffer = await loadExitPDF(exit.id);
      window.open(URL.createObjectURL(new Blob([buffer], { type: "application/pdf" })));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se encontró el PDF" });
    } finally {
      setIdSelectedExitForViewPDF(null);
      setIsLoadingActionOpenPdfExit(false);
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────────
  function openModalCancelExit(exit: any) { setItemSelected(exit); setIsOpenModalCancelExit(true); }
  function closeModalCancelExit() { setItemSelected(null); setIsOpenModalCancelExit(false); }

  async function cancelExit() {
    if (loadingActionCancelExit) return;
    setLoadingActionCancelExit(true);
    try {
      await cancelExitOrder(itemSelected.id);
      toast.current?.show({ severity: "success", summary: "Salida cancelada" });
      setItems((p) => p.map((i) => i.id === itemSelected.id ? mapItem({ ...i, _rawStatus: "Cancel" }) : i));
      closeModalCancelExit();
    } catch {
      toast.current?.show({ severity: "error", summary: "No se puede cancelar la salida" });
    } finally { setLoadingActionCancelExit(false); }
  }

  // ── Modify ────────────────────────────────────────────────────────────────────
  function openModalModificateItem(item: any) {
    setItemSelected(item);
    setModifyForm({
      departure_hour: item.departure_hour ?? "",
      arrival_hour:   item.arrival_hour   ?? "",
      status:         item.statusEnglish  ?? "",
      type:           TYPE_REVERSE[item.type] ?? item._rawType ?? "",
    });
    setModifyTouched(false);
    setShowModalModificateItem(true);
  }

  function closeModalModificateItem() {
    setItemSelected(null);
    setModifyForm({ status: "", type: "", departure_hour: "", arrival_hour: "" });
    setShowModalModificateItem(false);
  }

  async function modificateItem() {
    setModifyTouched(true);
    if (!modifyForm.departure_hour || !modifyForm.status || !modifyForm.type) return;
    if (modifyForm.arrival_hour && new Date(modifyForm.departure_hour) >= new Date(modifyForm.arrival_hour)) {
      toast.current?.show({ severity: "info", summary: "La hora de llegada no puede ser anterior a la hora de salida" });
      return;
    }
    setLoadingActionModificateItem(true);
    const data = {
      departure_hour: modifyForm.departure_hour.replace("T", " "),
      arrival_hour:   modifyForm.arrival_hour ? modifyForm.arrival_hour.replace("T", " ") : "",
      status: modifyForm.status,
      type:   modifyForm.type,
    };
    try {
      await updateExitOrderAdmin([], data, String(itemSelected.id));
      toast.current?.show({ severity: "success", summary: "Salida modificada" });
      setItemsAdmin((p) => p.map((i) =>
        i.id === itemSelected.id
          ? mapItem({ ...i, ...data, _rawStatus: data.status, _rawType: data.type })
          : i
      ));
      closeModalModificateItem();
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "No se pudo modificar la salida", detail: err.message });
    } finally { setLoadingActionModificateItem(false); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  function openModalDeleteItem(item: any) { setItemSelected(item); setIsOpenModalDeleteExitAdmin(true); }

  async function deleteItem() {
    if (loadingActionDeleteItem) return;
    setLoadingActionDeleteItem(true);
    try {
      await deleteExitOrderAdmin(itemSelected.id);
      setItemsAdmin((p) => p.filter((i) => i.id !== itemSelected.id));
      toast.current?.show({ severity: "success", summary: "Orden eliminada" });
      setIsOpenModalDeleteExitAdmin(false);
      setItemSelected(null);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar la orden" });
    } finally { setLoadingActionDeleteItem(false); }
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  function pageChange(event: any) {
    const next = { ...adminFiltersRef.current, limit: Number(event.rows), page: Number(event.page + 1) };
    adminFiltersRef.current = next;
    setAdminFilters(next);
    setPaginatorFirst(event.first);
    loadExitsAdminData(next);
  }

  useEffect(() => { setMyFirst(0); }, [filtersForExists]);

  // ── Client-side filter ────────────────────────────────────────────────────────
  const myTypeOptions   = [...new Set(items.map((i) => i.type))].filter(Boolean).sort();
  const myBossOptions   = [...new Set(items.map((i) => i.lastname_name))].filter(Boolean).sort();
  const myStatusOptions = [...new Set(items.map((i) => i.status))].filter(Boolean).sort();
  const myExitDates     = [...new Set(items.map((i) => String(i.departure_hour ?? "").slice(0, 10)))].filter(Boolean);
  const myExitDateObjects = myExitDates.map((d) => new Date(`${d}T00:00:00`));

  const filteredItems = items.filter((item) => {
    if (filtersForExists.type          && item.type !== filtersForExists.type)                     return false;
    if (filtersForExists.lastname_name && item.lastname_name !== filtersForExists.lastname_name)    return false;
    if (filtersForExists.status        && item.status !== filtersForExists.status)                 return false;
    if (filtersForExists.date          && !String(item.departure_hour ?? "").startsWith(filtersForExists.date)) return false;
    return true;
  });

  const pagedFilteredItems = filteredItems.slice(myFirst, myFirst + myRows);

  const hasMyFilters    = !!(filtersForExists.type || filtersForExists.lastname_name || filtersForExists.status || filtersForExists.date);
  const hasAdminFilters = !!(adminFilters.status || adminFilters.type || adminFilters.user_lastname);

  // ── Dialog headers ────────────────────────────────────────────────────────────
  const bossDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-user" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Seleccionar jefe</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Elegí a quién reportar la salida</small>
      </div>
    </div>
  );

  const cancelDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-times-circle" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Cancelar salida</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  const modifyDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-pencil" style={{ color: "#3b82f6", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Modificar salida</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{itemSelected?.lastname_name ?? ""}</small>
      </div>
    </div>
  );

  const deleteDialogHeader = (
    <div className="d-flex align-items-center" style={{ gap: "12px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="pi pi-trash" style={{ color: "#dc3545", fontSize: "1rem" }} />
      </div>
      <div>
        <p className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Eliminar salida</p>
        <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Esta acción no se puede deshacer</small>
      </div>
    </div>
  );

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      {/* ── Page header card ── */}
      <div className="fadeIn animated">
        <div className="card profile-card">
          <div className="d-flex align-items-center px-3 pt-3 pb-3" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-sign-out" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Salidas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Gestión de órdenes de salida</small>
            </div>
          </div>
        </div>
      </div>

      {/* ── Creación de salida card ── */}
      <div className="fadeIn animated mt-4">
        <div className="card profile-card">

          {/* Card header */}
          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-plus-circle" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Creación de salida</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Seleccioná el tipo de salida</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>
            <div className="d-flex justify-content-center flex-wrap" style={{ gap: "10px" }}>
              {([
                { value: "Individuals",              label: "Particular",  icon: "pi-user" },
                { value: "Officials",                label: "Oficial",     icon: "pi-building" },
                { value: "Guild_Meeting_Attendance", label: "Asamblea",    icon: "pi-users" },
              ] as const).map((t) => (
                <TypeInfoTooltip key={t.value} info={EXIT_TYPE_INFO[t.value]}>
                  <button
                    type="button"
                    onClick={() => changeTypeOfExit(t.value)}
                    onMouseEnter={() => setHoveredType(t.value)}
                    onMouseLeave={() => setHoveredType(null)}
                    style={{
                      padding: "9px 22px",
                      borderRadius: "9px",
                      border: hoveredType === t.value ? "1.5px solid #0ea5e9" : "1.5px solid transparent",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.84rem",
                      background: formType === t.value ? "#0ea5e9" : hoveredType === t.value ? "#f0f9ff" : "#e2e8f0",
                      color: formType === t.value ? "#fff" : hoveredType === t.value ? "#0ea5e9" : "#475569",
                      transition: "background 0.15s, color 0.15s, border-color 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      minWidth: "140px",
                      justifyContent: "center",
                    }}
                  >
                    <i className={`pi ${t.icon}`} style={{ fontSize: "0.82rem" }} />
                    {t.label}
                  </button>
                </TypeInfoTooltip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mis salidas card ── */}
      <div className="fadeIn animated mt-4">
        <div className="card profile-card">

          <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-list" style={{ color: "#059669", fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Mis salidas</h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Tus órdenes de salida</small>
            </div>
          </div>
          <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

          <div className="card-body" style={{ padding: "16px 20px 20px" }}>

            {/* Filter bar — mis salidas */}
            <div className="license-filter-bar mb-3">
              <div className="license-filter-bar-inputs">
                <div className={`license-filter-input-wrap${filtersForExists.type ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-tag license-filter-icon" />
                  <Dropdown
                    value={filtersForExists.type || null}
                    options={myTypeOptions}
                    onChange={(e) => setFiltersForExists((p) => ({ ...p, type: e.value ?? "" }))}
                    placeholder="Tipo"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                    showClear={!!filtersForExists.type}
                    emptyMessage="Sin opciones"
                  />
                </div>
                <div className={`license-filter-input-wrap${filtersForExists.lastname_name ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-user license-filter-icon" />
                  <Dropdown
                    value={filtersForExists.lastname_name || null}
                    options={myBossOptions}
                    onChange={(e) => setFiltersForExists((p) => ({ ...p, lastname_name: e.value ?? "" }))}
                    placeholder="Solicitado a"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                    showClear={!!filtersForExists.lastname_name}
                    emptyMessage="Sin opciones"
                  />
                </div>
                <div className={`license-filter-input-wrap${filtersForExists.status ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-info-circle license-filter-icon" />
                  <Dropdown
                    value={filtersForExists.status || null}
                    options={myStatusOptions}
                    onChange={(e) => setFiltersForExists((p) => ({ ...p, status: e.value ?? "" }))}
                    placeholder="Estado"
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel"
                    showClear={!!filtersForExists.status}
                    emptyMessage="Sin opciones"
                  />
                </div>
                <div className={`license-filter-input-wrap${filtersForExists.date ? " license-filter-input-wrap--active" : ""}`}>
                  <i className="pi pi-calendar license-filter-icon" />
                  <Calendar
                    value={filtersForExists.date ? new Date(`${filtersForExists.date}T00:00:00`) : null}
                    onChange={(e) => setFiltersForExists((p) => ({ ...p, date: e.value ? toDateInputValue(e.value as Date) : "" }))}
                    dateFormat="dd/mm/yy"
                    placeholder="Fecha"
                    locale="es"
                    showButtonBar
                    enabledDates={myExitDateObjects}
                    dateTemplate={(date) => {
                      const key = `${date.year}-${String(date.month + 1).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                      const hasExit = myExitDates.includes(key);
                      return (
                        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: hasExit ? "#0ea5e9" : undefined, fontWeight: hasExit ? 700 : undefined }}>
                          {date.day}
                          {hasExit && (
                            <span style={{ position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: "50%", background: "#0ea5e9" }} />
                          )}
                        </span>
                      );
                    }}
                    className="license-filter-dropdown"
                    panelClassName="license-filter-dropdown-panel license-filter-calendar-panel"
                  />
                </div>
              </div>
              {hasMyFilters && (
                <button
                  type="button"
                  className="license-filter-clear"
                  onClick={() => setFiltersForExists({ lastname_name: "", status: "", type: "", date: "" })}
                >
                  <i className="pi pi-times" /> Limpiar
                </button>
              )}
            </div>

            {loadingExits && <SkeletonRows />}

            {!loadingExits && (
              <div className="fadeIn animated" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["TIPO", "SOLICITADO A", "ESTADO", "FECHA", "HORA SALIDA", "HORA LLEGADA", ""].map((h, i) => (
                        <th key={i} style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", padding: "0 8px 10px", textAlign: i === 6 ? "right" : "left", borderBottom: "1.5px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: "40px", textAlign: "center" }}>
                          <i className="pi pi-sign-out" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                            No hay salidas registradas{hasMyFilters ? " con los filtros aplicados" : ""}.
                          </p>
                        </td>
                      </tr>
                    )}
                    {pagedFilteredItems.map((item) => {
                      const sc = STATUS_COLORS[item.class] ?? { bg: "rgba(100,116,139,0.1)", color: "#64748b" };
                      return (
                        <tr
                          key={item.id}
                          className="fadeIn animated"
                          onMouseEnter={() => setHoveredRow(item.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: hoveredRow === item.id ? "rgba(74,108,247,0.06)" : "transparent", transition: "background 0.15s" }}
                        >
                          <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                            <span style={{ background: "rgba(74,108,247,0.09)", color: "#4a6cf7", borderRadius: "8px", padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px", fontSize: "0.86rem", color: "#374151" }}>
                            {item.lastname_name}
                          </td>
                          <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", fontSize: "0.73rem", fontWeight: 600, background: sc.bg, color: sc.color }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px", fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                            {formatDateOnly(item.departure_hour)}
                          </td>
                          <td style={{ padding: "10px 8px", fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                            {formatTimeOnly(item.departure_hour)}
                          </td>
                          <td style={{ padding: "10px 8px", fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                            {formatTimeOnly(item.arrival_hour)}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div className="d-flex align-items-center justify-content-end" style={{ gap: "6px" }}>
                              {item.canShowPdf && (
                                <Tooltip label="Ver PDF">
                                  <button
                                    type="button"
                                    onClick={() => openPdfExit(item)}
                                    style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#4a6cf7" }}
                                  >
                                    <i className={isLoadingActionOpenPdfExit && idSelectedExitForViewPDF === item.id ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"} style={{ fontSize: "1rem" }} />
                                  </button>
                                </Tooltip>
                              )}
                              {item.canCancel && (
                                <Tooltip label="Cancelar">
                                  <button
                                    type="button"
                                    onClick={() => openModalCancelExit(item)}
                                    style={{ background: "none", border: "1.5px solid #fecdd3", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#dc3545" }}
                                  >
                                    <i className="pi pi-times" style={{ fontSize: "0.85rem" }} />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Paginator
                  first={myFirst}
                  rows={myRows}
                  totalRecords={filteredItems.length}
                  rowsPerPageOptions={[10, 15, 20]}
                  onPageChange={(e) => { setMyFirst(e.first); setMyRows(e.rows); }}
                  rightContent={
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                      {filteredItems.length} {filteredItems.length === 1 ? "salida" : "salidas"}
                    </span>
                  }
                />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Admin card ── */}
      {isAdmin && (
        <div className="fadeIn animated mt-4">
          <div className="card profile-card profile-card--admin">

            <div className="d-flex align-items-center px-3 pt-3 pb-2" style={{ gap: "12px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "11px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="pi pi-users" style={{ color: "#eab308", fontSize: "1rem" }} />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: "0.93rem", color: "#1e293b" }}>Salidas de terceros</h5>
                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Órdenes de salida solicitadas por administración</small>
              </div>
              <span style={{ background: "rgba(234,179,8,0.14)", color: "#a16207", borderRadius: "20px", padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                Administración
              </span>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem", padding: "5px 14px" }}
                onClick={() => setIsOpenModalCreateExitAdmin(true)}
              >
                <i className="pi pi-plus" style={{ fontSize: "0.75rem" }} />
                Crear salida
              </button>
            </div>
            <hr className="mt-0 mb-0" style={{ borderColor: "rgba(0,0,0,0.05)" }} />

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>

                {/* Admin filter bar */}
                <div className="license-filter-bar mb-3">
                  <div className="license-filter-bar-inputs">
                    <div className={`license-filter-input-wrap${adminFilters.user_lastname ? " license-filter-input-wrap--active" : ""}`}>
                      <i className="pi pi-search license-filter-icon" />
                      <input
                        placeholder="Solicitado por"
                        style={{ paddingLeft: "32px", border: "none", width: "100%", fontSize: "0.84rem", background: "transparent", outline: "none" }}
                        onChange={(e) => handleUserLastnameFilter(e.target.value)}
                        defaultValue=""
                      />
                    </div>
                    <div className={`license-filter-input-wrap${adminFilters.status ? " license-filter-input-wrap--active" : ""}`}>
                      <i className="pi pi-info-circle license-filter-icon" />
                      <Dropdown
                        value={adminFilters.status || null}
                        options={ADMIN_STATUS_OPTIONS}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setFilterAdmin("status", e.value ?? "")}
                        placeholder="Estado"
                        className="license-filter-dropdown"
                        panelClassName="license-filter-dropdown-panel"
                        showClear={!!adminFilters.status}
                        emptyMessage="Sin opciones"
                      />
                    </div>
                    <div className={`license-filter-input-wrap${adminFilters.type ? " license-filter-input-wrap--active" : ""}`}>
                      <i className="pi pi-tag license-filter-icon" />
                      <Dropdown
                        value={adminFilters.type || null}
                        options={EXIT_TYPE_OPTIONS}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setFilterAdmin("type", e.value ?? "")}
                        placeholder="Tipo"
                        className="license-filter-dropdown"
                        panelClassName="license-filter-dropdown-panel"
                        showClear={!!adminFilters.type}
                        emptyMessage="Sin opciones"
                      />
                    </div>
                  </div>
                  {hasAdminFilters && (
                    <button
                      type="button"
                      className="license-filter-clear"
                      onClick={() => {
                        const next = { ...adminFiltersRef.current, status: "", type: "", user_lastname: "", page: 1 };
                        adminFiltersRef.current = next;
                        setAdminFilters(next);
                        setPaginatorFirst(0);
                        loadExitsAdminData(next);
                      }}
                    >
                      <i className="pi pi-times" /> Limpiar
                    </button>
                  )}
                </div>

                {loadingExitsAdmin && <SkeletonRows />}

                {!loadingExitsAdmin && errAdmin && (
                  <div className="fadeIn animated" style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(220,53,69,0.07)", border: "1px solid rgba(220,53,69,0.22)", color: "#dc3545", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="pi pi-exclamation-circle" style={{ flexShrink: 0 }} />
                    {errAdmin}
                  </div>
                )}

                {!loadingExitsAdmin && !errAdmin && (
                  <div className="fadeIn animated" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["SOLICITADA POR", "ESTADO", "TIPO", "HORA SALIDA", "HORA LLEGADA", ""].map((h, i) => (
                            <th key={i} style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", padding: "0 8px 10px", textAlign: i === 5 ? "right" : "left", borderBottom: "1.5px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {itemsAdmin.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: "40px", textAlign: "center" }}>
                              <i className="pi pi-users" style={{ fontSize: "2rem", color: "#cbd5e1", display: "block", marginBottom: "8px" }} />
                              <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                                No hay salidas registradas{hasAdminFilters ? " con los filtros aplicados" : ""}.
                              </p>
                            </td>
                          </tr>
                        )}
                        {itemsAdmin.map((item) => {
                          const sc = STATUS_COLORS[item.class] ?? { bg: "rgba(100,116,139,0.1)", color: "#64748b" };
                          return (
                            <tr
                              key={item.id}
                              className="fadeIn animated"
                              onMouseEnter={() => setHoveredAdminRow(item.id)}
                              onMouseLeave={() => setHoveredAdminRow(null)}
                              style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: hoveredAdminRow === item.id ? "rgba(74,108,247,0.06)" : "transparent", transition: "background 0.15s" }}
                            >
                              <td style={{ padding: "10px 8px", fontSize: "0.86rem", color: "#374151" }}>
                                {item.lastname_name}
                              </td>
                              <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", fontSize: "0.73rem", fontWeight: 600, background: sc.bg, color: sc.color }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                                <span style={{ background: "rgba(74,108,247,0.09)", color: "#4a6cf7", borderRadius: "8px", padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
                                  {item.type}
                                </span>
                              </td>
                              <td style={{ padding: "10px 8px", fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                                {formatDate(item.departure_hour)}
                              </td>
                              <td style={{ padding: "10px 8px", fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                                {formatDate(item.arrival_hour)}
                              </td>
                              <td style={{ padding: "10px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                                <div className="d-flex align-items-center justify-content-end" style={{ gap: "6px" }}>
                                  {item.canShowPdf && (
                                    <Tooltip label="Ver PDF">
                                      <button
                                        type="button"
                                        onClick={() => openPdfExit(item)}
                                        style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#4a6cf7" }}
                                      >
                                        <i className={isLoadingActionOpenPdfExit && idSelectedExitForViewPDF === item.id ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"} style={{ fontSize: "1rem" }} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  {item.canModificate && (
                                    <Tooltip label="Modificar">
                                      <button
                                        type="button"
                                        onClick={() => openModalModificateItem(item)}
                                        style={{ background: "none", border: "1.5px solid #dbeafe", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#3b82f6" }}
                                      >
                                        <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  <Tooltip label="Eliminar">
                                    <button
                                      type="button"
                                      onClick={() => openModalDeleteItem(item)}
                                      style={{ background: "none", border: "1.5px solid #fecdd3", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#dc3545" }}
                                    >
                                      <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
                                    </button>
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-2">
                  <Paginator
                    first={paginatorFirst}
                    rows={adminFilters.limit}
                    totalRecords={totalExitsAdmin}
                    pageLinkSize={3}
                    rowsPerPageOptions={[10, 15, 20]}
                    onPageChange={pageChange}
                    rightContent={
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, paddingRight: "4px" }}>
                        {totalExitsAdmin} {totalExitsAdmin === 1 ? "salida" : "salidas"}
                      </span>
                    }
                  />
                </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Boss selection dialog ── */}
      <Dialog
        header={bossDialogHeader}
        visible={formType !== ""}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(480px, 92vw)" }}
        onHide={() => setFormType("")}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                onClick={create}
                disabled={loadingActionCreate}
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingActionCreate ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingActionCreate ? "Solicitando..." : "Aceptar"}
              </button>
              <button
                onClick={() => setFormType("")}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Cerrar
              </button>
            </div>
            {loadingActionCreate && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <div className={`license-filter-input-wrap${formCuil ? " license-filter-input-wrap--active" : ""}`}>
          <i className="pi pi-user license-filter-icon" />
          <Dropdown
            value={formCuil || null}
            options={bosses}
            optionLabel="lastname_name"
            optionValue="cuil"
            onChange={(e) => setFormCuil(e.value ?? "")}
            placeholder="Seleccioná un jefe"
            className="license-filter-dropdown"
            panelClassName="license-filter-dropdown-panel"
            showClear={!!formCuil}
            emptyMessage="Sin opciones"
          />
        </div>
        <div
          className="animated fadeIn"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}
        >
          <i className="pi pi-info-circle" style={{ flexShrink: 0 }} />
          Podés elegir entre tus jefes directos o los jefes de éstos. El Director de RRHH figura siempre disponible por defecto.
        </div>
        <div
          className="animated fadeIn"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "10px", fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}
        >
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <i className="pi pi-info-circle" style={{ flexShrink: 0 }} />
            Si no aparece tu jefe o debes cambiar de jefe, debés modificarlo.
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center"
            style={{ gap: "5px", flexShrink: 0, fontSize: "0.78rem", borderRadius: "8px", fontWeight: 600, padding: "4px 10px" }}
            onClick={openModalBosses}
          >
            <i className="pi pi-pencil" style={{ fontSize: "0.7rem" }} />
            Modificar
          </button>
        </div>
        {cuilTouched && !formCuil && (
          <small className="text-danger fadeIn animated" style={{ marginTop: "4px", display: "block" }}>* Campo obligatorio</small>
        )}
      </Dialog>

      {/* ── Cancel dialog ── */}
      <Dialog
        header={cancelDialogHeader}
        visible={isOpenModalCancelExit}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={closeModalCancelExit}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingActionCancelExit}
                onClick={cancelExit}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingActionCancelExit ? "pi pi-spin pi-spinner" : "pi pi-times"} style={{ fontSize: "0.78rem" }} />
                {loadingActionCancelExit ? "Cancelando..." : "Sí, cancelar"}
              </button>
              <button
                disabled={loadingActionCancelExit}
                onClick={closeModalCancelExit}
                type="button"
                className="btn btn-light text-muted ml-auto"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Cerrar
              </button>
            </div>
            {loadingActionCancelExit && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          ¿Estás seguro de que querés cancelar esta orden de salida?
        </p>
      </Dialog>

      {/* ── Modify dialog ── */}
      <Dialog
        header={modifyDialogHeader}
        visible={showModalModificateItem}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        style={{ width: "min(560px, 92vw)" }}
        onHide={closeModalModificateItem}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingActionModificateItem || !modifyForm.status || !modifyForm.type}
                onClick={modificateItem}
                type="button"
                className="btn btn-primary d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingActionModificateItem ? "pi pi-spin pi-spinner" : "pi pi-check"} style={{ fontSize: "0.78rem" }} />
                {loadingActionModificateItem ? "Modificando..." : "Modificar"}
              </button>
              <button
                disabled={loadingActionModificateItem}
                onClick={closeModalModificateItem}
                type="button"
                className="btn btn-light text-muted"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                Cerrar
              </button>
            </div>
            {loadingActionModificateItem && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <div className="row">
          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</label>
            <select
              className="form-control form-control-sm custom-select mt-1"
              value={modifyForm.status}
              onChange={(e) => setModifyForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="Pending">Pendiente de aprobación</option>
              <option value="Waiting">En espera</option>
              <option value="Done">Finalizado</option>
              <option value="Cancel">Cancelado</option>
            </select>
            {modifyTouched && !modifyForm.status && (
              <small className="text-danger fadeIn animated">* Campo obligatorio</small>
            )}
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de salida</label>
            <select
              className="form-control form-control-sm custom-select mt-1"
              value={modifyForm.type}
              onChange={(e) => setModifyForm((p) => ({ ...p, type: e.target.value }))}
            >
              <option value=""></option>
              {EXIT_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {modifyTouched && !modifyForm.type && (
              <small className="text-danger fadeIn animated">* Campo obligatorio</small>
            )}
          </div>
        </div>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog
        header={deleteDialogHeader}
        visible={isOpenModalDeleteExitAdmin}
        modal
        draggable={false}
        resizable={false}
        closable={false}
        dismissableMask
        style={{ width: "min(420px, 92vw)" }}
        onHide={() => { setIsOpenModalDeleteExitAdmin(false); setItemSelected(null); }}
        footer={
          <div>
            <div className="d-flex align-items-center" style={{ gap: "8px" }}>
              <button
                disabled={loadingActionDeleteItem}
                onClick={deleteItem}
                type="button"
                className="btn btn-danger d-flex align-items-center"
                style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={loadingActionDeleteItem ? "pi pi-spin pi-spinner" : "pi pi-trash"} style={{ fontSize: "0.78rem" }} />
                {loadingActionDeleteItem ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                disabled={loadingActionDeleteItem}
                onClick={() => { setIsOpenModalDeleteExitAdmin(false); setItemSelected(null); }}
                type="button"
                className="btn btn-light text-muted"
                style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
              >
                No
              </button>
            </div>
            {loadingActionDeleteItem && <ProgressBar mode="indeterminate" style={{ height: "3px", borderRadius: "2px" }} className="mt-2" />}
          </div>
        }
      >
        <p style={{ fontSize: "0.88rem", color: "#374151", margin: 0 }}>
          ¿Estás seguro de que querés eliminar esta orden de salida?
        </p>
      </Dialog>

      {/* ── CreateExitAdminModal ── */}
      <CreateExitAdminModal
        isOpen={isOpenModalCreateExitAdmin}
        onHide={() => setIsOpenModalCreateExitAdmin(false)}
        onCreated={(exitOrder) => {
          setItemsAdmin((p) => [mapItem({ ...exitOrder, _rawType: exitOrder.type, _rawStatus: exitOrder.status }), ...p]);
        }}
      />

      {/* ── ModalBosses ── */}
      <ModalBosses
        show={showModalBosses}
        user={assignedUser}
        onHide={() => setShowModalBosses(false)}
        onBossesAssigned={handleBossesAssigned}
      />
    </>
  );
}
