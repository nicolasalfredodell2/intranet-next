const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(): HeadersInit {
  return { ...authHeaders(), "Content-Type": "application/json" };
}

export async function loadSurveys(): Promise<any> {
  const res = await fetch(`${API}personal/survey`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar las encuestas");
  return res.json();
}

export async function createSurvey(data: any): Promise<any> {
  const res = await fetch(`${API}personal/survey`, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("No se pudo crear la encuesta");
  return res.json();
}

export async function updateSurvey(data: any, id: string): Promise<any> {
  const res = await fetch(`${API}personal/survey/${id}`, { method: "PUT", headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("No se pudo actualizar la encuesta");
  return res.json();
}

export async function deleteSurvey(id: string): Promise<any> {
  const res = await fetch(`${API}personal/survey/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la encuesta");
  return res.json();
}

export async function enableSurvey(id: string): Promise<any> {
  const res = await fetch(`${API}personal/survey/set-enable/${id}`, { method: "PUT", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo activar la encuesta");
  return res.json();
}

export async function disableSurvey(id: string): Promise<any> {
  const res = await fetch(`${API}personal/survey/set-desable/${id}`, { method: "PUT", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo desactivar la encuesta");
  return res.json();
}

export async function loadSurveyQuestions(id: string): Promise<any> {
  const res = await fetch(`${API}personal/survey/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar las preguntas");
  return res.json();
}

export async function createQuestion(data: any): Promise<any> {
  const res = await fetch(`${API}personal/question`, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("No se pudo crear la pregunta");
  return res.json();
}

export async function updateQuestion(data: any, id: string): Promise<any> {
  const res = await fetch(`${API}personal/question/${id}`, { method: "PUT", headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("No se pudo actualizar la pregunta");
  return res.json();
}

export async function deleteQuestion(id: string): Promise<any> {
  const res = await fetch(`${API}personal/question/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la pregunta");
  return res.json();
}

export async function loadAnswers(questionId: string): Promise<any> {
  const res = await fetch(`${API}personal/question-answer/${questionId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar las respuestas");
  return res.json();
}

export async function createAnswer(data: any): Promise<any> {
  const res = await fetch(`${API}personal/question-answer`, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("No se pudo crear la respuesta");
  return res.json();
}

export async function updateAnswer(data: any, id: string): Promise<any> {
  const res = await fetch(`${API}personal/question-answer/${id}`, { method: "PUT", headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("No se pudo actualizar la respuesta");
  return res.json();
}

export async function deleteAnswer(id: string): Promise<any> {
  const res = await fetch(`${API}personal/question-answer/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo eliminar la respuesta");
  return res.json();
}

export async function loadSurveyReport(id: string): Promise<any> {
  const res = await fetch(`${API}personal/survey/report/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar el reporte");
  return res.json();
}
