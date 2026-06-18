const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getCalendarCategories(): Promise<any[]> {
  const res = await fetch(`${API}admin/important-date/category`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar las categorías");
  const resp = await res.json();
  return resp.important_date_categories ?? resp.data ?? resp;
}

export async function createCalendarCategory(data: any): Promise<any> {
  const res = await fetch(`${API}admin/important-date/category`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}

export async function updateCalendarCategory(data: any, id: number): Promise<any> {
  const res = await fetch(`${API}admin/important-date/category`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, important_date_category_id: id }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}

export async function deleteCalendarCategory(id: number): Promise<any> {
  const res = await fetch(`${API}admin/important-date/category`, {
    method: "DELETE",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ important_date_category_id: id }),
  });
  if (!res.ok) throw new Error("No se pudo eliminar la categoría");
  return res.json();
}
