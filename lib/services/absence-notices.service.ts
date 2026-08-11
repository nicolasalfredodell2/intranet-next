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

function normalizeNoticeDate(value: string): string {
  const m = /^([0-9]{2})[-/]([0-9]{2})[-/]([0-9]{4})$/.exec(value);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : value;
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
      if (item.notice_date) item.notice_date = normalizeNoticeDate(item.notice_date);
      if (item.notice_to) item.notice_to = normalizeNoticeDate(item.notice_to);
      return item;
    });
  }
  return resp;
}

export async function getNotice(id: string | number): Promise<any> {
  const res = await fetch(`${API}personal/notices/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar el aviso");
  const resp = await res.json();
  if (resp.notice_date) resp.notice_date = normalizeNoticeDate(resp.notice_date);
  if (resp.notice_to) resp.notice_to = normalizeNoticeDate(resp.notice_to);
  return resp;
}

export async function getRecipients(): Promise<any> {
  const res = await fetch(`${API}personal/notices/recipients`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar el listado de jefes");
  return res.json();
}

export async function uploadNoticeFile(noticeId: number | string, file: File): Promise<any> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}personal/notices/${noticeId}/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function getNoticeFile(id: number | string): Promise<Blob> {
  const res = await fetch(`${API}personal/notices/files/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo obtener el archivo");
  return res.blob();
}

export async function getNoticeComments(noticeId: number | string): Promise<any[]> {
  const res = await fetch(`${API}personal/notices/${noticeId}/comments`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar los comentarios");
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function sendNoticeComment(noticeId: number | string, message: string): Promise<any> {
  const res = await fetch(`${API}personal/notices/${noticeId}/comments`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || e.errors?.message?.[0] || "No se pudo enviar el comentario");
  }
  return res.json();
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

function normalizeAdminNoticeDates(resp: any): any {
  if (!resp || !Array.isArray(resp.data)) return resp;
  resp.data = resp.data.map((item: any) => {
    if (typeof item?.notice_date === "string") item.notice_date = normalizeNoticeDate(item.notice_date);
    if (typeof item?.notice_to === "string") item.notice_to = normalizeNoticeDate(item.notice_to);
    return item;
  });
  return resp;
}

export async function getAllNoticesAdmin(page = 1, perPage = 10, filters: any = {}): Promise<any> {
  let url = `${API}recursos-humanos/notices?page=${page}&per_page=${perPage}`;
  if (filters.notice_type_id) url += `&notice_type_id=${filters.notice_type_id}`;
  if (filters.notice_reason_id) url += `&notice_reason_id=${filters.notice_reason_id}`;
  if (filters.description) url += `&search=${filters.description}`;
  if (filters.date_from) url += `&date_from=${filters.date_from}`;
  if (filters.date_to) url += `&date_to=${filters.date_to}`;
  if (filters.notice_status_id) url += `&notice_status_id=${filters.notice_status_id}`;
  if (filters.legajo) url += `&legajo=${filters.legajo}`;
  if (filters.name) url += `&search=${filters.name}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando avisos");
  const resp = await res.json();
  return normalizeAdminNoticeDates(resp);
}

export async function deleteNoticeAdmin(id: string): Promise<any> {
  const res = await fetch(`${API}personal/notices/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error eliminando aviso");
  return res.json();
}

export async function modificateNoticeAdmin(data: any, id: string): Promise<any> {
  const res = await fetch(`${API}recursos-humanos/notices/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function updateNoticeStatusAdmin(id: number | string, data: { status: string; rejection_reason?: string }): Promise<any> {
  const res = await fetch(`${API}recursos-humanos/notices/${id}/status`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function changeNoticeStatusAdmin(id: number | string, data: { notice_status_id: number; observation?: string; rejection_reason?: string }): Promise<any> {
  const res = await fetch(`${API}recursos-humanos/notices/${id}/status`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function rejectNoticeAttachment(attachmentId: string | number, reason: string): Promise<any> {
  const res = await fetch(`${API}recursos-humanos/notices/attachments/${attachmentId}/reject`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}
