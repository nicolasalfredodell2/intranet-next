const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAllDates() {
  const res = await fetch(`${API}important-dates`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando fechas");
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function getBirthdays(): Promise<any[]> {
  const res = await fetch(`${API}people/birthdays`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando cumpleaños");
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? json.birthday_dates ?? []);
}

export async function getTodayBirthdays() {
  const res = await fetch(`${API}people/today-birthdays`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando cumpleaños");
  const json = await res.json();
  return json.data.map((person: any) => ({
    ...person,
    avatar_url: person.avatar_url ? person.avatar_url.replace("/storage/", "") : null,
  }));
}

export async function getCalendarEvents(): Promise<any[]> {
  const res = await fetch(`${API}admin/important-dates`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar los eventos");
  const resp = await res.json();
  return Array.isArray(resp) ? resp : (resp.data ?? []);
}

export async function createCalendarEvent(data: FormData): Promise<any> {
  const res = await fetch(`${API}admin/important-date/create`, { method: "POST", headers: authHeaders(), body: data });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}

export async function updateCalendarEvent(data: FormData): Promise<any> {
  const res = await fetch(`${API}admin/important-date/update`, { method: "POST", headers: authHeaders(), body: data });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}

export async function deleteCalendarEvent(important_date_id: string | number): Promise<any> {
  const res = await fetch(`${API}admin/important-date/delete`, {
    method: "DELETE",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ important_date_id }),
  });
  if (!res.ok) throw new Error("No se pudo eliminar el evento");
  return res.json();
}
