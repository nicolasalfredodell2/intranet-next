const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getInternals(search: string) {
  const res = await fetch(`${API}people/get/${encodeURIComponent(search)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error cargando internos");
  return res.json();
}
