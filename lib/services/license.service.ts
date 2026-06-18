const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadLicenses(): Promise<any> {
  const cuil = typeof window !== "undefined" ? localStorage.getItem("user") : "";
  const res = await fetch(`${API}personal/licenses?cuil=${cuil}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar las licencias");
  return res.json();
}
