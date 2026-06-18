const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadAllGroups(): Promise<any> {
  const res = await fetch(`${API}internal/people/getworkgroup`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar los grupos");
  return res.json();
}

export async function saveGroupQR(workGroupId: string, file: Blob): Promise<any> {
  const formData = new FormData();
  formData.append("work_group_id", workGroupId);
  formData.append("file", file);

  const res = await fetch(`${API}group-signature/store`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error("No se pudo guardar el QR");
  return res.json();
}
