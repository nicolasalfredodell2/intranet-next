const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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
