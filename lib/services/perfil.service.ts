const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getDataUser(): Promise<any> {
  const res = await fetch(`${API}people/profile`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando usuario");
  return res.json();
}

export async function modificateProfileUser(data: {
  first_name: string;
  last_name: string;
  datebirth: string;
  email: string;
  occupation_signature: string;
  location_signature: string;
}): Promise<any> {
  const res = await fetch(`${API}people/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al modificar perfil");
  return res.json();
}

export async function saveImageProfile(
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<any> {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}people/upload-avatar`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
        } catch {
          resolve(null);
        }
      } else {
        reject(new Error("Error al subir imagen"));
      }
    };
    xhr.onerror = () => reject(new Error("Error al subir imagen"));
    xhr.send(formData);
  });
}

export async function setBosses(bosses: { cuil: string }[]): Promise<any> {
  const res = await fetch(`${API}people/assign-boss`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ bosses: bosses.map((b) => b.cuil) }),
  });
  if (!res.ok) throw new Error("Error al asignar jefes");
  return res.json();
}
