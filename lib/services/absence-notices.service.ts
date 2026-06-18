const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(json = false): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

export async function getNoticesConfig(): Promise<any> {
  const res = await fetch(`${API}personal/notices/metadata`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar la configuración");
  return res.json();
}

export async function getMyNotices(page = 1, perPage = 10, filters: any = {}): Promise<any> {
  let url = `${API}personal/notices?page=${page}&per_page=${perPage}`;
  if (filters.notice_type_id) url += `&notice_type_id=${filters.notice_type_id}`;
  if (filters.notice_reason_id) url += `&notice_reason_id=${filters.notice_reason_id}`;
  if (filters.description) url += `&search=${filters.description}`;
  if (filters.date_from) url += `&date_from=${filters.date_from}`;
  if (filters.date_to) url += `&date_to=${filters.date_to}`;
  if (filters.notice_status_id) url += `&notice_status_id=${filters.notice_status_id}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando avisos");
  const resp = await res.json();
  if (resp.data) {
    resp.data = resp.data.map((item: any) => {
      if (item.notice_date) {
        const m = /^([0-9]{2})-([0-9]{2})-([0-9]{4})$/.exec(item.notice_date);
        if (m) item.notice_date = `${m[3]}-${m[2]}-${m[1]}`;
      }
      return item;
    });
  }
  return resp;
}

export async function createNotice(data: any): Promise<any> {
  const res = await fetch(`${API}personal/notices`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function modificateNotice(data: any, id: string): Promise<any> {
  const res = await fetch(`${API}personal/notices/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function deleteNotice(id: string): Promise<any> {
  const res = await fetch(`${API}personal/notices/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error eliminando aviso");
  return res.json();
}

export async function getAllNoticesAdmin(page = 1, perPage = 10, filters: any = {}): Promise<any> {
  let url = `${API}admin/notices?page=${page}&per_page=${perPage}`;
  if (filters.notice_type_id) url += `&notice_type_id=${filters.notice_type_id}`;
  if (filters.notice_reason_id) url += `&notice_reason_id=${filters.notice_reason_id}`;
  if (filters.description) url += `&search=${filters.description}`;
  if (filters.date_from) url += `&date_from=${filters.date_from}`;
  if (filters.date_to) url += `&date_to=${filters.date_to}`;
  if (filters.notice_status_id) url += `&notice_status_id=${filters.notice_status_id}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando avisos");
  return res.json();
}

export async function modificateNoticeAdmin(data: any, id: string): Promise<any> {
  const res = await fetch(`${API}admin/notices/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}
