const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listMainNews() {
  const res = await fetch(`${API}notes/featured-and-latest`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando noticias principales");
  return res.json();
}

export async function listNews(filters: { title: string; page: number; per_page: number }) {
  const url = `${API}notes/remaining?title=${filters.title}&page=${filters.page}&per_page=${filters.per_page}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando noticias");
  return res.json();
}

export async function getNews(id: string) {
  const res = await fetch(`${API}note/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando noticia");
  return res.json();
}

export async function likeNews(id: string) {
  const res = await fetch(`${API}note/${id}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al dar like");
  return res.json();
}

export async function unlikeNews(id: string) {
  const res = await fetch(`${API}note/${id}/like`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al quitar like");
  return res.json();
}
