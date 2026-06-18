const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadDailyPart(filters?: any): Promise<any> {
  const res = await fetch(`${API}report/daily`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: filters ? JSON.stringify(filters) : null,
  });
  if (!res.ok) throw new Error("No se pudieron cargar las fichadas");
  return res.json();
}
