const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listAreas() {
  const res = await fetch(`${API}areas`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando areas");
  const json = await res.json();
  return json.data;
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
