const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getDataUser(): Promise<any> {
  const res = await fetch(`${API}people/profile`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando usuario");
  return res.json();
}

export async function modificateProfileUser(data: {
  first_name: string;
  last_name: string;
  datebirth: string;
  email: string;
  occupation_signature: string;
  location_signature: string;
}): Promise<any> {
  const res = await fetch(`${API}people/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al modificar perfil");
  return res.json();
}

export async function saveImageProfile(formData: FormData): Promise<any> {
  const res = await fetch(`${API}people/upload-avatar`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error("Error al subir imagen");
  return res.json();
}

export async function setBosses(bosses: { cuil: string }[]): Promise<any> {
  const res = await fetch(`${API}people/assign-boss`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ bosses: bosses.map((b) => b.cuil) }),
  });
  if (!res.ok) throw new Error("Error al asignar jefes");
  return res.json();
}
