const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAllDates() {
  const res = await fetch(`${API}important-dates`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando fechas");
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function getTodayBirthdays() {
  const res = await fetch(`${API}people/today-birthdays`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando cumpleaños");
  const json = await res.json();
  return json.data.map((person: any) => ({
    ...person,
    avatar_url: person.avatar_url ? person.avatar_url.replace("/storage/", "") : null,
  }));
}
