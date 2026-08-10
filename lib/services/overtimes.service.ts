const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadOvertimes(year: number | string, month: number | string): Promise<any> {
  const monthStr = String(month).length === 1 ? `0${month}` : String(month);
  const res = await fetch(`${API}personal/overtime/minutes?year=${year}&month=${monthStr}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("No se pudieron cargar las overtimes");
  return res.json();
}

export async function loadOvertimesByUser(filters: any, data: { user_id: number | string; month: string }): Promise<any> {
  let url = `${API}personal/overtime?user_id=${data.user_id}&month=${data.month}&limit=100&`;

  url += Object.entries(filters)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar los detalles");
  return res.json();
}

export async function updateOvertime(data: any, id: number | string, idUser: number | string): Promise<any> {
  const res = await fetch(`${API}personal/overtime/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ ...data, user_id: idUser }),
  });
  if (!res.ok) throw new Error("No se pudo realizar la modificación");
  return res.json();
}
