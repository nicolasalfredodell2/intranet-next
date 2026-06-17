const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function toArray(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (json?.data && Array.isArray(json.data)) return json.data;
  return [];
}

export async function loadSurveys() {
  const res = await fetch(`${API}personal/survey/get-enables`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando encuestas");
  return toArray(await res.json());
}

export async function loadSurveysWithMyResponse() {
  const res = await fetch(`${API}personal/survey/answer/by/user`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando respuestas");
  return toArray(await res.json());
}

export async function loadSurveyReport(id: string) {
  const res = await fetch(`${API}personal/survey/report/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando reporte");
  return res.json();
}

export async function sendSurveyAnswer(data: { question_id: string; answer_id: string }) {
  const res = await fetch(`${API}personal/people-answer`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error enviando respuesta");
  return res.json();
}
