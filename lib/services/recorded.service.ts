const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const TYPE_LABELS: Record<string | number, string> = {
  1: "Ingreso laboral (inicio de jornada)",
  2: "Salida temporal",
  3: "Regreso salida temporal",
  4: "Egreso laboral (fin de jornada)",
  5: "Salida por salud o cuidado familiar",
  6: "Inicio de horas extras",
  7: "Fin de horas extras",
  Officials: "Oficial",
  Unexpected: "Sin orden de salida",
  Individuals: "Particular",
  Education: "Licencia por estudio/capacitación",
  Health: "Salud o cuidado familiar",
  Guild_Meeting_Attendance: "Asamblea",
  Others_Justify: "Otras justificaciones",
};

const STATUS_MAP: Record<string, { label: string; cssClass: string }> = {
  Waiting: { label: "Esperando llegada", cssClass: "warning" },
  Cancel: { label: "Cancelado", cssClass: "danger" },
  Done: { label: "Finalizado", cssClass: "success" },
  Pending: { label: "Pendiente aprobación", cssClass: "muted" },
};

function normalizeRecords(resp: any): any {
  if (!resp?.data) return resp;
  let data: any[] = Array.isArray(resp.data) ? resp.data : Object.values(resp.data);
  data = data.map((item: any) => {
    const typeLabel = TYPE_LABELS[item.type];
    if (typeLabel) item.type = typeLabel;
    const statusInfo = STATUS_MAP[item.status];
    if (statusInfo) { item.statusLabel = statusInfo.label; item.statusClass = statusInfo.cssClass; }
    return item;
  });
  return { ...resp, data };
}

export async function getRecordedData(filters: any): Promise<any> {
  const res = await fetch(`${API}admin/get/all/timeclock`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  });
  if (!res.ok) throw new Error("No se pudo cargar los registros");
  const resp = await res.json();
  return normalizeRecords(resp);
}

export async function createRecord(data: any): Promise<any> {
  const res = await fetch(`${API}people/timeclock/add-record`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo crear el registro");
  return res.json();
}

export async function updateRecord(data: any): Promise<any> {
  const res = await fetch(`${API}admin/timestamp/update`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo actualizar el registro");
  return res.json();
}

export async function deleteRecord(id: string): Promise<any> {
  const res = await fetch(`${API}people/timeclock/remove-record/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar el registro");
  return res.json();
}
