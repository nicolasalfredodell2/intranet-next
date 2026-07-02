import { useRef, useState } from "react";
import { getDataUser } from "@/lib/services/perfil.service";
import { loadTimeclockRecords, TimeclockRecord } from "@/lib/services/timeclock.service";

/** Fields used for matching a timeclock record to the logged-in user; getDataUser() may return more. */
interface UserProfile {
  id?: number | string;
  cuil?: string;
  file?: number | string;
}

const MAX_RANGE_DAYS = 7;
const PAGE_LIMIT = 200;

const ENTRY_TYPES = new Set([1, 3, 6, 8]);

const TYPE_LABELS: Record<number, string> = {
  1: "Entrada",
  2: "Salida temporal",
  3: "Regreso de salida temporal",
  4: "Salida",
  5: "Salida por salud",
  6: "Entrada hora extra (mañana)",
  7: "Salida hora extra (mañana)",
  8: "Entrada hora extra (tarde)",
  9: "Salida hora extra (tarde)",
  99: "Grupo remoto",
};

export interface TimeclockRecordView {
  id: number;
  date: string;
  time: string;
  typeId: number;
  title: string;
  isEntry: boolean;
}

export interface TimeclockGroup {
  date: string;
  records: TimeclockRecordView[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

function isValidDateStr(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(`${s}T00:00:00`).getTime());
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cur <= end) {
    dates.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function validateRange(from: string, to: string): string | null {
  if (!from || !to) return "Seleccioná ambas fechas.";
  if (!isValidDateStr(from) || !isValidDateStr(to)) return "Rango de fechas inválido.";
  if (from > to) return "La fecha Desde no puede ser mayor a la fecha Hasta.";
  const today = todayStr();
  if (from > today || to > today) return "Las fechas no pueden ser posteriores a hoy.";
  if (daysBetween(from, to) + 1 > MAX_RANGE_DAYS) return `El rango máximo permitido es de ${MAX_RANGE_DAYS} días.`;
  return null;
}

function normalizeCuil(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? digits.padStart(11, "0").slice(-11) : "";
}

function normalizeFile(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  const stripped = digits.replace(/^0+/, "");
  return stripped || (digits ? "0" : "");
}

function isAllowedOrigin(host: unknown): boolean {
  return host === "RF_IN" || host === "RF_OUT";
}

function belongsToCurrentUser(record: TimeclockRecord, profile: UserProfile | null): boolean {
  if (!profile) return false;

  const recordUserId = record.user_id ?? record.people?.id;
  if (recordUserId != null && profile.id != null && Number(recordUserId) === Number(profile.id)) {
    return true;
  }

  const recordCuil = record.cuil ?? record.people?.cuil;
  const profileCuil = normalizeCuil(profile.cuil);
  if (recordCuil != null && profileCuil && normalizeCuil(recordCuil) === profileCuil) {
    return true;
  }

  const recordFile = record.file ?? record.people?.file;
  const profileFile = normalizeFile(profile.file);
  if (recordFile != null && profileFile && normalizeFile(recordFile) === profileFile) {
    return true;
  }

  return false;
}

function formatDisplayTime(record: TimeclockRecord): string {
  const raw = record.hours ?? record.datetime ?? record.created_at ?? record.time;
  if (!raw) return "--:--";
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(raw))) {
    const [h, m] = String(raw).split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }
  const date = new Date(String(raw));
  if (isNaN(date.getTime())) return String(raw);
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function toRecordView(record: TimeclockRecord): TimeclockRecordView {
  const typeId = Number(record.type_exit_order_id ?? record.type ?? record.event_type);
  const isEntry = ENTRY_TYPES.has(typeId);
  return {
    id: record.id,
    date: record.date,
    time: formatDisplayTime(record),
    typeId,
    title: TYPE_LABELS[typeId] ?? (isEntry ? "Entrada" : "Salida"),
    isEntry,
  };
}

function groupByDate(records: TimeclockRecordView[]): TimeclockGroup[] {
  const map = new Map<string, TimeclockRecordView[]>();
  for (const r of records) {
    if (!map.has(r.date)) map.set(r.date, []);
    map.get(r.date)!.push(r);
  }
  const groups: TimeclockGroup[] = Array.from(map.entries()).map(([date, recs]) => ({
    date,
    records: recs.slice().sort((a, b) => a.time.localeCompare(b.time)),
  }));
  groups.sort((a, b) => b.date.localeCompare(a.date));
  return groups;
}

async function fetchAllRecordsForDate(date: string): Promise<TimeclockRecord[]> {
  const all: TimeclockRecord[] = [];
  let page = 1;
  for (;;) {
    const resp = await loadTimeclockRecords({ date, limit: PAGE_LIMIT, page });
    all.push(...(resp.data ?? []));
    if (!resp.last_page || page >= resp.last_page) break;
    page++;
  }
  return all;
}

export function useTimeclock() {
  const today = todayStr();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [groups, setGroups] = useState<TimeclockGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profileRef = useRef<UserProfile | null>(null);

  async function search(from: string = fromDate, to: string = toDate) {
    const validationError = validateRange(from, to);
    if (validationError) {
      setError(validationError);
      setGroups([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (!profileRef.current) {
        profileRef.current = await getDataUser();
      }
      const profile = profileRef.current;
      const dates = enumerateDates(from, to);
      const perDay = await Promise.all(dates.map(fetchAllRecordsForDate));
      const allRecords = perDay.flat();
      const own = allRecords.filter((r) => isAllowedOrigin(r.host) && belongsToCurrentUser(r, profile));
      setGroups(groupByDate(own.map(toRecordView)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las fichadas.");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  return { fromDate, setFromDate, toDate, setToDate, groups, loading, error, search, today, maxRangeDays: MAX_RANGE_DAYS };
}
