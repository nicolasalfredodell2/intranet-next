const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(contentType?: string): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

export async function getReceipts(cuilSearch: string): Promise<any> {
  let url = `${API}personal/liquidacion`;
  if (cuilSearch) url += `?cuil=${cuilSearch}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar los recibos");
  return res.json();
}

export async function getReceiptPDF(id: string, cuilSearch: string): Promise<ArrayBuffer> {
  let url = `${API}personal/paycheck/${id}`;
  if (cuilSearch) url += `?cuil=${cuilSearch}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("No existe el archivo de esta liquidación");
  return res.arrayBuffer();
}

export async function sendToFirm(id: string, cuilSearch: string): Promise<any> {
  let url = `${API}workflow/webservice/personal/liquidacion/send-to-sign`;
  if (cuilSearch) url += `?cuil=${cuilSearch}`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders("application/json"),
    body: JSON.stringify({ liquidacion_id: id }),
  });
  if (!res.ok) throw new Error("No se pudo enviar a firmar");
  return res.json();
}
