const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadExitOrdersMonthlyReport(data: { year: number; month: number }): Promise<any> {
  const res = await fetch(`${API}report/minutes-exceeded-monthly`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo cargar los reportes de las órdenes de salida");
  return res.json();
}

export async function loadExitOrdersWeeklyReport(data: any): Promise<any> {
  const res = await fetch(`${API}report/minutes-exceeded-weekly`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo cargar el detalle de las órdenes de salida");
  return res.json();
}
