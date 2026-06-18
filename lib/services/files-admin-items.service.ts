const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadFileCategories(): Promise<any[]> {
  const res = await fetch(`${API}legajo/item`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar las categorías");
  const resp = await res.json();
  return Array.isArray(resp) ? resp : (resp.data ?? resp);
}

export async function createFileCategory(data: any): Promise<any> {
  const res = await fetch(`${API}legajo/item`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, order: String(data.order ?? 1) }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.errors?.name ?? e.message ?? "Error"); }
  return res.json();
}

export async function updateFileCategory(data: any): Promise<any> {
  const res = await fetch(`${API}legajo/item/${data.id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.errors?.name ?? e.message ?? "Error"); }
  return res.json();
}

export async function deleteFileCategory(id: string | number): Promise<any> {
  const res = await fetch(`${API}legajo/item/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la categoría");
  return res.json();
}

export async function createFileSubcategory(data: any): Promise<any> {
  const res = await fetch(`${API}legajo/sub-item`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.errors?.name ?? e.message ?? "Error"); }
  return res.json();
}

export async function updateFileSubcategory(data: any): Promise<any> {
  const res = await fetch(`${API}legajo/sub-item/${data.id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.errors?.name ?? e.message ?? "Error"); }
  return res.json();
}

export async function deleteFileSubcategory(id: string | number): Promise<any> {
  const res = await fetch(`${API}legajo/sub-item/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la subcategoría");
  return res.json();
}

export async function getSubcategoryUsers(subitemId: string | number): Promise<any[]> {
  const res = await fetch(`${API}legajo/sub-item/show-users-linked/${subitemId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo obtener los usuarios");
  const resp = await res.json();
  return Array.isArray(resp) ? resp : (resp.data ?? resp);
}

export async function loadFilesForUser(userId: string | number): Promise<any> {
  const res = await fetch(`${API}legajo/${userId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar los archivos del usuario");
  return res.json();
}

export async function uploadFileForUser(data: { files: File[]; people_id: string; sub_item_id: string }): Promise<any> {
  const fd = new FormData();
  data.files.forEach((f) => fd.append("file", f));
  fd.append("people_id", data.people_id);
  fd.append("sub_item_id", data.sub_item_id);
  const res = await fetch(`${API}legajo/legajo`, { method: "POST", headers: authHeaders(), body: fd });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? "Error"); }
  return res.json();
}

export async function deleteUserFile(id: string | number): Promise<any> {
  const res = await fetch(`${API}legajo/legajo/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar el archivo");
  return res.json();
}

export async function searchUsers(query: string): Promise<any[]> {
  const res = await fetch(`${API}people/get/${encodeURIComponent(query)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo buscar los usuarios");
  const resp = await res.json();
  return Array.isArray(resp) ? resp : (resp.data ?? resp);
}
