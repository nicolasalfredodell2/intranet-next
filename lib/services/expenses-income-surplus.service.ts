const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function changeJustified(id: number | string): Promise<any> {
  const res = await fetch(`${API}people/timeclock/set-justified-record`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("No se pudo justificar el registro");
  return res.json();
}

export async function loadDetailReportForIncomeAndExpenses(data: any): Promise<any> {
  const res = await fetch(`${API}report/user/late-arrivals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudieron cargar los detalles");
  return res.json();
}

export async function loadReportsForIncomeAndExpenses(data: { year: number; month: number }): Promise<any> {
  const res = await fetch(`${API}report/working-time`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo cargar los minutos excedentes");
  return res.json();
}
