const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getActivatedBanners() {
  const res = await fetch(`${API}banners/published`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando banners");
  const json = await res.json();
  return json.data;
}
