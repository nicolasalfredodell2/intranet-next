const API = process.env.NEXT_PUBLIC_API_URL!;
const FILE_SERVICE_API = process.env.NEXT_PUBLIC_FILE_SERVICE_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadFiles(): Promise<any> {
  const res = await fetch(`${API}myfiles`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudo cargar los archivos");
  return res.json();
}

export async function loadFilePDF(path: string): Promise<ArrayBuffer> {
  const fd = new FormData();
  fd.append("path", path);
  fd.append("source", "digital_files");
  const res = await fetch(`${FILE_SERVICE_API}viewFile`, { method: "POST", headers: authHeaders(), body: fd });
  if (!res.ok) throw new Error("No se pudo cargar el archivo");
  return res.arrayBuffer();
}
