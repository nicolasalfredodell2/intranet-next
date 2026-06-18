const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function exitOrderHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token-for-exit-order-logout") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadExitOrders(): Promise<any[]> {
  const res = await fetch(`${API}personal/exit-orders`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar sus salidas");
  const resp = await res.json();
  return Array.isArray(resp) ? resp : (resp.data ?? []);
}

export async function createExitOrder(data: any): Promise<any> {
  const res = await fetch(`${API}workflow/webservice/personal/exit-order/send`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}

export async function cancelExitOrder(id: string | number): Promise<any> {
  const res = await fetch(`${API}personal/exit-orders/cancel/${id}`, { method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: "{}" });
  if (!res.ok) throw new Error("No se puede cancelar la salida");
  return res.json();
}

export async function loadExitPDF(id: string | number): Promise<ArrayBuffer> {
  const res = await fetch(`${API}personal/exit-orders/view/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se encontró el PDF");
  return res.arrayBuffer();
}

export async function loadExitOrdersAdmin(pagination: { limit: number; page: number }, filters?: any): Promise<any> {
  let url = `${API}admin/all-exit-orders?limit=${pagination.limit}&page=${pagination.page}`;
  if (filters?.user_id) url += `&user_id=${filters.user_id}`;
  if (filters?.month_exit_order) url += `&month_exit_order=${filters.month_exit_order}`;
  const res = await fetch(url, { method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(pagination) });
  if (!res.ok) throw new Error("No se pudieron cargar las salidas");
  return res.json();
}

export async function updateExitOrderAdmin(files: File[], data: any, id: string): Promise<any> {
  const fd = new FormData();
  fd.append("departure_hour", data.departure_hour);
  fd.append("id", id);
  fd.append("status", data.status);
  fd.append("type", data.type);
  if (data.arrival_hour) fd.append("arrival_hour", data.arrival_hour);
  if (files?.length) fd.append("files", files[0]);
  const res = await fetch(`${API}admin/update-exit-order`, { method: "POST", headers: authHeaders(), body: fd });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}

export async function deleteExitOrderAdmin(id: string | number): Promise<any> {
  const res = await fetch(`${API}admin/delete/exit-order/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la orden de salida");
  return res.json();
}

export async function createExitOrderRequest(data: { cuil: string; type: string }): Promise<any> {
  const res = await fetch(`${API}workflow/webservice/personal/exit-order/requestDepartureOrder`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}

export async function createExitOrderAdmin(data: any): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token-for-exit-order-logout") : null;
  const headers: HeadersInit = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const payload = { ...data };
  payload.departure_hour = payload.departure_hour.replace("T", " ") + ":00";
  if (payload.arrival_hour) payload.arrival_hour = payload.arrival_hour.replace("T", " ") + ":00";
  else delete payload.arrival_hour;
  const res = await fetch(`${API}admin/exit-order/create`, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}
