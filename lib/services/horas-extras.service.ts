const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function toMonthParam(year: number | string, month: number | string): string {
  return `${year}-${String(month).length === 1 ? `0${month}` : month}`;
}

export async function createHoraExtra(data: any): Promise<any> {
  const res = await fetch(`${API}personal/work-planner`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo crear la hora extra");
  return res.json();
}

export async function deleteHoraExtra(id: number | string): Promise<any> {
  const res = await fetch(`${API}personal/work-planner/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("No se pudo eliminar la hora extra");
  return res.json();
}

export async function loadHorasExtras(data: { year: number | string; month: number | string }): Promise<any> {
  const res = await fetch(`${API}personal/work-planner?type=2&month=${toMonthParam(data.year, data.month)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("No se pudieron cargar las horas extras");
  return res.json();
}

export async function loadAllHorasExtras(data: { year: number | string; month: number | string }): Promise<any> {
  const res = await fetch(
    `${API}personal/work-planner/get-people-with-extra-hours?limit=400&month=${toMonthParam(data.year, data.month)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("No se pudieron cargar las horas extras");
  return res.json();
}

export async function updateHoraExtra(data: any, id: number | string): Promise<any> {
  const res = await fetch(`${API}personal/work-planner/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo modificar la hora extra");
  return res.json();
}
