export async function getN8nHistory(): Promise<any> {
  const res = await fetch("https://n8n.tribcuentasrionegro.gov.ar/webhook/441d79b7-c79b-4d01-b97c-32208d822324");
  if (!res.ok) throw new Error("No se pudo cargar el historial");
  return res.json();
}
