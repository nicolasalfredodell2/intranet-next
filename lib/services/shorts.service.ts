const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listShorts(): Promise<any[]> {
  const res = await fetch(`${API}shorts`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar los shorts");
  const resp = await res.json();
  return resp.data;
}

export async function createShort(data: FormData): Promise<any> {
  const res = await fetch(`${API}shorts`, { method: "POST", headers: authHeaders(), body: data });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function modificateShort(data: FormData, id: string): Promise<any> {
  const res = await fetch(`${API}shorts/${id}`, { method: "POST", headers: authHeaders(), body: data });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  const resp = await res.json();
  return resp.data ?? resp;
}

export async function deleteShort(id: string): Promise<any> {
  const res = await fetch(`${API}shorts/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar el short");
  return res.json();
}

export async function getActivatedShorts() {
  const res = await fetch(`${API}shorts/published`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando shorts");
  const json = await res.json();
  return json.data;
}

export async function likeShort(id: string) {
  const res = await fetch(`${API}short/${id}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al dar like");
  return res.json();
}

export async function dislikeShort(id: string) {
  const res = await fetch(`${API}short/${id}/like`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al quitar like");
  return res.json();
}
