const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeRecords(resp: any): any {
  if (!resp?.data) return resp;
  let data: any[] = Array.isArray(resp.data) ? resp.data : Object.values(resp.data);
  data = data.map((item: any) => {
    if (item.type !== undefined && item.type !== null) {
      item.type_id = item.type;
      switch (item.type) {
        case 1: item.type = "Ingreso laboral (inicio de jornada)"; item.canUpdateRecord = true; item.canDeleteRecord = true; break;
        case 2: item.type = "Salida temporal"; item.canDeleteRecord = true; break;
        case 3: item.type = "Regreso salida temporal"; item.canDeleteRecord = true; break;
        case 4: item.type = "Egreso laboral (fin de jornada)"; item.canUpdateRecord = true; item.canDeleteRecord = true; break;
        case 5: item.type = "Salida por salud o cuidado familiar"; item.canDeleteRecord = true; break;
        case 6: item.type = "Inicio de horas extras"; item.canDeleteRecord = true; break;
        case 7: item.type = "Fin de horas extras"; item.canDeleteRecord = true; break;
        case "Officials": item.type = "Oficial"; item.canUpdateExitOrder = true; item.canDeleteExitOrder = true; break;
        case "Unexpected": item.type = "Sin orden de salida"; item.canUpdateExitOrder = true; item.canDeleteExitOrder = true; break;
        case "Individuals": item.type = "Particular"; item.canUpdateExitOrder = true; item.canDeleteExitOrder = true; break;
        case "Education": item.type = "Licencia por estudio/capacitación"; item.canUpdateExitOrder = true; item.canDeleteExitOrder = true; break;
        case "Health": item.type = "Salud o cuidado familiar"; item.canUpdateExitOrder = true; item.canDeleteExitOrder = true; break;
        case "Guild_Meeting_Attendance": item.type = "Asamblea"; item.canUpdateExitOrder = true; item.canDeleteExitOrder = true; break;
        case "Others_Justify": item.type = "Otras justificaciones"; item.canUpdateExitOrder = true; item.canDeleteExitOrder = true; break;
      }
      if (item.type === "Maternity_Breastfeeding") item.type = "Maternidad - Lactancia";
    }

    switch (item.status) {
      case "Waiting": item.class = "warning"; item.statusEnglish = "Waiting"; item.status = "Esperando llegada"; break;
      case "Cancel": item.class = "danger"; item.statusEnglish = "Cancel"; item.status = "Cancelado"; break;
      case "Done": item.class = "success"; item.statusEnglish = "Done"; item.status = "Finalizado"; break;
      case "Pending": item.class = "muted"; item.statusEnglish = "Pending"; item.status = "Pendiente aprobación"; break;
    }

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
