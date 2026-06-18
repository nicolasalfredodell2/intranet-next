const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getInternals(signer: string): Promise<any[]> {
  const res = await fetch(`${API}people/get/${signer}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
  return res.json();
}
