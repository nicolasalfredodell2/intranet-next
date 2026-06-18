const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listAreas(): Promise<any[]> {
  const res = await fetch(`${API}areas`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar las areas");
  const resp = await res.json();
  return resp.data;
}

export async function getArea(id: string) {
  const res = await fetch(`${API}areas/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando area");
  return res.json();
}

export async function getAreaInfo(areaId: string) {
  const res = await fetch(`${API}areas/${areaId}/info-areas`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando info de area");
  const json = await res.json();
  return json.data;
}

export async function createArea(data: { title: string; description: string }): Promise<any> {
  const res = await fetch(`${API}areas`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function modificateArea(data: { title: string; description: string }, id: string): Promise<any> {
  const res = await fetch(`${API}areas/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function deleteArea(id: string): Promise<any> {
  const res = await fetch(`${API}areas/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar el area");
  return res.json();
}
