const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getNotes(page = 1, perPage = 10): Promise<any> {
  const res = await fetch(`${API}notes?page=${page}&per_page=${perPage}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar las notas");
  return res.json();
}

export async function getNote(id: string | null): Promise<any> {
  const res = await fetch(`${API}note/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar la nota");
  return res.json();
}

export async function createNote(data: FormData): Promise<any> {
  const res = await fetch(`${API}note`, { method: "POST", headers: authHeaders(), body: data });
  if (!res.ok) throw new Error("No se pudo crear la nota");
  return res.json();
}

export async function modificateNote(data: FormData, id: string | null): Promise<any> {
  const res = await fetch(`${API}note/${id}`, { method: "POST", headers: authHeaders(), body: data });
  if (!res.ok) throw new Error("No se pudo modificar la nota");
  return res.json();
}

export async function deleteNote(id: string): Promise<any> {
  const res = await fetch(`${API}note/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la nota");
  return res.json();
}

export async function deleteNoteImage(noteId: string, imageId: string): Promise<any> {
  const res = await fetch(`${API}note/${noteId}/image/${imageId}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la imagen");
  return res.json();
}

export async function getAllNotes(): Promise<any> {
  const res = await fetch(`${API}notes/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar las notas");
  return res.json();
}

export async function getNotesConfig(): Promise<any> {
  const res = await fetch(`${API}config-notes`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar la configuración");
  return res.json();
}

export async function setNotesConfig(data: any): Promise<any> {
  const res = await fetch(`${API}config-note`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo guardar la configuración");
  return res.json();
}
