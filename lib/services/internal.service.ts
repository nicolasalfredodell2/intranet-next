const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getInternals(signer: string, filters?: Record<string, any>): Promise<any[]> {
  let url = `${API}people/get/${signer}`;
  if (filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.append(key, String(value));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
  return res.json();
}
