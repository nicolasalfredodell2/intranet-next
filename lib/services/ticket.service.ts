const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export async function getSubjects(): Promise<any> {
  const res = await fetch(`${API}admin/subjects-tickets`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar los asuntos");
  return res.json();
}

export async function createSubject(data: { description: string; key: string }): Promise<any> {
  const res = await fetch(`${API}admin/subject-ticket/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function updateSubject(data: { description: string; key: string }, subject_id: string): Promise<any> {
  const res = await fetch(`${API}admin/subject-ticket/update`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ ...data, subject_id }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function deleteSubject(subject_id: string): Promise<any> {
  const res = await fetch(`${API}admin/subject-ticket/delete`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ subject_id }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}
