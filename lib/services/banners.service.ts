const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getActivatedBanners() {
  const res = await fetch(`${API}banners/published`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando banners");
  const json = await res.json();
  return json.data.reverse();
}

export async function listBanners(): Promise<any[]> {
  const res = await fetch(`${API}banners`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar los banners");
  const resp = await res.json();
  return resp.data.reverse();
}

export async function createBanner(data: FormData): Promise<any> {
  const res = await fetch(`${API}banner`, { method: "POST", headers: authHeaders(), body: data });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function modificateBanner(data: FormData, id: string): Promise<any> {
  const res = await fetch(`${API}banner/${id}`, { method: "POST", headers: authHeaders(), body: data });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return res.json();
}

export async function deleteBanner(id: string): Promise<any> {
  const res = await fetch(`${API}banner/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar el banner");
  return res.json();
}

export async function deleteBannerImage(bannerId: string, imageId: string): Promise<any> {
  const res = await fetch(`${API}banners/${bannerId}/image/${imageId}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la imagen");
  return res.json();
}
