const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAllBosses(): Promise<any> {
  const res = await fetch(`${API}people/bosses/get-all`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar los jefes");
  return res.json();
}

export async function getAllBossesForLegajo(legajo: string): Promise<any> {
  const res = await fetch(`${API}people/bosses/getBosses/${legajo}`);
  if (!res.ok) throw new Error("No se pudieron cargar los jefes");
  return res.json();
}
